import { config } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";

const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

const base = process.env.BASE_URL || "http://localhost:3001";
const email = process.env.ADMIN_EMAIL || "knoxvilledan@yahoo.com";
const password = process.env.ADMIN_PASSWORD || "Temp-Admin#2025!";
const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("MONGODB_URI not set");

function parseSetCookies(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return [];
  // handle multiple cookies separated by comma only if not within attributes; simplest split by ",\n" or treat as single cookie
  // Many servers send multiple Set-Cookie headers; undici collapses. Try to split by comma followed by space and a non-space token with '='.
  const parts = raw.split(/,(?=[^ ;]+=)/g);
  return parts.map((p) => p.split(";")[0].trim());
}

function mergeCookies(jar, newOnes) {
  const map = new Map(jar.map((c) => [c.split("=")[0], c]));
  for (const c of newOnes) map.set(c.split("=")[0], c);
  return Array.from(map.values());
}

async function e2e() {
  const cookies = [];

  // 1) CSRF token
  const csrfRes = await fetch(`${base}/api/auth/csrf`, {
    method: "GET",
    redirect: "manual",
  });
  const csrfCookies = parseSetCookies(csrfRes);
  if (csrfCookies.length) {
    cookies.push(...csrfCookies);
  }
  const csrf = await csrfRes.json();
  if (!csrf?.csrfToken) throw new Error("No csrfToken");

  // 2) Credentials login
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password,
    callbackUrl: `${base}/`,
    json: "true",
  });
  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookies.join("; "),
    },
    body,
    redirect: "manual",
  });
  const loginSet = parseSetCookies(loginRes);
  const jar = mergeCookies(cookies, loginSet);

  // 3) Session check
  const sessRes = await fetch(`${base}/api/auth/session`, {
    headers: { cookie: jar.join("; ") },
  });
  const session = await sessRes.json();
  if (!session?.user?.email) throw new Error("Session not established");

  // 4) Determine today
  const today = new Date();
  const d = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const dateStr = d.toISOString().slice(0, 10);

  // 5) GET user-data (should be default or empty)
  const getRes1 = await fetch(`${base}/api/user-data?date=${dateStr}`, {
    headers: { cookie: jar.join("; ") },
  });
  const before = await getRes1.json();

  // 6) POST user-data (temporary)
  const payload = {
    date: dateStr,
    wakeTime: "06:00",
    blocks: [
      { time: "06:00 AM", label: "E2E Temp", notes: [], complete: false },
      { time: "07:00 AM", label: "E2E Temp 2", notes: [], complete: true },
    ],
    masterChecklist: [],
    habitBreakChecklist: [],
    todoList: [],
  };
  const postRes = await fetch(`${base}/api/user-data`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: jar.join("; ") },
    body: JSON.stringify(payload),
  });
  const postJson = await postRes.json();

  // 7) GET to verify persistence
  const getRes2 = await fetch(`${base}/api/user-data?date=${dateStr}`, {
    headers: { cookie: jar.join("; ") },
  });
  const after = await getRes2.json();

  // 8) Cleanup: delete the created doc
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const user = await db
    .collection("users")
    .findOne({ email: email.toLowerCase() });
  if (user?._id) {
    await db
      .collection("user_data")
      .deleteOne({ userId: String(user._id), date: dateStr });
  }
  await client.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        session: { user: session.user.email },
        date: dateStr,
        before,
        post: postJson,
        after,
      },
      null,
      2
    )
  );
}

e2e().catch((e) => {
  console.error("E2E_FAIL", e);
  process.exit(1);
});
