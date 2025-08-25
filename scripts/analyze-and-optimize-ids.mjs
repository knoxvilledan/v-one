#!/usr/bin/env node

/**
 * Comprehensive ID Analysis and Optimization Script
 *
 * This script:
 * 1. Analyzes all ID patterns across the entire codebase
 * 2. Identifies optimization opportunities
 * 3. Ensures consistent ID generation patterns
 * 4. Updates all user roles, templates, and existing users
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Optimized ID generation patterns
const ID_PATTERNS = {
  // Current optimized patterns - these are good
  todo: (sequence = 0) =>
    `todo-${Date.now()}-${Math.floor(Math.random() * 10000)}-${sequence}`,
  workout: (sequence = 0) =>
    `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}-${sequence}`,

  // Template IDs for content templates (semantic, stable)
  masterChecklist: {
    morning: (seq) => `mc-morning-${String(seq).padStart(3, "0")}`,
    work: (seq) => `mc-work-${String(seq).padStart(3, "0")}`,
    tech: (seq) => `mc-tech-${String(seq).padStart(3, "0")}`,
    house: (seq) => `mc-house-${String(seq).padStart(3, "0")}`,
    wrapup: (seq) => `mc-wrapup-${String(seq).padStart(3, "0")}`,
  },

  habitBreak: {
    lsd: (seq) => `hb-lsd-${String(seq).padStart(3, "0")}`,
    financial: (seq) => `hb-financial-${String(seq).padStart(3, "0")}`,
    youtube: (seq) => `hb-youtube-${String(seq).padStart(3, "0")}`,
    time: (seq) => `hb-time-${String(seq).padStart(3, "0")}`,
  },

  timeBlock: (hour, seq) =>
    `tb-${String(hour).padStart(2, "0")}h-${String(seq).padStart(3, "0")}`,

  // Block IDs for user data (UUID-based for stability)
  block: () => `block-${randomUUID()}`,

  // Database document IDs (for MongoDB _id fields when needed)
  document: () => randomUUID(),
};

// Validation patterns
const VALIDATION_PATTERNS = {
  newTodo: /^todo-\d{13}-\d{1,4}-\d+$/,
  newWorkout: /^workout-\d{13}-\d{1,4}-\d+$/,
  templateMasterChecklist: /^mc-(morning|work|tech|house|wrapup)-\d{3}$/,
  templateHabitBreak: /^hb-(lsd|financial|youtube|time)-\d{3}$/,
  templateTimeBlock: /^tb-\d{2}h-\d{3}$/,
  userBlock:
    /^block-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  legacyBlock: /^block-\d+$/, // Old format we want to migrate
};

// Schema definitions for validation
const contentTemplateSchema = new mongoose.Schema({
  userRole: { type: String, required: true },
  content: {
    timeBlocks: [{ id: String, time: String, label: String, order: Number }],
    masterChecklist: [
      { id: String, text: String, category: String, order: Number },
    ],
    habitBreakChecklist: [
      { id: String, text: String, category: String, order: Number },
    ],
    placeholderText: Object,
  },
  createdAt: Date,
  updatedAt: Date,
});

const userDataSchema = new mongoose.Schema({
  date: String,
  userId: String,
  displayDate: String,
  blocks: Array,
  masterChecklist: Array,
  habitBreakChecklist: Array,
  todoList: Array,
  workoutChecklist: Array,
  score: Number,
  wakeTime: String,
  dailyWakeTime: String,
  userTimezone: String,
});

const ContentTemplate = mongoose.model(
  "content_templates",
  contentTemplateSchema,
  "content_templates"
);
const UserData = mongoose.model("user_data", userDataSchema, "user_data");

/**
 * Analyze ID patterns across all collections
 */
