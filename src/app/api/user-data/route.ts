import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import clientPromise from "../../../lib/mongodb";
import { Session } from "next-auth";

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, blocks, masterChecklist, wakeTime, habitBreakChecklist } =
      await request.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    // Upsert user data for the specific date
    await userData.updateOne(
      { userId: session.user.id, date },
      {
        $set: {
          userId: session.user.id,
          date,
          blocks,
          masterChecklist,
          wakeTime,
          habitBreakChecklist,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Save data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    const data = await userData.findOne({ userId: session.user.id, date });

    if (!data) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        blocks: data.blocks,
        masterChecklist: data.masterChecklist,
        wakeTime: data.wakeTime,
        habitBreakChecklist: data.habitBreakChecklist,
      },
    });
  } catch (error) {
    console.error("Load data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
