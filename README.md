# Unified Engineering Workbench — Electron + React + C++ revision

This revision replaces the previously approved all-C++ desktop UI direction with an Electron desktop shell, React + TypeScript frontend, Three.js visualization, and a C++17 engineering backend.

## Apply this revision
1. Back up the current project folder or commit it before applying changes.
2. Copy the root `AGENTS.md` into the project root, replacing the previous architecture-specific version.
3. Copy the files in `docs/` into the project's existing `docs/` folder.
4. Preserve existing `docs/ASSIGNMENT_REQUIREMENTS.md`, `docs/ENVIRONMENT.md`, `docs/TEST_EVIDENCE.md`, and `docs/AI_USAGE_LOG.md`. Merge relevant updates rather than blindly overwriting evidence.
5. Do not replace `src/` or `tests/`. Existing thermal FEM files must remain unchanged.
6. Do not run implementation tasks until the user approves the migration prompt.

## Important
This is a documentation and architecture revision only. It contains no application implementation and does not establish that Node.js, MSVC, CMake, or any dependency is installed.

See `docs/ARCHITECTURE_MIGRATION_PROMPT.md` for the documentation-only reconciliation prompt.