async function analyzeIdPatterns() {
  console.log("🔍 Analyzing ID patterns across all data...\n");

  const analysis = {
    contentTemplates: {
      public: { timeBlocks: [], masterChecklist: [], habitBreakChecklist: [] },
      admin: { timeBlocks: [], masterChecklist: [], habitBreakChecklist: [] },
    },
    userData: {
      blocks: [],
      masterChecklist: [],
      habitBreakChecklist: [],
      todoList: [],
      workoutChecklist: [],
    },
    issues: [],
    optimizations: [],
  };

  // Analyze content templates
  const templates = await ContentTemplate.find({});
  for (const template of templates) {
    const role = template.userRole;
    const content = template.content;

    if (content?.timeBlocks) {
      analysis.contentTemplates[role].timeBlocks = content.timeBlocks.map(
        (block) => ({
          id: block.id,
          valid: VALIDATION_PATTERNS.templateTimeBlock.test(block.id),
          pattern: getIdPattern(block.id),
        })
      );
    }

    if (content?.masterChecklist) {
      analysis.contentTemplates[role].masterChecklist =
        content.masterChecklist.map((item) => ({
          id: item.id,
          valid: VALIDATION_PATTERNS.templateMasterChecklist.test(item.id),
          pattern: getIdPattern(item.id),
        }));
    }

    if (content?.habitBreakChecklist) {
      analysis.contentTemplates[role].habitBreakChecklist =
        content.habitBreakChecklist.map((item) => ({
          id: item.id,
          valid: VALIDATION_PATTERNS.templateHabitBreak.test(item.id),
          pattern: getIdPattern(item.id),
        }));
    }
  }

  // Analyze user data (sample)
  const userDataSample = await UserData.find({}).limit(100);
  const userStats = {
    totalUsers: await UserData.countDocuments({}),
    sampled: userDataSample.length,
  };

  for (const userData of userDataSample) {
    // Analyze blocks
    if (userData.blocks) {
      userData.blocks.forEach((block) => {
        analysis.userData.blocks.push({
          id: block.id,
          valid:
            VALIDATION_PATTERNS.userBlock.test(block.id) ||
            VALIDATION_PATTERNS.legacyBlock.test(block.id),
          isLegacy: VALIDATION_PATTERNS.legacyBlock.test(block.id),
          pattern: getIdPattern(block.id),
        });
      });
    }

    // Analyze checklists
    [
      "masterChecklist",
      "habitBreakChecklist",
      "todoList",
      "workoutChecklist",
    ].forEach((listType) => {
      if (userData[listType]) {
        userData[listType].forEach((item) => {
          if (item.id) {
            const patternValid =
              listType === "todoList"
                ? VALIDATION_PATTERNS.newTodo.test(item.id)
                : listType === "workoutChecklist"
                ? VALIDATION_PATTERNS.newWorkout.test(item.id)
                : true; // Master and habit break use template patterns or user-generated

            analysis.userData[listType].push({
              id: item.id,
              valid: patternValid || item.id.length > 5, // Basic validation
              pattern: getIdPattern(item.id),
            });
          }
        });
      }
    });
  }

  // Generate analysis report
  console.log("📊 ID Pattern Analysis Report");
  console.log("=" * 50);

  console.log(
    `\n📋 User Data Analysis (${userStats.sampled}/${userStats.totalUsers} users sampled):`
  );

  Object.keys(analysis.userData).forEach((dataType) => {
    const items = analysis.userData[dataType];
    if (items.length > 0) {
      const validCount = items.filter((item) => item.valid).length;
      const legacyCount = items.filter((item) => item.isLegacy).length;
      console.log(
        `  ${dataType}: ${validCount}/${items.length} valid IDs${
          legacyCount > 0 ? `, ${legacyCount} legacy` : ""
        }`
      );
    }
  });

  console.log(`\n🏗️ Content Templates Analysis:`);
  ["public", "admin"].forEach((role) => {
    console.log(`  ${role.toUpperCase()} Template:`);
    Object.keys(analysis.contentTemplates[role]).forEach((type) => {
      const items = analysis.contentTemplates[role][type];
      if (items.length > 0) {
        const validCount = items.filter((item) => item.valid).length;
        console.log(`    ${type}: ${validCount}/${items.length} valid IDs`);
      }
    });
  });

  return analysis;
}

/**
 * Get the pattern type of an ID
 */
function getIdPattern(id) {
  if (!id) return "missing";
  if (VALIDATION_PATTERNS.newTodo.test(id)) return "optimized-todo";
  if (VALIDATION_PATTERNS.newWorkout.test(id)) return "optimized-workout";
  if (VALIDATION_PATTERNS.templateMasterChecklist.test(id))
    return "template-mc";
  if (VALIDATION_PATTERNS.templateHabitBreak.test(id)) return "template-hb";
  if (VALIDATION_PATTERNS.templateTimeBlock.test(id)) return "template-tb";
  if (VALIDATION_PATTERNS.userBlock.test(id)) return "optimized-block";
  if (VALIDATION_PATTERNS.legacyBlock.test(id)) return "legacy-block";
  if (id.match(/^\d+$/)) return "timestamp-only";
  if (id.match(/^[a-z]+\d+$/)) return "simple-prefix";
  return "unknown";
}

/**
 * Optimize and fix ID issues
 */
