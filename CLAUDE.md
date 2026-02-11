# Claude Rules

## Workflow Process

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Core Philosophy

- Make every task and code change as simple as possible. Minimal code impact. Everything is about simplicity.
- DO NOT BE LAZY. If there is a bug, find the root cause and fix it. No temporary fixes.
- Your goal is to not introduce any bugs.

## Code Standards

- Always use TypeScript strict mode - no any types, use proper types or unknown
- Follow existing component patterns in the codebase
- Keep functions under 50 lines, break into smaller units if longer
- Use named exports, not default exports
- Always wrap risky operations in try/catch

## Git Workflow

- Never commit without explicitly asking for permission first
- Commit messages must be descriptive, not generic ("fix bug" is not acceptable)
- Run build/tests before committing to verify nothing breaks

## Common Mistakes to Avoid

- Do NOT install new dependencies without discussing alternatives first
- Do NOT create new files unless absolutely necessary - prefer editing existing files
- Do NOT add emojis unless the user explicitly requests them
- Do NOT guess - if unsure about something, ask or investigate first

## When Stuck

- Search the codebase with Grep/Glob before asking
- Check existing patterns in similar files
- If adding a workaround, document why with a TODO comment

## Project Conventions

<!-- Add project-specific conventions here -->
<!-- Examples: -->
<!-- - Styling: Tailwind / CSS Modules / styled-components -->
<!-- - State: Redux / Zustand / Context -->
<!-- - API: REST / GraphQL / tRPC -->
<!-- - Testing: Jest / Vitest / Playwright -->
