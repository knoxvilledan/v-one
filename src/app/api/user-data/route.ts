import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import clientPromise from "../../../lib/mongodb";
import { Session } from "next-auth";
import { Block, ChecklistItem, DayData } from "../../../types";
import { formatDisplayDate, parseStorageDate } from "../../../lib/date-utils";

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      date,
      wakeTime,
      blocks,
      masterChecklist,
      habitBreakChecklist,
      todoList,
    } = await request.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Parse the date and create display format
    const dateObj = parseStorageDate(date);
    const displayDate = formatDisplayDate(dateObj);

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    // Calculate basic score (you can enhance this)
    const score = blocks.reduce((acc: number, block: Block) => {
      return acc + (block.complete ? 1 : 0);
    }, 0);

    // Create the day data object
    const dayData: Partial<DayData> = {
      date,
      displayDate,
      wakeTime,
      blocks,
      masterChecklist,
      habitBreakChecklist,
      todoList,
      score,
      updatedAt: new Date(),
    };

    // Upsert user data for the specific date
    await userData.updateOne(
      { userId: session.user.id, date },
      {
        $set: dayData,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Data saved successfully",
      date,
      displayDate,
      score,
    });
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

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    if (date) {
      // Get specific date data
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
          todoList: data.todoList || [],
        },
      });
    } else {
      // Get all user data organized by dates
      const allData = await userData
        .find({ userId: session.user.id })
        .toArray();

      const days: {
        [key: string]: {
          blocks: Block[];
          masterChecklist: ChecklistItem[];
          wakeTime: string;
          habitBreakChecklist: ChecklistItem[];
          todoList: ChecklistItem[];
        };
      } = {};

      allData.forEach((item) => {
        days[item.date] = {
          blocks: item.blocks,
          masterChecklist: item.masterChecklist,
          wakeTime: item.wakeTime,
          habitBreakChecklist: item.habitBreakChecklist,
          todoList: item.todoList || [],
        };
      });

      return NextResponse.json({
        data: { days },
      });
    }
  } catch (error) {
    console.error("Load data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
