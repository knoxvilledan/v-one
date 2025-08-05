#!/usr/bin/env node
// Test script to verify email/password signup and authentication
require("dotenv").config({ path: ".env.local" });

const fetch = require("node-fetch");

async function testEmailPasswordAuth() {
  const baseUrl = "http://localhost:3000";

  try {
    console.log("🧪 Testing Email/Password Authentication...\n");

    // Test signup
    console.log("1. Testing signup with email/password...");
    const signupData = {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: "testpassword123",
    };

    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData),
    });

    if (signupResponse.ok) {
      console.log("✅ Signup successful");
      const signupResult = await signupResponse.json();
      console.log("   Result:", signupResult.message);
    } else {
      const error = await signupResponse.json();
      console.log("❌ Signup failed:", error.error);
      return;
    }

    console.log("\n2. Testing duplicate email signup...");
    const duplicateResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData),
    });

    if (!duplicateResponse.ok) {
      const error = await duplicateResponse.json();
      console.log("✅ Duplicate email properly rejected:", error.error);
    } else {
      console.log("❌ Duplicate email should have been rejected");
    }

    console.log("\n3. Testing invalid password length...");
    const shortPasswordResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User 2",
        email: `test2-${Date.now()}@example.com`,
        password: "123",
      }),
    });

    if (!shortPasswordResponse.ok) {
      const error = await shortPasswordResponse.json();
      console.log("✅ Short password properly rejected:", error.error);
    } else {
      console.log("❌ Short password should have been rejected");
    }

    console.log("\n4. Testing NextAuth providers endpoint...");
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);

    if (providersResponse.ok) {
      const providers = await providersResponse.json();
      console.log("✅ NextAuth providers available:");
      Object.keys(providers).forEach((key) => {
        console.log(`   - ${providers[key].name} (${providers[key].type})`);
      });
    } else {
      console.log("❌ Failed to fetch providers");
    }

    console.log("\n🎉 Email/Password authentication test completed!");
    console.log("\n📋 Next steps:");
    console.log("   1. Get Google OAuth credentials from Google Cloud Console");
    console.log(
      "   2. Update .env.local with real GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    );
    console.log("   3. Test both authentication methods in the browser");
    console.log("   4. Sign up at http://localhost:3000/auth/signup");
    console.log("   5. Sign in at http://localhost:3000/auth/signin");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testEmailPasswordAuth();
