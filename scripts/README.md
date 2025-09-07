# Scripts Directory - Clean & Essential ✅

## Cleanup Complete (September 2025)

**Status**: ✅ **COMPLETED** - Successfully reduced from 48+ scripts to 7 essential scripts

## Current Scripts (7 total)

| Script                  | Purpose                        | Usage                      |
| ----------------------- | ------------------------------ | -------------------------- |
| **backup-database.mjs** | Database backup utility        | `node backup-database.mjs` |
| **check-database.mjs**  | Database verification          | `node check-database.mjs`  |
| **check-ids.mjs**       | ID format validation           | `node check-ids.mjs`       |
| **migrate-ids.mjs**     | 9-point audit Priority 1 fixes | `node migrate-ids.mjs`     |
| **seed.mjs**            | Dev user seeding (optional)    | `node seed.mjs`            |
| **smoke-test.mjs**      | End-to-end sanity testing      | `node smoke-test.mjs`      |
| **README.md**           | Documentation                  | This file                  |

## Recent Cleanup (September 2025)

### Removed Old Migration Scripts

- ❌ `migrate-to-plan-system.mjs` - Outdated plan system migration
- ❌ `sync-to-plan-system.mjs` - Outdated plan system sync
- ❌ `create-hybrid-system.mjs` - Outdated hybrid migration
- ❌ `test-api-customizations.mjs` - Old plan system tests
- ❌ `test-customization-persistence.mjs` - Old plan system tests
- ❌ `check-user-functionality.mjs` - Old plan system checks

### Current Focus: 9-Point Audit Implementation

- ✅ `migrate-ids.mjs` - Updated for Priority 1 fixes:
  - Client-side ID generation fixes
  - Required itemId enforcement
  - Audit trail indexes
  - ID migration utilities

## Script Descriptions

### **migrate-ids.mjs** - Priority 1 Migration

Updates system for 9-point audit compliance:

1. Add missing itemId to existing ContentTemplate items
2. Migrate UserData to ensure all items have required itemId
3. Create audit trail entries in DayEntry collection
4. Validate ID consistency across collections
5. Fix client-generated ID references

### **check-ids.mjs** - ID Validation

Quick utility to check current ID formats in the database for validation after migration.

### **backup-database.mjs** - Database Backup

Creates timestamped backups before major operations.

### **check-database.mjs** - Database Health

Verifies database structure and connectivity.

### **seed.mjs** - Development Users

Creates test users for development (optional).

### **smoke-test.mjs** - System Health

End-to-end sanity testing for core functionality.

---

## Previous Inventory & Categorization (For Reference)

|--------|--------|----------|---------|
| backup-database.mjs | **KEEP** | Backup | Essential backup functionality |
| smoke-test.mjs | **KEEP** | Verification | Primary smoke test entry point |
| setup-content-templates.js | **KEEP** | Bootstrap | Template setup from source of truth |
| populate-content-templates.mjs | **KEEP** | Bootstrap | Template population |
| seed.mjs | **KEEP** | Dev Seed | Dev user creation (optional) |
| migrate-optimized-ids.mjs | **KEEP** | One-time Migration | ID migration (rename to migrate-ids.mjs) |
| check-database.mjs | **KEEP** | Verification | Database verification utility |
| analyze-and-optimize-ids.mjs | **DELETE** | Analysis | One-off analysis script |
| apply-optimizations-to-real-database.mjs | **DELETE** | Apply Fix | Index-patch script |
| backfill-component-formatting.mjs | **DELETE** | Backfill | One-off formatting fix |
| backfill-time-blocks.mjs | **DELETE** | Backfill | One-off time block fix |
| check-admin-users.mjs | **DELETE** | Check | Redundant check script |
| check-current-state.mjs | **DELETE** | Check | Redundant state check |
| check-production-templates.mjs | **DELETE** | Check | Redundant template check |
| check-templates-structure.mjs | **DELETE** | Check | Redundant structure check |
| check-user-admin-mode.mjs | **DELETE** | Check | Redundant user check |
| check-user-data-status.mjs | **DELETE** | Check | Redundant data check |
| clean-duplicate-fields.mjs | **DELETE** | Cleanup | One-off cleanup script |
| clean-start-with-optimized-templates.mjs | **DELETE** | Cleanup | One-off cleanup script |
| cleanup-empty-items-prod.mjs | **DELETE** | Cleanup | One-off cleanup script |
| cleanup-empty-items.mjs | **DELETE** | Cleanup | One-off cleanup script |
| cleanup-test-users.mjs | **DELETE** | Cleanup | One-off cleanup script |
| create-admin.mjs | **DELETE** | User Management | Use admin UI instead |
| create-real-users.mjs | **DELETE** | User Management | One-off user creation |
| create-test-users.js | **DELETE** | Test Setup | Duplicate of seed functionality |
| db-maintenance.mjs | **DELETE** | Maintenance | General maintenance script |
| debug-auth.js | **DELETE** | Debug | One-off debug script |
| debug-production-templates.mjs | **DELETE** | Debug | One-off debug script |
| delete-wrong-databases.mjs | **DELETE** | Cleanup | One-off cleanup script |
| e2e-check.mjs | **DELETE** | Test | Redundant with smoke test |
| fix-template-structure-final.mjs | **DELETE** | Fix | One-off structure fix |
| fix-template-structure.mjs | **DELETE** | Fix | One-off structure fix |
| fix-timeblocks-structure.mjs | **DELETE** | Fix | One-off structure fix |
| inspect-templates.mjs | **DELETE** | Inspection | One-off inspection script |
| migrate-add-ids-and-extend.mjs | **DELETE** | Migration | Superseded by migrate-optimized-ids.mjs |
| populate-users-with-optimized-templates.mjs | **DELETE** | Population | One-off population script |
| quick-reset-admin.mjs | **DELETE** | Reset | One-off reset script |
| reset-admin-password.mjs | **DELETE** | Reset | Use admin UI instead |
| setup-test-users.js | **DELETE** | Test Setup | Duplicate of seed functionality |
| test-auth-flow.js | **DELETE** | Test | One-off test script |
| test-database-setup.js | **DELETE** | Test | One-off test script |
| test-template-api.mjs | **DELETE** | Test | One-off API test |
| test-time-blocks.mjs | **DELETE** | Test | One-off test script |
| update-all-formatting.mjs | **DELETE** | Update | One-off formatting update |
| update-all-users-templates.mjs | **DELETE** | Update | One-off template update |
| update-content-templates.mjs | **DELETE** | Update | One-off template update |
| update-existing-templates.mjs | **DELETE** | Update | One-off template update |
| verify-templates.mjs | **DELETE** | Verification | Redundant with smoke test |
| package.json | **KEEP** | Config | Scripts package configuration |

## Scripts to Keep (7 total)

1. **backup-database.mjs** - Database backup utility
2. **check-database.mjs** - Database verification
3. **smoke-test.mjs** - End-to-end sanity testing
4. **setup-content-templates.js** - Bootstrap template definitions
5. **populate-content-templates.mjs** - Bootstrap template population
6. **seed.mjs** - Dev user seeding (optional)
7. **migrate-ids.mjs** - One-time ID migration (to be renamed and removed after use)

## Scripts to Delete (41 total)

All other scripts are redundant, one-off fixes, or superseded by the new ID-based architecture.
