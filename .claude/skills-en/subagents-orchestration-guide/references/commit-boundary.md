# Commit Boundary Check

Each task commit is a reversible execution checkpoint. Before committing:

1. Inspect staged, unstaged, untracked, deleted, and renamed paths.
2. Map every change to the task outcome, a governing contract, or a repository responsibility required to keep that outcome consistent.
3. Move a change belonging to a different independently executable outcome into its own task boundary. Keep supporting edits with the task whose behavior requires them, including files discovered after the initial Target Files list.
4. Confirm quality-fixer returned `approved` or `verification_incomplete` and that the commit contains a complete implementation.
5. Commit the coherent boundary. For `verification_incomplete`, append one trailer pair per retained limitation:

   ```text
   Verification-Limitation: <command or proof that remains unavailable>
   Verification-Affected: <acceptance or quality claim not yet proved>
   ```

Retain the structured limitation record in orchestration state. Before post-implementation verifiers and the final completion report, retry each retained check whose prerequisite may now be available. A successful original proof resolves its limitation. A remaining limitation names its exact retry condition and withholds the final `completed` claim.
