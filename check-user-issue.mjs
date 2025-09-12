import mongoose from "mongoose";

// Connect to MongoDB using the URI from env
const MONGODB_URI =
  "mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1";

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  username: String,
  adminViewMode: String,
  createdAt: Date,
});

const User = mongoose.model("User", userSchema);

async function checkUserIssue() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("🔍 Checking user records for dannelsonjfn@gmail.com...");

    const users = await User.find({ email: "dannelsonjfn@gmail.com" }).lean();
    console.log(`Found ${users.length} user record(s):`);

    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.createdAt}`);
      if (user.adminViewMode) {
        console.log(`  Admin View Mode: ${user.adminViewMode}`);
      }
    });

    console.log("\n🔍 Checking all users for potential conflicts...");
    const allUsers = await User.find().lean();
    console.log(`Total users in database: ${allUsers.length}`);

    allUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      if (user.username) {
        console.log(`  Username: ${user.username}`);
      }
      if (user.adminViewMode) {
        console.log(`  Admin View Mode: ${user.adminViewMode}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUserIssue();
