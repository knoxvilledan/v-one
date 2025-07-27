import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import clientPromise from "../../../lib/mongodb";
import { Session } from "next-auth";
import { Block, ChecklistItem, DayData } from "../../../types";
import { formatDisplayDate, parseStorageDate } from "../../../lib/date-utils";
import { ContentService } from "../../../lib/content-service";

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user
    let user = await ContentService.getUserByEmail(session.user.email);
    if (!user) {
      user = await ContentService.createUser(
        session.user.email,
        session.user.name || undefined,
        "public"
      );
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
      userId: user._id!.toString(),
      updatedAt: new Date(),
    };

    // Upsert user data for the specific date
    await userData.updateOne(
      { userId: user._id!.toString(), date },
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user
    let user = await ContentService.getUserByEmail(session.user.email);
    if (!user) {
      user = await ContentService.createUser(
        session.user.email,
        session.user.name || undefined,
        "public"
      );
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    if (date) {
      // Get specific date data
      const data = await userData.findOne({
        userId: user._id!.toString(),
        date,
      });

      if (!data) {
        // Get default data from content templates
        const contentTemplate = await ContentService.getContentTemplateByRole(
          user.role
        );

        if (contentTemplate) {
          const defaultData = {
            blocks:
              contentTemplate.content.timeBlocks?.map((tb) => ({
                time: tb.time,
                label: tb.label,
                notes: [],
                complete: false,
              })) || [],
            masterChecklist:
              contentTemplate.content.masterChecklist?.map((mc) => ({
                id: mc.id,
                text: mc.text,
                completed: false,
                category: mc.category,
              })) || [],
            wakeTime: "",
            habitBreakChecklist:
              contentTemplate.content.habitBreakChecklist?.map((hb) => ({
                id: hb.id,
                text: hb.text,
                completed: false,
                category: hb.category,
              })) || [],
            todoList: [],
          };

          return NextResponse.json({ data: defaultData });
        }

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
        .find({ userId: user._id!.toString() })
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
