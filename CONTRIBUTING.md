# Contributing Guidelines

## ID Migration Status: PHASE 2-7 COMPLETE ✅

**Current Status**: The index-to-ID migration is substantially complete. All core systems now use stable IDs instead of array indices.

### Migration Phases Completed:

- ✅ **Phase 0**: Guardrails and branch isolation
- ✅ **Phase 0.1**: Database consolidation (db.ts)
- ✅ **Phase 1**: Stable ID generation and migration system
- ✅ **Phase 2**: API endpoints updated to use targetBlockId/targetItemId
- ✅ **Phase 3**: New collections (TemplateSet, UserSpace, DayEntry, TodoItem)
- ✅ **Phase 4**: Checklist component with server actions
- ✅ **Phase 5**: Hydration endpoint (/api/hydrate)
- ✅ **Phase 6**: Core API client updated to use IDs
- ✅ **Phase 7**: Migration bridge utilities and validation

### Remaining Work:

- Some UI components still use index-based operations (WorkoutChecklist, TodoList, etc.)
- Legacy time-block-calculator functions can be modernized
- Full end-to-end testing of the hydration system

## Core Principles

1. **Server-Side Mutations Only**: All data mutations must happen on the server side through proper API routes and server actions.

2. **ID-Based Operations**: Always use stable IDs (blockId, itemId, checklistId) instead of array indices.

3. **Hydration-First**: Use the `/api/hydrate` endpoint to get complete user state with merged templates and overrides.

4. **File Replacement Protocol**: If you must replace a file:

   - Rename the old file with `.old` extension
   - Commit the changes
   - Delete the `.old` file only after tests pass
   - Commit the deletion

5. **Branch Isolation**: All work must be done on the `chore/ids-v2` branch only.

## Migration Architecture

### Data Flow:

1. **TemplateSet**: Versioned templates per role with stable IDs
2. **UserSpace**: User-specific overrides and preferences
3. **HydrationService**: Merges templates with user customizations
4. **Server Actions**: Handle all mutations (Checklist, TimeBlocks, etc.)
5. **DayEntry**: Historical tracking with data snapshots
6. **TodoItem**: Persistent todos with full lifecycle

### Key Files:

- `src/lib/hydration.ts` - Central data loading service
- `src/lib/migration.ts` - Automatic ID generation for legacy data
- `src/lib/id-helpers.ts` - ID-based lookup functions
- `src/lib/checklist-actions.ts` - Server actions for checklist operations
- `src/components/Checklist.tsx` - Reusable checklist component
- `src/lib/migration-bridge.ts` - Transition utilities and validation

## Development Workflow

- Use `Api.hydrateUserData()` to get complete user state
- Always work with IDs (blockId, itemId, checklistId) in new code
- Use migration bridge utilities during transition period
- Server actions for all data mutations
- Component props should accept hydrated data structures

## Testing Requirements

Before submitting changes:

- Run `pnpm install`, `pnpm build`, `pnpm lint`, and `pnpm test:smoke`
- Test the hydration endpoint: `GET /api/hydrate`
- Verify checklist server actions work correctly
- Test template and user space systems
- Ensure migration automatically generates IDs for legacy data
