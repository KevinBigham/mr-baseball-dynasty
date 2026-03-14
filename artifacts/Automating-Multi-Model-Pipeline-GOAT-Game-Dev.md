# Automating a Multi-Model Pipeline for GOAT-Caliber Game Development

## Current workflow and where efficiency is leaking

Your current loop is already structurally “correct”: you’re using a **director → implementer** pattern where ChatGPT defines intent, constraints, and success conditions, and Codex does the multi-file execution. That division of labor is explicitly recommended in your own internal playbook, which frames ChatGPT as the product/architecture/review lead and Codex as the implementer who edits code, runs commands, and produces verifiable handoffs. fileciteturn0file3

Where time leaks today isn’t “bad prompting”—it’s **manual state transfer**:

- The “project truth” (plan, commands run, diffs, risks, next prompt) lives in **ephemeral chat logs** rather than in a durable, repo-readable artifact. Your Codex outputs already contain the right elements (plan, files changed, how to test, notes for Claude Code, etc.), but they’re not *persisted* as a standard file that downstream agents can consume without copy/paste. fileciteturn0file0turn0file1turn0file2  
- Each game has a different quality-gate shape, which makes a single “one size fits all” prompt pipeline brittle:
  - **Mr. Baseball Dynasty** runs in a TypeScript/React/Vite architecture with explicit canonical seams (worker-owned engine; `DashboardSnapshot` as HOME’s truth) and a test culture that fits CI cleanly. fileciteturn0file6turn0file0  
  - **Mr. Football Dynasty** is a single-file monolith with mirrored copies and a very specific verification contract (parse-check + hash parity), which is easy to automate but easy to regress if not enforced. fileciteturn0file7turn0file1  
  - **Cactus Ed’s Happiest Place** is single-file ES5/Phaser with an unusually important *browser-first continuity certification* loop—automation helps, but only if it respects the “certification honesty” rules you’ve already laid down. fileciteturn0file5turn0file2  

The real opportunity, then, is to replace manual copy/paste with **durable artifacts + automated gates**, and to position Claude as the “second brain” that is best used as a reviewer, verifier, and polish specialist (which your own baseball guide explicitly calls out as Claude Code’s best lane). fileciteturn0file6

## The automation primitives that unlock the biggest gains

A “GOAT-caliber” pipeline for AI-assisted game dev is less about adding more models and more about building **repeatable, verifiable workflows** that agents can follow without drift.

The core primitives that show up repeatedly across OpenAI’s Codex documentation and your internal guides are:

- **AGENTS.md** to encode repo rules, commands, “do not regress” bullets, and definition of done. Codex reads `AGENTS.md` before doing any work, and supports layered instructions. citeturn0search6  
- **Skills** to turn repeated workflows into reusable “one-command” agent behaviors (instead of re-prompting from scratch). Skills are supported across the Codex CLI, IDE extension, and app. citeturn0search2  
- **Plan-first execution** with explicit *Goal / Context / Constraints / Done when*, because Codex is measurably more reliable when it can reproduce, validate, and run commands. citeturn0search10turn0search3  
- **ExecPlans (PLANS.md)** for multi-hour systems work—Codex can follow a self-contained execution plan over long runs, and OpenAI explicitly documents how to structure these plans. citeturn0search4  
- **Worktrees / parallel threads** to avoid merge collisions when you have multiple workstreams. Codex best practices call out worktrees as the cleanest thread-management primitive in the app surface. citeturn0search3  
- **PR-based review automation** (when you have GitHub in the loop): Codex can review pull requests when you comment `@codex review`. citeturn0search0  

On the subscription side, your current stack is capable of supporting this:

- You’re on the entity["company","OpenAI","ai company"] $200/mo ChatGPT Pro plan, which OpenAI positions as scaled access to its best models and tools; Pro includes “unlimited access” to select models and advanced features (per OpenAI’s Pro announcements and help-center plan description). citeturn0search1turn0search5turn0search12  
- Codex is included with ChatGPT paid subscriptions (Plus/Pro/etc.), and OpenAI documents that Pro adds higher Codex usage limits and access to a fast Codex model tier. citeturn0search17turn0search16  
- entity["company","Anthropic","ai company"] positions Claude Code as an agentic coding tool that can read a codebase, edit files, and run commands across terminal/IDE/desktop/browser. citeturn1search0  
- Anthropic also documents that Claude Code can be used within Pro/Max allocations, that you can monitor remaining allocation with `/status`, and that you may need to wait for the usage period to reset (which matches your “out of tokens until tonight” reality). citeturn1search2  
- entity["company","Google","internet company"]’s Google AI Pro plan is positioned as bundling Gemini Advanced and developer-facing benefits like higher limits for Gemini CLI and code-assist surfaces (useful, but best treated as a supplemental lane rather than a core execution engine if your main flow is already Codex-centric). citeturn1search15turn1search18turn1search3  

## Five automation paths you can choose from

Below are five distinct paths, ordered roughly from “lowest setup friction” to “most automated studio-like.” Each path includes exactly where Claude (Claude, Claude Code, and/or Cowork) fits to add real leverage rather than just more chatter.

**Path A — Artifact-first pipeline with zero new infrastructure**

**What changes:** You keep using the same UIs, but you replace copy/paste with a single durable artifact that every agent reads and writes.

**Mechanism:** Create a repo-standard “Task + Handoff” pair:

- `TASK.md` (the *only* thing you author): Goal, Context (files), Constraints, Done-when, and verification steps—matching Codex’s recommended prompt structure. citeturn0search10turn0search3  
- `HANDOFF.md` (the *only* thing Codex writes at the end): short summary, exact commands run + results, files changed, risks/follow-ups, and a “next prompt suggestion” block (your Codex handoffs already look like this; you are just persisting it). fileciteturn0file0turn0file1  

**Where Claude fits (the moment tokens reset):** Claude becomes your **post-implementation reviewer**. You paste (or upload) just `HANDOFF.md` + the diff, and Claude flags:
- scope drift vs. `TASK.md`,
- missing tests or weak verification,
- copy/UX density issues (especially useful in your “broadcast UI” style systems),
- edge-case regressions (save/load, determinism, undefined collections). fileciteturn0file6turn0file7turn1search0  

**Why it’s high ROI:** It is the smallest delta from your current workflow, but it eliminates the highest-friction manual step (multi-hop transcript shuttling). It also turns every session into durable project memory—exactly the kind of “repo-resident instructions” your internal playbook argues for. fileciteturn0file3turn0file9  

**Tradeoffs:** This still requires you to manually run the loop, and it doesn’t magically parallelize work; it just makes each cycle tighter, less lossy, and more reviewable.

**Path B — Skill-driven execution with a stable “one-prompt to Codex” contract**

**What changes:** You stop having ChatGPT “re-explain the world” each time and instead move repeated instructions into **AGENTS.md + Skills**.

**Mechanism:**
- Add `AGENTS.md` to each repo with: build/test commands, determinism rules, “do not regress,” and the per-game verification contract. Codex reads this automatically before work, and it supports layered overrides for subdirectories. citeturn0search6turn0search13  
- Add 3–6 Codex skills per repo (stored in the repo) such as:
  - `bug-repro-and-fix`
  - `vertical-slice-milestone`
  - `save-safety-audit`
  - `ui-density-polish`
  - `release-notes-and-risk`  
  Skills are explicitly designed for reliable workflows and are supported across Codex surfaces. citeturn0search2  

**Where Claude fits:** Claude Code becomes a **secondary implementer and verifier** for the lanes your own guides already recommend for Claude:
- small polish commits,
- performance/state-size audits,
- regression-hunting, and
- post-merge cleanup. fileciteturn0file6turn1search0  

This also aligns with what Anthropic describes teams doing: using Claude Code for end-of-session documentation improvements and workflow refinement—exactly the kind of “continuous improvement loop” you want across three parallel games. citeturn1search4turn1search0  

**Why it’s high ROI:** You reduce prompt entropy. Your “Plan Prompt” becomes stable and short because the repo itself now contains the living rules. This is directly aligned with the highest-return Codex usage guidance you already have (plan-first, AGENTS.md, skills, worktrees). fileciteturn0file9turn0file3  

**Tradeoffs:** This is a real setup pass. The payoff is compounding, but you have to invest in writing good repo memory once per game.