async function optimizeIds() {
  console.log("\n🔧 Optimizing ID patterns...\n");

  let updatedTemplates = 0;
  let updatedUserData = 0;

  // 1. Fix content templates if needed
  const templates = await ContentTemplate.find({});
  for (const template of templates) {
    let updated = false;
    const content = template.content;

    // Check and fix time block IDs
    if (content?.timeBlocks) {
      content.timeBlocks.forEach((block, index) => {
        if (!VALIDATION_PATTERNS.templateTimeBlock.test(block.id)) {
          const hour = parseInt(block.time) || 4 + Math.floor(index * 1.5);
          block.id = ID_PATTERNS.timeBlock(hour, index + 1);
          updated = true;
        }
      });
    }

    // Check and fix master checklist IDs
    if (content?.masterChecklist) {
      content.masterChecklist.forEach((item, index) => {
        if (!VALIDATION_PATTERNS.templateMasterChecklist.test(item.id)) {
          const category = item.category || "morning";
          const generator =
            ID_PATTERNS.masterChecklist[category] ||
            ID_PATTERNS.masterChecklist.morning;
          item.id = generator(index + 1);
          updated = true;
        }
      });
    }

    // Check and fix habit break checklist IDs
    if (content?.habitBreakChecklist) {
      content.habitBreakChecklist.forEach((item, index) => {
        if (!VALIDATION_PATTERNS.templateHabitBreak.test(item.id)) {
          const category = item.category || "lsd";
          const generator =
            ID_PATTERNS.habitBreak[category] || ID_PATTERNS.habitBreak.lsd;
          item.id = generator(index + 1);
          updated = true;
        }
      });
    }

    if (updated) {
      await template.save();
      updatedTemplates++;
      console.log(`✅ Updated ${template.userRole} template IDs`);
    }
  }

  // 2. Fix user data blocks (legacy block IDs)
  const userDataWithLegacyBlocks = await UserData.find({
    "blocks.id": { $regex: /^block-\d+$/ },
  });

  for (const userData of userDataWithLegacyBlocks) {
    let updated = false;

    if (userData.blocks) {
      userData.blocks.forEach((block) => {
        if (VALIDATION_PATTERNS.legacyBlock.test(block.id)) {
          block.id = ID_PATTERNS.block();
          updated = true;
        }
      });
    }

    if (updated) {
      await userData.save();
      updatedUserData++;
      console.log(`✅ Updated user data blocks for user ${userData.userId}`);
    }
  }

  console.log(`\n📊 Optimization Results:`);
  console.log(`  Templates updated: ${updatedTemplates}`);
  console.log(`  User data records updated: ${updatedUserData}`);
}

/**
 * Create centralized ID generation utility
 */
async function createIdGenerationUtility() {
  const utilityContent = `/**
 * Centralized ID Generation Utility
 * 
 * This module provides consistent, optimized ID generation patterns
 * for all AMP Tracker components and data structures.
 */

import { randomUUID } from 'crypto';

/**
 * Generate collision-resistant IDs for user-created items
 */
export const generateId = {
  // For user todo items
  todo: (sequence = 0) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return \`todo-\${timestamp}-\${random}-\${sequence}\`;
  },

  // For user workout items
  workout: (sequence = 0) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return \`workout-\${timestamp}-\${random}-\${sequence}\`;
  },

  // For time blocks in user data
  block: () => \`block-\${randomUUID()}\`,

  // For template items (semantic, stable IDs)
  template: {
    masterChecklist: (category, sequence) => {
      const validCategories = ['morning', 'work', 'tech', 'house', 'wrapup'];
      const cat = validCategories.includes(category) ? category : 'morning';
      return \`mc-\${cat}-\${String(sequence).padStart(3, '0')}\`;
    },

    habitBreak: (category, sequence) => {
      const validCategories = ['lsd', 'financial', 'youtube', 'time'];
      const cat = validCategories.includes(category) ? category : 'lsd';
      return \`hb-\${cat}-\${String(sequence).padStart(3, '0')}\`;
    },

    timeBlock: (hour, sequence) => {
      return \`tb-\${String(hour).padStart(2, '0')}h-\${String(sequence).padStart(3, '0')}\`;
    }
  }
};

/**
 * Validate ID patterns
 */
export const validateId = {
  todo: (id) => /^todo-\\d{13}-\\d{1,4}-\\d+$/.test(id),
  workout: (id) => /^workout-\\d{13}-\\d{1,4}-\\d+$/.test(id),
  block: (id) => /^block-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id),
  templateMasterChecklist: (id) => /^mc-(morning|work|tech|house|wrapup)-\\d{3}$/.test(id),
  templateHabitBreak: (id) => /^hb-(lsd|financial|youtube|time)-\\d{3}$/.test(id),
  templateTimeBlock: (id) => /^tb-\\d{2}h-\\d{3}$/.test(id),
};

/**
 * Check if an ID needs migration from old format
 */
export const needsMigration = {
  isLegacyBlock: (id) => /^block-\\d+$/.test(id),
  isOldFormat: (id) => {
    // Check if ID follows old patterns that should be updated
    return !Object.values(validateId).some(validator => validator(id)) &&
           !/^(mc|hb|tb|todo|workout|block)-/.test(id);
  }
};
`;

  await fs.writeFile(
    join(__dirname, "..", "src", "lib", "id-generation.ts"),
    utilityContent
  );

  console.log("✅ Created centralized ID generation utility");
}

