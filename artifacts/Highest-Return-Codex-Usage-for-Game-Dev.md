

## **The highest-return way to use Codex for game dev**

* **Pick the right surface for the job.** Use the **IDE extension** for the tight inner loop because it automatically includes open files and selections as context. Use the **CLI** when you want keyboard-first control and shell-heavy debugging. Use the **Codex app** when you want built-in worktrees, Git diff review, automations, and multiple projects open at once. If your repo has game client \+ backend \+ tools, split them into separate app projects so the sandbox only sees the relevant files. 

* **Start every real feature with /plan.** OpenAI’s docs explicitly recommend planning first for complex or ambiguous work, and you can toggle plan mode with /plan or Shift+Tab. A very effective pattern is: “Interview me first, challenge my assumptions, then implement only Milestone 1.” That keeps Codex from doing the classic overenthusiastic raccoon thing where it builds half the zoo before you agreed on the fence. 

* **Use a four-part prompt structure.** The best default format is: **Goal, Context, Constraints, Done when**. That structure is straight from the Codex best-practices guidance and it works extremely well for gameplay systems, UI screens, save/load changes, enemy behaviors, and build tooling. 

* **Make verification part of the task.** Don’t ask “fix this bug.” Give Codex exact repro steps, tell it what commands to run, and tell it how you will verify the result in-game. OpenAI’s prompting and workflow docs keep hammering this point: Codex gets better when it can reproduce, validate, rerun checks, and report the exact commands and results. 

* **Teach it your repo once with AGENTS.md.** This is one of the biggest unlocks. Use /init to scaffold an AGENTS.md, then edit it so Codex knows your repo layout, build/test/lint commands, conventions, do-not-touch zones, and what “done” means. Codex supports layered instructions too: global defaults in \~/.codex/AGENTS.md, repo rules at the root, and more specific rules deeper in the tree. 

* **Use worktrees for side quests.** Codex’s app and docs lean hard into worktrees for parallel work. That is perfect for game development: one thread on combat, one on menus, one on save migration, one on test cleanup. Worktrees keep those changes isolated and let you hand work back to your local checkout later. Also: avoid having two live threads edit the same files unless you enjoy archaeological merge disasters. 

* **Configure worktrees so they boot ready.** Local environments let you define setup scripts that run when a worktree is created, and actions that show up in the app’s top bar. For a game repo, that can mean install/build steps, starting the dev server, running a fast test suite, or launching a toolchain command without retyping it every time. 

* **Choose model and reasoning on purpose.** OpenAI currently recommends starting with gpt-5.4. gpt-5.3-codex-spark is the fast-iteration option for ChatGPT Pro. Use lower reasoning for quick, well-scoped edits; medium or high for real debugging; extra high for long-horizon tasks. You can switch models mid-session with /model. 

* **Review aggressively.** Use /review locally before you commit. In the app, review diffs and leave inline comments right on the changed rows. On GitHub, turn on Codex review and use @codex review on PRs. You can even encode review rules in AGENTS.md, which is great for game-specific concerns like save-data compatibility, controller navigation, or perf-sensitive code paths. 

* **Turn repeat work into skills, not repeated prompts.** OpenAI now marks custom prompts as deprecated and recommends **skills** instead. Skills work across the CLI, IDE extension, and app, can be invoked with $, and can live in your repo under .agents/skills so the whole team shares them. For a game project, I’d make skills like vertical-slice, bug-repro, ui-polish, perf-triage, and release-notes. 

* **Use MCP when the truth lives outside the repo.** Codex supports MCP in the CLI and IDE extension for third-party docs and tools. That is useful when the real context is in engine docs, browser-based telemetry, Figma files, or internal tools instead of the source tree. 

* **Exploit screenshot-driven UI work.** OpenAI’s workflow examples explicitly support attaching screenshots and iterating while a live dev server is running. That is gold for HUDs, inventory panels, shop screens, pause menus, and settings pages: attach the mockup, specify controller/keyboard behavior, and iterate in small steps while you watch the result live. 

* **Offload the boring machinery.** The Codex app supports background automations, and codex exec lets you run Codex inside scripts and CI with JSON or schema-based output. That’s useful for nightly change summaries, flaky-test triage, release notes, risk reports before a build, or structured bug sweeps. 

## **Shortcuts worth memorizing**