**Path C — ExecPlan-based automation for multi-hour feature work**

**What changes:** Instead of iterating through multiple prompt hops, you write or approve a single **ExecPlan** and let Codex execute it end-to-end, updating the plan as it goes.

**Mechanism:**
- For any feature likely to take >1–2 hours (new core systems, big refactors, multi-surface UI upgrades), create `PLANS.md` + a task ExecPlan that is self-contained and has explicit verification gates. OpenAI provides a cookbook on how to structure ExecPlans so a coding agent can follow them without relying on hidden context. citeturn0search4turn0search8  
- This dovetails with the “durable memory” doctrine you’ve already been building in your Cactus Ed workflow (SPEC/PLAN/IMPLEMENT/DOCS style) and with your baseball game’s phase-driven architecture constraints. fileciteturn0file2turn0file6  

**Where Claude fits:** Claude becomes your **spec red-team** before Codex runs:
- “What’s ambiguous?”
- “Where can the agent over-engineer?”
- “What are the hidden save/migration/perf traps?”  

This mirrors the warning in your orchestration document about “technical debt injection” when agents are unguided, and it matches the recommendation to use strict iterative loops, verification, and context discipline. fileciteturn0file4  

**Why it’s high ROI:** ExecPlans reduce thrash: Codex can run longer without you having to re-assemble context every loop, and you get a durable “why/how” record.

**Tradeoffs:** ExecPlans work best when you already have solid repo memory and test gates. They also require more upfront clarity than a quick hack session.

**Path D — PR-and-CI automation with “AI review stacked on AI implementation”**

**What changes:** You move the loop from “copy/paste between chats” to “branch → PR → automated checks → review → merge.”

**Mechanism:**
- Codex implements on a branch (ideally in an isolated worktree) and opens a PR.
- You run automated quality gates in CI (tests/build/parse-check) per game.
- You trigger Codex PR review by commenting `@codex review` (OpenAI documents this flow). citeturn0search0  

**Where Claude fits:** Claude becomes the **second reviewer in the stack**, focused on the kinds of problems agents miss:
- UI copy/pacing and narrative tone consistency,
- security/perf sanity checks,
- “does this introduce a new system root instead of using the canonical one?”  
This is consistent with your baseball guide’s view of Claude as the integration verifier and polish/perf auditor layered on top of Codex’s bulk shipping. fileciteturn0file6  

**Why it’s high ROI:** PR workflow adds auditability and makes “AAA discipline” easier: every change is reviewable, testable, reversible, and attributable.

**Tradeoffs:** Requires that your repos are cleanly set up for CI gates—and single-file games need custom scripts for that (which is doable, but not automatic).

**Path E — Parallel “AI studio mode” across three games using worktrees and role locks**

**What changes:** You stop doing one game at a time in a serial chat loop and instead run a small studio: parallel workstreams with strict collision avoidance.

**Mechanism:**
- Use Codex app worktrees (or git worktrees) to isolate each task and prevent two agents from touching the same files at once. Codex best practices explicitly call out worktrees as a key thread-management primitive. citeturn0search3  
- Assign roles per worktree:
  - Codex: primary implementation
  - Claude Code: verifier/polish/perf/test improvements
  - ChatGPT: director (acceptance criteria, go/no-go)
  - Gemini: optional “third opinion” or brainstorming lane  
- Add a lightweight “lock” convention (even just a `LOCK.md` file in the worktree root) so humans and agents know what’s being edited where. This mirrors how parallel-agent teams handle merge pressure with explicit coordination and locks. citeturn1search19turn0search3  

**Where Cowork fits (optional):** Cowork is positioned by Anthropic as bringing “execution power” beyond developers. If you treat it as a producer/ops layer—task ingestion, status tracking, docs updates—then your coding agents stay focused on code while Cowork keeps the project state legible. citeturn1search1turn1search4  

**Why it’s high ROI:** This is the first path that truly “scales” when you’re running three games in parallel. It addresses the biggest second-order failure mode: context degradation and merge collisions.

**Tradeoffs:** This is the most operationally complex. You’ll need strong conventions (AGENTS, skills, verification scripts) or parallelism can turn into chaos.

