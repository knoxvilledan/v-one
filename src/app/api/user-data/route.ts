import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import dbConnect from "../../../lib/dbConnect";
import { UserData, type IUserData } from "../../../models/UserData";
import type {
  TimeBlockTemplate,
  ChecklistTemplate,
} from "../../../types/content";
import { Session } from "next-auth";
import { Block, ChecklistItem, DayData } from "../../../types";
import { formatDisplayDate, parseStorageDate } from "../../../lib/date-utils";
import { ContentService } from "../../../lib/content-service";
import { z } from "zod";
import { ensureIndexes } from "../../../lib/db-indexes";

const blockSchema = z.object({
  id: z.string().optional(),
  time: z.string(),
  label: z.string().max(120),
  notes: z.array(z.string()).default([]),
  complete: z.boolean().default(false),
  duration: z.number().optional(),
  index: z.number().optional(),
  todos: z.array(z.any()).optional().default([]),
});

const checklistItemSchema = z.object({
  _id: z.any().optional(),
  id: z.string(),
  text: z.string().max(200),
  completed: z.boolean().optional(),
  category: z
    .enum([
      "morning",
      "work",
      "tech",
      "house",
      "wrapup",
      "lsd",
      "financial",
      "youtube",
      "time",
      "entertainment",
      "todo",
      "strength",
      "cardio",
      "yoga",
      "stretching",
      "sports",
      "walking",
    ])
    .optional(),
  completedAt: z.any().optional(),
  targetBlock: z.number().optional(),
  // New fields for enhanced time tracking
  completionTimezone: z.string().optional(),
  timezoneOffset: z.number().optional(),
});

type ZChecklistItem = z.infer<typeof checklistItemSchema>;

const payloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wakeTime: z.string().optional(),
  blocks: z.array(blockSchema),
  masterChecklist: z.array(checklistItemSchema).optional(),
  habitBreakChecklist: z.array(checklistItemSchema).optional(),
  workoutChecklist: z.array(checklistItemSchema).optional(),
  todoList: z.array(checklistItemSchema).optional(),
  // New fields for daily wake settings and timezone
  dailyWakeTime: z.string().optional(),
  userTimezone: z.string().optional(),
});

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

    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
      date,
      wakeTime,
      blocks,
      masterChecklist,
      habitBreakChecklist,
      workoutChecklist,
      todoList,
      dailyWakeTime,
      userTimezone,
    } = parsed.data;
    const fallbackCategory = "todo" as const;
    const normalize = (arr?: ZChecklistItem[]): ChecklistItem[] | undefined =>
      arr
        ? (arr.map((i: ZChecklistItem) => ({
            ...i,
            completed: !!i.completed,
            category: (i.category ??
              fallbackCategory) as ChecklistItem["category"],
          })) as ChecklistItem[])
        : undefined;

    const normalizedMaster = normalize(masterChecklist);
    const normalizedHabits = normalize(habitBreakChecklist);
    const normalizedWorkouts = normalize(workoutChecklist);
    const normalizedTodos = normalize(todoList);

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Parse the date and create display format
    const dateObj = parseStorageDate(date);
    const displayDate = formatDisplayDate(dateObj);

    await dbConnect();
    await ensureIndexes();

    // Ensure blocks have IDs
    const blocksWithIds = blocks.map((block, index) => ({
      ...block,
      id: block.id || `block-${index}`,
    }));

    // Calculate basic score (you can enhance this)
    const score = (blocksWithIds as Block[]).reduce(
      (acc: number, block: Block) => {
        return acc + (block.complete ? 1 : 0);
      },
      0
    );

    // Create the day data object
    const dayData: Partial<DayData> = {
      date,
      displayDate,
      wakeTime,
      blocks: blocksWithIds,
      masterChecklist: normalizedMaster,
      habitBreakChecklist: normalizedHabits,
      workoutChecklist: normalizedWorkouts,
      todoList: normalizedTodos,
      score,
      userId: user._id!.toString(),
      updatedAt: new Date(),
      // Store new wake time and timezone fields
      dailyWakeTime,
      userTimezone,
    };

    // Upsert user data for the specific date
    await UserData.updateOne(
      { userId: user._id!.toString(), date },
      { $set: dayData },
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

    await dbConnect();
    await ensureIndexes();

    if (date) {
      // Get specific date data
      const data = await UserData.findOne({
        userId: user._id!.toString(),
        date,
      }).lean<IUserData | null>();

      if (!data) {
        // Get default data from content templates
        const contentTemplate = await ContentService.getContentTemplateByRole(
          user.role
        );

        if (contentTemplate) {
          const defaultData: {
            blocks: Block[];
            masterChecklist: ChecklistItem[];
            wakeTime: string;
            habitBreakChecklist: ChecklistItem[];
            workoutChecklist: ChecklistItem[];
            todoList: ChecklistItem[];
            dailyWakeTime?: string;
            userTimezone?: string;
          } = {
            blocks:
              contentTemplate.content.timeBlocks?.map(
                (tb: TimeBlockTemplate) => ({
                  id: tb.id,
                  time: tb.time,
                  label: tb.label,
                  notes: [],
                  complete: false,
                })
              ) || [],
            masterChecklist:
              contentTemplate.content.masterChecklist?.map(
                (mc: ChecklistTemplate) => ({
                  id: mc.id,
                  text: mc.text,
                  completed: false,
                  category: mc.category as ChecklistItem["category"],
                })
              ) || [],
            wakeTime: "",
            habitBreakChecklist:
              contentTemplate.content.habitBreakChecklist?.map(
                (hb: ChecklistTemplate) => ({
                  id: hb.id,
                  text: hb.text,
                  completed: false,
                  category: hb.category as ChecklistItem["category"],
                })
              ) || [],
            workoutChecklist:
              contentTemplate.content.workoutChecklist?.map(
                (wc: ChecklistTemplate) => ({
                  id: wc.id,
                  text: wc.text,
                  completed: false,
                  category: wc.category as ChecklistItem["category"],
                })
              ) || [],
            todoList: [],
          };

          return NextResponse.json({ data: defaultData });
        }

        return NextResponse.json({ data: null });
      }

      return NextResponse.json({
        data: {
          blocks: data.blocks.map((block, index) => ({
            ...block,
            id: block.id || `block-${index}`, // Ensure blocks have IDs
          })),
          masterChecklist: data.masterChecklist,
          wakeTime: data.wakeTime,
          habitBreakChecklist: data.habitBreakChecklist,
          workoutChecklist: data.workoutChecklist || [],
          todoList: data.todoList || [],
          dailyWakeTime: data.dailyWakeTime,
          userTimezone: data.userTimezone,
        },
      });
    } else {
      // Get all user data organized by dates
      const allData = await UserData.find({
        userId: user._id!.toString(),
      }).lean<IUserData[]>();

      const days: {
        [key: string]: {
          blocks: Block[];
          masterChecklist: ChecklistItem[];
          wakeTime: string;
          habitBreakChecklist: ChecklistItem[];
          workoutChecklist: ChecklistItem[];
          todoList: ChecklistItem[];
          dailyWakeTime?: string;
          userTimezone?: string;
        };
      } = {};

      (allData as IUserData[]).forEach((item: IUserData) => {
        days[item.date] = {
          blocks: item.blocks,
          masterChecklist: item.masterChecklist,
          wakeTime: item.wakeTime,
          habitBreakChecklist: item.habitBreakChecklist,
          workoutChecklist: item.workoutChecklist || [],
          todoList: item.todoList || [],
          dailyWakeTime: item.dailyWakeTime,
          userTimezone: item.userTimezone,
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