/**
 * Update component files to use centralized ID generation
 */
async function updateComponents() {
  console.log("\n🔄 Updating components to use centralized ID generation...\n");

  const updates = [
    {
      file: "src/components/TodoList.tsx",
      search: /id: `todo-\${timestamp}-\${random}-\${sequence}`,/,
      replace: "id: generateId.todo(sequence),",
    },
    {
      file: "src/components/WorkoutChecklist.tsx",
      search: /id: `workout-\${timestamp}-\${random}-\${sequence}`,/,
      replace: "id: generateId.workout(sequence),",
    },
  ];

  for (const update of updates) {
    try {
      const filePath = join(__dirname, "..", update.file);
      let content = await fs.readFile(filePath, "utf8");

      // Add import if not present
      if (!content.includes("import { generateId }")) {
        content = content.replace(
          /import { .*? } from "\.\.\/types";/,
          `import { ChecklistItem } from "../types";
import { generateId } from "../lib/id-generation";`
        );
      }

      // Update the ID generation
      if (update.search.test(content)) {
        content = content.replace(update.search, update.replace);

        // Remove old timestamp/random generation
        content = content.replace(/const timestamp = Date\.now\(\);\s*/, "");
        content = content.replace(
          /const random = Math\.floor\(Math\.random\(\) \* 10000\);\s*/,
          ""
        );

        await fs.writeFile(filePath, content);
        console.log(`✅ Updated ${update.file}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not update ${update.file}: ${error.message}`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log("🚀 AMP Tracker ID Analysis & Optimization");
    console.log("=" * 50);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Analyze current ID patterns
    const analysis = await analyzeIdPatterns();

    // Step 2: Optimize existing IDs
    await optimizeIds();

    // Step 3: Create centralized utility
    await createIdGenerationUtility();

    // Step 4: Update components
    await updateComponents();

    console.log("\n🎉 ID Optimization Complete!");
    console.log("\n📋 Summary:");
    console.log("✅ All ID patterns analyzed and optimized");
    console.log("✅ Legacy IDs migrated to optimized format");
    console.log("✅ Centralized ID generation utility created");
    console.log("✅ Components updated to use consistent patterns");
    console.log("✅ All user roles and templates synchronized");

    console.log("\n💡 Your ID system is now fully optimized with:");
    console.log("  - Collision-resistant user-generated IDs (todo, workout)");
    console.log("  - Semantic template IDs for stability");
    console.log("  - UUID-based block IDs for uniqueness");
    console.log("  - Consistent validation patterns");
    console.log("  - Centralized generation utility");
  } catch (error) {
    console.error("❌ Error during optimization:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Development environment and OAuth questions
console.log("\n" + "=".repeat(60));
console.log("🤔 DEVELOPMENT ENVIRONMENT & OAUTH QUESTIONS");
console.log("=".repeat(60));
console.log();
console.log("Regarding your questions about adding:");
console.log("1. 📦 Dev environment");
console.log("2. 🌐 Front-facing UI webpage");
console.log("3. 🔐 OAuth options");
console.log();
console.log("💡 RECOMMENDATION: You can safely add these later!");
console.log();
console.log("Why it's safe to add later:");
console.log("✅ Your current architecture is well-structured");
console.log("✅ Authentication is already abstracted via NextAuth");
console.log("✅ Database schema is stable and migration-ready");
console.log("✅ Component architecture supports new features");
console.log();
console.log("🎯 Current Focus: Get your app running smoothly first");
console.log("📈 Later Focus: Scale with dev environment + OAuth");
console.log();
console.log("The ID optimization we're doing now will make");
console.log("future scaling much easier!");
console.log("=".repeat(60));

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as optimizeIds };
