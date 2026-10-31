# Antigravity prompt — documentation-only Electron architecture migration

Read the root `AGENTS.md` and all architecture, requirements, plan, traceability, decisions, toolchain, packaging, environment, test evidence, and AI usage documents.

Execute the documentation reconciliation for the approved architecture:
**Electron + React + TypeScript + Three.js + 2D chart library + entirely C++17 engineering backend.**

User authorization is documentation and planning only. Do not implement features.

## Required work
1. Reconcile `docs/ARCHITECTURE.md`, `docs/TOOLCHAIN_STRATEGY.md`, `docs/PACKAGING_STRATEGY.md`, `docs/IMPLEMENTATION_PLAN.md` (exactly 18 tasks), `docs/TRACEABILITY.md`, and `docs/DECISIONS.md`.
2. Update root `AGENTS.md` to enforce the approved architecture and security boundaries.
3. Preserve `docs/ASSIGNMENT_REQUIREMENTS.md` as the assignment source of truth. Verify that every A–F requirement and every rubric category/weight remains mapped. Do not invent or silently alter requirement IDs or wording.
4. Preserve `docs/ENVIRONMENT.md` historical facts. Add a note that Node.js/npm status is unknown unless verified; Qt is no longer required.
5. Preserve `docs/TEST_EVIDENCE.md` history. Add a documentation-only migration entry; do not claim builds/tests.
6. Append a truthful entry to `docs/AI_USAGE_LOG.md` describing this architecture revision and the AI assistance used.
7. Inspect existing FEM files and tests. Do not edit or move them. Preserve their previously recorded hashes and note if a hash cannot be independently reproduced.
8. Treat old Qt and Dear ImGui UI code as legacy/uncompiled. Do not delete it.
9. Do not edit C++ source, tests, CMakeLists.txt, package manifests, or install/download dependencies.
10. Do not initialize Git or make commits unless separately approved.

## Acceptance report
Report exact changed files, requirement coverage, whether the plan has exactly 18 tasks, preserved FEM file hashes, any unresolved design decisions, and explicit statement that no implementation/build/test occurred. Stop and await approval.
