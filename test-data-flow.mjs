import mongoose from "mongoose";

// Connect to MongoDB
const MONGODB_URI =
  "mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1";

// DayEntry schema (simplified)
const dayEntrySchema = new mongoose.Schema({
  userId: String,
  date: String,
  timeBlockCompletions: Array,
  checklistCompletions: Object,
  wakeTime: String,
  createdAt: Date,
  updatedAt: Date,
});

const DayEntry = mongoose.model("DayEntry", dayEntrySchema, "dayEntries");

async function testDataFlow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🔗 Connected to MongoDB for data flow test");

    const userId = "68a21bece3d65e6fbfdf347c"; // dannelsonjfn@gmail.com user ID
    const testDate = "2025-09-12";

    console.log(`\n🔍 Testing data flow for user ${userId} on ${testDate}`);

    // Check what exists in DayEntry collection
    const existingEntry = await DayEntry.findOne({ userId, date: testDate });
    console.log(
      "\n📖 Current DayEntry:",
      JSON.stringify(existingEntry, null, 2)
    );

    // Test writing a simple completion - fix the data structure issue
    console.log("\n✍️  Testing write operation...");
    const writeResult = await DayEntry.findOneAndUpdate(
      { userId, date: testDate },
      {
        $set: {
          wakeTime: "06:30",
          updatedAt: new Date(),
          // Fix: checklistCompletions should be an object, not array
          checklistCompletions: {
            "master-checklist": [
              {
                itemId: "test-item-123",
                completedAt: new Date(),
              },
            ],
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log("✅ Write successful:", JSON.stringify(writeResult, null, 2));

    // Test reading it back
    console.log("\n📖 Testing read operation...");
    const readResult = await DayEntry.findOne({ userId, date: testDate });
    console.log("✅ Read successful:", JSON.stringify(readResult, null, 2));

    // Check if the data persists
    console.log("\n🔄 Verifying persistence...");
    const verifyResult = await DayEntry.findOne({
      userId,
      date: testDate,
      wakeTime: "06:30",
    });

    if (verifyResult) {
      console.log("✅ Data persistence VERIFIED - modern system working!");
    } else {
      console.log("❌ Data persistence FAILED");
    }

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error in data flow test:", error);
    process.exit(1);
  }
}

testDataFlow();