## Fit-by-game quality gates you should encode into repo memory

The fastest way to make these paths real is to encode each game’s non-negotiables into `AGENTS.md` and (where useful) one skill called something like `ship-milestone`.

- **Mr. Baseball Dynasty:** Your guide defines canonical constraints (worker is source of truth; `DashboardSnapshot` is the HOME surface; heavy detail behind focused reads; preserve save compatibility). Codex handoffs already run `tsc`, tests, and Vite builds and report results; that’s exactly what you want to standardize as an automated gate. fileciteturn0file6turn0file0  
- **Mr. Football Dynasty:** Your guide and handoffs repeatedly rely on “monolith discipline” (single file + mirrored copies) and deterministic validation (parse-check and hash parity across the three JS copies). This is basically begging to be a one-command script that every agent runs before claiming done. fileciteturn0file7turn0file1  
- **Cactus Ed’s Happiest Place:** You’ve already proven the correct direction: treat `index.html` as implementation truth, keep a regression checklist grounded in real observed failures, validate in a real browser first, and never claim full certification unless you did a full continuity run. That entire doctrine is automation-friendly, but only if your automation respects honesty and does not confuse harness weakness with gameplay truth. fileciteturn0file2turn0file5  

## Guardrails that protect “AAA-tier” outcomes

Automation can make you faster, but it can also make you ship the wrong thing faster. The guardrails below are specifically aligned to what your guides already value: determinism, receipts, learnability, and humane engagement.

**Verification-first, always**
- Codex performs best when it can run commands and validate work, which is why OpenAI’s Codex guidance repeatedly centers plan-first execution and explicit “Done when” verification. citeturn0search10turn0search3  
- Your own Codex handoff logs already follow that structure (commands + results), so the automation goal is to enforce it as a non-optional gate, not to invent a new ceremony. fileciteturn0file0turn0file1turn0file2  

**Context discipline to avoid over-engineering**
- Your orchestration doc explicitly warns that unguided autonomous coding tends to inject unnecessary complexity and technical debt, and it argues for a disciplined loop (plan → implement small → run tools → observe → repair). fileciteturn0file4  
- OpenAI’s guidance similarly emphasizes planning patterns (including ExecPlans) and selecting reasoning effort appropriately (medium as a default; higher for harder tasks). citeturn0search4turn0search10  

**Humane engagement rather than compulsion**
- Your game guides already explicitly warn against “cheap compulsion design” and emphasize engagement built on competence, autonomy, curiosity, and consequence. fileciteturn0file7turn0file5  
- The research paper you attached supports why this matters: game engagement (flow/presence/immersion) can be associated with craving, with gratification and compensation experiences mediating that relationship; the authors suggest highly engaging games may have higher addictive potential. fileciteturn0file8  

A practical automation implication: add a lightweight “compulsion risk” checklist to your review gate (Claude is well-suited to enforce this as a reviewer), so your AAA push doesn’t accidentally optimize for the wrong psychological lever. fileciteturn0file7turn0file5turn0file8  

## Subscription leverage and how to position Claude in your stack

Given your subscription mix, the most leverage-per-token tends to come from using each system in the lane it’s optimized for:

- ChatGPT Pro can remain the **director layer** (specs, acceptance criteria, orchestration, system-level reviews), consistent with OpenAI’s positioning of Pro as scaled access to their best models and tools and with Codex being included in paid plans. citeturn0search1turn0search5turn0search17  
- Codex remains the **primary implementer** and build/test runner, with the workflow hardened via AGENTS/skills/ExecPlans and (optionally) PR review automation. citeturn0search6turn0search2turn0search4turn0search0  
- Claude (and Claude Code) becomes the **quality gate + polish + regression hunter**, which is directly aligned with (a) how your baseball guide positions Claude’s best role and (b) Anthropic’s description of Claude Code as an execution-capable coding agent and their guidance on staying within plan allocations. fileciteturn0file6turn1search0turn1search2  
- Cowork is best treated as an optional **ops/producer layer** if you want more asynchronous, “studio-like” orchestration beyond code—Anthropic explicitly frames it as extending agentic execution beyond just developers. citeturn1search1turn1search4