**CLI:** /plan, /review, /compact, /fork, /resume, /mention, /status, /permissions, /model, /init, and /agent.

**IDE:** /local, /cloud, /auto-context, /review, /status; Cmd/Ctrl+Shift+P opens the Command Palette and Cmd/Ctrl+N starts a new thread.

**App:** Cmd+J toggles the integrated terminal.

**Skills:** type $ to invoke one directly.

One underrated speed trick from the docs: the app supports **speech dictation**, which is handy when you’re narrating a feature while playtesting instead of stopping to type every thought like a stenographer trapped in a game jam. 

## **Paste-ready prompts for game work**

These mirror the official Codex patterns: explicit context, tight constraints, and explicit verification. 

/plan  
Goal:  
Add coyote time and jump buffering to the player controller.

Context:  
\- @PlayerController.cs  
\- @InputBuffer.cs  
\- @PlayerMovementTests.cs  
\- Test scene: Assets/Scenes/TestMovement.unity

Constraints:  
\- No new packages  
\- No per-frame allocations in hot paths  
\- Preserve current dash behavior  
\- Keep existing input bindings

Done when:  
\- Coyote time and jump buffer both work at 100 ms  
\- Affected tests are added or updated  
\- Project compiles  
\- No new console errors  
\- List exact manual verification steps in the test scene  
Bug:  
Sometimes the pause menu closes, but input stays locked until scene reload.

Repro:  
1\. Start in Level\_02  
2\. Open pause menu  
3\. Change one setting  
4\. Close pause menu  
5\. Try to move with keyboard and controller

Constraints:  
\- Minimal fix  
\- Do not change save-data format  
\- Add a regression test if feasible

Start by reproducing the bug locally, then propose the patch, then rerun the repro and the smallest relevant test/build commands. Report exact commands and results.  
Use the attached screenshot as the target for the inventory screen.

Constraints:  
\- Reuse existing UI components where possible  
\- Support keyboard and controller navigation  
\- Match spacing and hierarchy closely  
\- Do not touch unrelated scenes or art assets

Done when:  
\- Inventory opens from the pause menu  
\- Focus order is correct  
\- No new console errors  
\- Tell me the exact scene/route and steps to verify it  
/profile  
Focus on the enemy spawn system in @SpawnDirector.cs and @WaveController.cs.

Goal:  
Find the 3 most likely hot-path problems causing frame spikes in the combat arena.

Constraints:  
\- Smallest safe fix first  
\- Preserve gameplay behavior  
\- Prefer measurement over guesses

Done when:  
\- You report before/after measurements  
\- You list exact commands, scene, and test conditions  
\- You summarize tradeoffs of each change

## **A minimal** 

## **AGENTS.md**

##  **for a game repo**

This is the single highest-value file to add next, because Codex auto-loads that guidance and uses it across sessions. 

\# AGENTS.md

\#\# Repository expectations  
\- Engine/runtime: \[Unity / Unreal / Godot / custom\]  
\- Main local run/build command: \[fill this in\]  
\- Tests command: \[fill this in\]  
\- Lint/format command: \[fill this in\]

\#\# Working rules  
\- Keep changes small and reversible.  
\- Do not edit generated folders or binary assets unless the task explicitly requires it.  
\- For gameplay code, separate input, simulation, and presentation when practical.  
\- For hot-path systems, avoid per-frame allocations and unnecessary polling.  
\- When changing save/load or networking, preserve backward compatibility or document migration clearly.  
\- Reuse existing patterns before creating new abstractions.

\#\# Done when  
\- Project builds  
\- Affected tests pass  
\- No new console/runtime errors appear  
\- Manual verification steps are listed  
\- Changed files stay tightly scoped to the task

## **Two footguns to avoid**

Don’t give Codex wide-open permissions too early; the docs recommend starting with tighter approvals and loosening only when the workflow is trusted. Also don’t automate a task until it works reliably by hand, and don’t run multiple live threads on the same files without worktrees. That way lies chaos, merge goo, and the faint smell of burnt sprint planning. 

If you only do three things this week, do these: add AGENTS.md, start every serious feature with /plan, and create one repo skill like vertical-slice or bug-repro. That trio will save more time than any clever one-shot prompt. 

Best next step: share your engine and repo layout, and we’ll turn this into a game-specific AGENTS.md plus a few reusable Codex skills.

