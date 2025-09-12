import mongoose from "mongoose";
import { HydrationService } from "./src/lib/hydration.ts";

// Connect to MongoDB
const MONGODB_URI =
  "mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1";

async function testUIDataStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🔗 Connected to MongoDB for UI data structure test");

    const email = "dannelsonjfn@gmail.com";
    const testDate = "2025-09-12";

    console.log(`\n🔍 Testing UI data structure for ${email} on ${testDate}`);

    // Use the HydrationService to get data the same way the UI does
    const userData = await HydrationService.hydrateUserData(email, testDate);

    if (!userData) {
      console.log("❌ No user data returned");
      return;
    }

    console.log("\n📊 User Data Structure:");
    console.log("User:", userData.user);
    console.log(
      "Template Set Time Blocks Count:",
      userData.templateSet.timeBlocks.length
    );
    console.log(
      "Template Set Checklists Count:",
      userData.templateSet.checklists.length
    );

    if (userData.todayEntry) {
      console.log("\n📅 Today's Entry:");
      console.log("Date:", userData.todayEntry.date);
      console.log(
        "Time Block Completions:",
        userData.todayEntry.timeBlockCompletions?.length || 0
      );
      console.log(
        "Checklist Completions Type:",
        typeof userData.todayEntry.checklistCompletions
      );
      console.log(
        "Checklist Completions Length:",
        Array.isArray(userData.todayEntry.checklistCompletions)
          ? userData.todayEntry.checklistCompletions.length
          : "Not an array"
      );

      if (Array.isArray(userData.todayEntry.checklistCompletions)) {
        console.log(
          "✅ checklistCompletions is now an array (frontend compatible)"
        );
        userData.todayEntry.checklistCompletions.forEach(
          (completion, index) => {
            console.log(
              `  ${index + 1}. ${completion.checklistId}: ${
                completion.completedItemIds?.length || 0
              } completed items`
            );
          }
        );
      } else {
        console.log("❌ checklistCompletions is still not an array");
      }

      console.log("\n🎯 Sample Time Block Completions:");
      userData.todayEntry.timeBlockCompletions
        ?.slice(0, 3)
        .forEach((completion, index) => {
          console.log(
            `  ${index + 1}. Block ${completion.blockId}: ${
              completion.label
            } at ${completion.time}`
          );
          if (completion.notes) {
            console.log(`     Notes: "${completion.notes}"`);
          }
        });
    } else {
      console.log("\n📅 No today entry found");
    }

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    console.log("\n🎉 UI data structure test completed!");
  } catch (error) {
    console.error("❌ Error in UI data structure test:", error);
    process.exit(1);
  }
}

testUIDataStructure();
