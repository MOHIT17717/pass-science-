# AI Usage Log

Record actual use only. Do not backfill invented prompts or interactions.

| Date | Tool/model | Prompt or task | Relevant output | Human changes | Verification | Assessment |
|---|---|---|---|---|---|---|
| 2026-10-31 | Antigravity (Gemini 3.8 Flash High) | Execute Task 01 Environment Audit ONLY | Inspected Windows, CPU, RAM, OpenGL, Git, compiler, CMake, Qt. Detected missing compiler, CMake, Qt; verified OpenGL 4.6.0. | Candidate guided strictly to audit-only mode; blocked toolchain reported. | Verified with Win32 APIs, registry, and CLI tools with exact exit codes. | Accurate audit without fabricating tools or simulating build success. |
| 2026-10-31 | Antigravity (Gemini 3.8 Flash High) | Execute Task 02 Pure C++ Architecture Revision (Documentation Only) | Verified revision pack for pure-C++ stack (GLFW, OpenGL 3.3, GLAD, Dear ImGui, ImPlot); confirmed thermal sources and test unchanged via SHA256 hashes; updated ENVIRONMENT.md and documentation. | Enforced strict non-implementation boundary, no dependency downloads, no git commits. | SHA256 file hashes verified identical for thermal backend and tests; documentation consistency checked across all 18 tasks. | Successfully completed Task 02 documentation without code changes or premature task starts. |
| 2026-11-01 | Antigravity (Gemini 3.8 Flash High) | Reconcile documentation for Electron + React + Three.js + C++17 backend architecture | Reconciled ARCHITECTURE, TOOLCHAIN_STRATEGY, PACKAGING_STRATEGY, IMPLEMENTATION_PLAN (18 tasks), TRACEABILITY, DECISIONS, AGENTS.md, ENVIRONMENT.md. Verified Node v22.20.0 and npm 11.11.1. | Maintained strict documentation/planning boundary; verified no C++ source/test/CMake changes; no build/test claimed. | Confirmed SHA256 hashes for thermal source and tests; verified 18-task plan and requirement coverage. | Clean documentation reconciliation with zero unauthorized side effects. |

Required final content:
- Tool/model names where available.
- Representative prompts and relevant outputs.
- What the candidate edited or rejected.
- Validation evidence.
- One real unsuitable suggestion identified, or a documented deliberate challenge test and its outcome.
- Ownership statement separating original work, reused code, and third-party dependencies.
