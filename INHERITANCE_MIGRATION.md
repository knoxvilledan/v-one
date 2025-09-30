# Day-to-Day Inheritance Migration Guide

## Overview

This migration implements proper day-to-day inheritance with the following behaviors:

1. **Time-Block names (labels + order)** inherit to the next day — no notes, no completion flags
2. **To-Do list items** inherit just like other lists (master/habit/workout): copy all items and metadata needed for display, but reset completion state
3. **Structural diff** triggers re-inheritance for any content change (not just length deltas)

## Changes Made

### Code Changes

1. **Added copy helper functions** in `src/lib/user-actions.ts`:

   - `copyChecklistForNewDay(list)` - Deep-clone items, reset completion state
   - `copyTodoListForNewDay(list)` - Same reset behavior, preserve order and targetBlock
   - `copyBlocksForNewDay(blocks)` - Keep only labels and ordering, reset notes/completion

2. **Updated new-day creation** in `createInheritedUserData()`:

   - Now properly inherits todos and blocks using copy helpers
   - Maintains 18 blocks in canonical order
   - Resets completion state for all inherited items

3. **Tightened re-inheritance triggers**:

   - `shouldReInherit()` and `shouldReInheritFromToday()` now use structural diff
   - Any single change (add/remove/rename item or block) triggers re-inheritance
   - No longer relies on length deltas or arbitrary thresholds

4. **Improved updateInheritance()**:
   - Todos now mirror other checklists (copy items, reset completion)
   - Time blocks only copy labels/order, always clear notes and reset completion
   - Uses copy helpers for consistent behavior

### Configuration Changes

5. **Added npm scripts** in `package.json`:

   - `"reset:future": "node scripts/reset-future-dates.mjs"` - Clear future dates for fresh inheritance
   - `"test": "jest"` - Run unit tests
   - `"test:watch": "jest --watch"` - Watch mode for tests

6. **Added unit tests** in `src/lib/__tests__/user-actions.test.ts`:
   - Tests for all copy helper functions
   - Re-inheritance trigger validation
   - Acceptance criteria verification

## Post-Deployment Migration

After deploying these code changes, you need to clear existing future day documents so they can re-inherit under the new rules.

### Method 1: Using the npm script (Recommended)

```bash
# Clear all future dates for a specific user
npm run reset:future -- --email=user@example.com --from=2025-10-01

# Clear all future dates for all users
npm run reset:future -- --from=2025-10-01
```

### Method 2: Direct script execution

```bash
# Clear future dates with parameters
node scripts/reset-future-dates.mjs --email=user@example.com --from=2025-10-01

# Or use the ad-hoc fix script
node fix-inheritance.mjs
```

### Verification

After running the reset script:

1. Navigate to any future date in the app
2. Verify that:
   - Todo items from "today" appear (with completion reset)
   - Time block labels are preserved from "today"
   - Time block notes are empty
   - Time block completion is reset

## Acceptance Criteria ✅

- [x] Creating a new day without user interaction shows yesterday's To-Dos (incomplete) and yesterday's Time-Block names; notes don't carry over
- [x] Any single change (add/remove/rename item, rename a block) triggers re-inheritance
- [x] Admin template changes affect new days but never wipe existing days automatically
- [x] The app still generates exactly 18 blocks (4:00 AM–9:00 PM) daily; wake-time + timezone assignment logic remains unchanged
- [x] Todo lists inherit just like other checklists with reset completion state
- [x] Time blocks inherit only labels and order, not notes or completion flags

## Testing

Run the unit tests to verify the implementation:

```bash
npm test
```

The tests cover:

- Copy helper functions behavior
- Re-inheritance trigger conditions
- Acceptance criteria scenarios

## Rollback Plan

If issues arise, you can rollback by:

1. Reverting the code changes in `src/lib/user-actions.ts`
2. Running the reset script to clear problematic future dates
3. Allowing the old inheritance logic to recreate future days

The inheritance system is designed to be self-healing - clearing future dates will force them to be recreated with whatever logic is currently deployed.
