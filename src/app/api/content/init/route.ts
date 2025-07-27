import { NextResponse } from "next/server";
import { ContentService } from "../../../../lib/content-service";

// POST /api/content/init - Initialize default content templates
export async function POST() {
  try {
    const success = await ContentService.createDefaultContentTemplates();

    if (success) {
      return NextResponse.json({
        message: "Default content templates created successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to create default content templates" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error initializing content templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
