# Contributing Guidelines

## Core Principles

1. **Server-Side Mutations Only**: All data mutations must happen on the server side through proper API routes and server actions.

2. **No New Helper Scripts for Index Patches**: Do not create new standalone scripts for patching indexes or data structures. Migrations should be handled within the server code itself.

3. **File Replacement Protocol**: If you must replace a file:

   - Rename the old file with `.old` extension
   - Commit the changes
   - Delete the `.old` file only after tests pass
   - Commit the deletion

4. **Branch Isolation**: All work must be done on the `chore/ids-v2` branch only.

## Development Workflow

- Always run tests before and after major changes
- Ensure database backups exist before making structural changes
- Follow the established migration patterns for data structure updates
- Use proper TypeScript types and Zod schemas for API validation

## Testing Requirements

Before submitting changes:

- Run `pnpm install`, `pnpm build`, `pnpm lint`, and `pnpm test:smoke`
- Perform end-to-end testing of user workflows
- Verify template/user seeding works correctly
- Test admin functionality and template versioning
