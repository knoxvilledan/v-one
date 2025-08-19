#!/usr/bin/env node

/**
 * Test the new 18-hour time block assignment system
 */

import {
  calculateCompletionBlock,
  generateTimeBlocks,
  getBlockDisplayName,
} from "../src/lib/time-block-calculator.js";

console.log("🧪 Testing 18-Hour Time Block Assignment System\n");

// Generate the 18 blocks
const blocks = generateTimeBlocks();
console.log("📋 Generated Time Blocks:");
blocks.forEach((block) => {
  console.log(
    `  Block ${block.index}: ${block.timeLabel} (Hour ${block.startHour})`
  );
});

console.log("\n🕐 Testing Assignment Rules:\n");

// Test cases
const testCases = [
  // General rule tests
  {
    name: "Early morning (3:30 AM) - no wake time",
    time: new Date("2025-08-19T03:30:00"),
    wakeSettings: undefined,
    expected: 0,
  },
  {
    name: "4:00 AM",
    time: new Date("2025-08-19T04:00:00"),
    wakeSettings: undefined,
    expected: 0,
  },
  {
    name: "8:30 AM",
    time: new Date("2025-08-19T08:30:00"),
    wakeSettings: undefined,
    expected: 4,
  },
  {
    name: "12:00 PM (Lunch)",
    time: new Date("2025-08-19T12:00:00"),
    wakeSettings: undefined,
    expected: 8,
  },
  {
    name: "5:00 PM",
    time: new Date("2025-08-19T17:00:00"),
    wakeSettings: undefined,
    expected: 13,
  },
  {
    name: "9:00 PM",
    time: new Date("2025-08-19T21:00:00"),
    wakeSettings: undefined,
    expected: 17,
  },
  {
    name: "11:30 PM (late night)",
    time: new Date("2025-08-19T23:30:00"),
    wakeSettings: undefined,
    expected: 17,
  },

  // Wake time special rule tests
  {
    name: "4:45 AM with wake time 3:30 AM (early morning rule)",
    time: new Date("2025-08-19T04:45:00"),
    wakeSettings: { wakeTime: "03:30", date: "2025-08-19" },
    expected: 0,
  },
  {
    name: "4:45 AM with wake time 5:00 AM (general rule)",
    time: new Date("2025-08-19T04:45:00"),
    wakeSettings: { wakeTime: "05:00", date: "2025-08-19" },
    expected: 0,
  },
  {
    name: "3:45 AM with wake time 3:30 AM (early morning rule)",
    time: new Date("2025-08-19T03:45:00"),
    wakeSettings: { wakeTime: "03:30", date: "2025-08-19" },
    expected: 0,
  },
  {
    name: "5:15 AM with wake time 3:30 AM (general rule applies)",
    time: new Date("2025-08-19T05:15:00"),
    wakeSettings: { wakeTime: "03:30", date: "2025-08-19" },
    expected: 1,
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  try {
    const result = calculateCompletionBlock(
      test.time,
      test.wakeSettings,
      "America/New_York"
    );

    const success = result.blockIndex === test.expected;
    const status = success ? "✅ PASS" : "❌ FAIL";

    if (success) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Time: ${test.time.toLocaleTimeString()}`);
    console.log(
      `   Expected: Block ${test.expected} (${getBlockDisplayName(
        test.expected
      )})`
    );
    console.log(
      `   Got: Block ${result.blockIndex} (${getBlockDisplayName(
        result.blockIndex
      )})`
    );
    console.log(`   ${status}\n`);
  } catch (error) {
    failed++;
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }
});

console.log("📊 Test Results:");
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Total: ${testCases.length}`);

if (failed === 0) {
  console.log(
    "\n🎉 All tests passed! Time block assignment is working correctly."
  );
} else {
  console.log(
    `\n⚠️  ${failed} test(s) failed. Please review the implementation.`
  );
  process.exit(1);
}
