---
description: Write a spec for a project, feature, or bug fix
argument-hint: <short description of the project, feature, or bug>
---

You are helping write a clear, actionable spec. The request is:

$ARGUMENTS

## Step 1: Classify the request

Decide which type this is. If it's genuinely ambiguous, ask.

- **Project**: a larger body of work with multiple parts, milestones, or phases
- **Feature**: a new capability or a change to existing behavior
- **Bug fix**: something that is broken or behaves differently from what's intended

State the type you chose in one line before continuing.

## Step 2: Gather context

Before asking the user anything, look at what already exists:

- Skim relevant code, docs, READMEs, and existing files in `specs/` to match conventions and terminology.
- For bug fixes, locate the likely area of the code and try to confirm the behavior from the source rather than assuming.

Then ask **at most 3-5 targeted clarifying questions**, and only about things you could not determine yourself. Skip this step entirely if the request is already clear. Do not ask questions whose answers would not change the spec. If the user doesn't know an answer, record it under Open Questions rather than blocking.

## Step 3: Write the spec

Use the shared sections for every type, then add the type-specific sections. Keep it concise: prefer short bullets and concrete statements over prose. Omit any section that has nothing useful to say rather than filling it with filler.

### Shared sections (all types)

1. **Title and summary**: one or two sentences on what this is and why it matters.
2. **Problem / motivation**: what is wrong or missing today, and who is affected.
3. **Goals**: what success looks like, ideally measurable.
4. **Non-goals**: what is explicitly out of scope.
5. **Proposed approach**: the recommended solution at the level of design, not line-by-line code. Mention alternatives considered and why they were rejected.
6. **Risks and dependencies**: what could go wrong, and what this relies on.
7. **Testing and verification**: how we will know it works.
8. **Open questions**: unresolved decisions, each with an owner if known.

### Additional sections for a Project

- **Scope and deliverables**
- **Milestones / phases** with rough ordering and dependencies
- **Stakeholders and owners**
- **Rollout plan**

### Additional sections for a Feature

- **User stories** ("As a ___, I want ___ so that ___")
- **Functional requirements**, numbered so they can be referenced (R1, R2...)
- **Acceptance criteria** as testable statements (Given / When / Then where helpful)
- **UX or API notes**, including edge cases and error states
- **Data / schema / migration impact**, if any

### Additional sections for a Bug fix

- **Observed vs. expected behavior**
- **Steps to reproduce** (exact, minimal)
- **Environment / version**, if relevant
- **Root cause** (confirmed vs. suspected; say which)
- **Proposed fix** and the smallest change that resolves it
- **Regression test**: the test that would have caught this
- **Impact and severity**, and whether a hotfix or workaround is needed

## Step 4: Save and report

- Save the spec to `specs/<kebab-case-name>.md`, creating the `specs/` folder if needed. Don't overwrite an existing file; if the name is taken, pick a distinct one or ask.
- Reply with the file path, the type you chose, and a 2-3 line summary.
- List the open questions and any assumptions you made so the user can correct them quickly.

## Rules

- Write the spec only. Do **not** implement the change or edit source code.
- Never invent facts about the codebase. If you didn't verify something, mark it as an assumption.
- Keep requirements specific and testable; avoid vague words like "fast", "better", or "user-friendly" without a measurable definition.
- If `$ARGUMENTS` is empty, ask the user what they want to spec instead of guessing.
