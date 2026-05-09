═══════════════════════════════════════════════════════════
BUG 1/5 — `delete_repository` fails with codec error
═══════════════════════════════════════════════════════════

**What broke:** Both `memtrace reset <repo-id>` CLI and the MCP `delete_repository` tool fail with `codec: bad kind 164`, making it impossible to remove stale/ghost repo entries from the catalog.

**What you expected:** Repository records should be deleted cleanly, removing all associated nodes, edges, and embeddings.

**Reproduction:**
```
# CLI path
memtrace reset "RUST_BACKTRACE=1"

# MCP path
mcp__memtrace__delete_repository(repo_id="RUST_BACKTRACE=1")
```
Both hang indefinitely at the deletion step. The CLI output:
```
1/3  Stopping daemon … ✓ stopped
2/3  Deleting repository records … ✗   <-- hangs here forever
```
The MCP returns immediately:
```
MCP error -32603: embedded: delete_by_property(Edge, repo_id) failed: codec: bad kind 164
```

**Environment:** memtrace 0.3.86 · Windows 11 (PowerShell 5.1) · OpenCode (DeepSeek v4 Pro)

**Repo:** TypeScript/Next.js, ~200 source files, single-package, git repo with ~30-day history being replayed

**Logs / error output:**
```
MCP error -32603: embedded: delete_by_property(Edge, repo_id) failed: codec: bad kind 164
```

**Probable cause:** ArcadeDB internal codec mismatch when iterating edges during cascade deletion. The `codec: bad kind 164` suggests an edge kind enum value not recognized by the deserializer. This may be triggered when edges were created by an older Memtrace version (pre-v0.3.85) where Windows path normalization was broken and `repo_id` derivation was inconsistent — some edges may reference repo IDs in formats the current codec can't resolve.

**Proposed fix:** (1) Add a guard in `delete_by_property(Edge, repo_id)` to skip edges with unrecognized kinds instead of aborting the entire transaction, logging a warning for manual cleanup. (2) Alternatively, offer a `memtrace reset --force` flag that drops nodes/edges in per-kind batches wrapped in individual try/catch so one bad kind doesn't block the rest.

═══════════════════════════════════════════════════════════
BUG 2/5 — `find_dead_code` returns symbols deleted from current HEAD
═══════════════════════════════════════════════════════════

**What broke:** `find_dead_code` returns 17 Shadcn UI symbols (`CommandSeparator`, `DialogTrigger`, `SheetTrigger`, `DialogClose`, `SheetClose`, `DropdownMenuShortcut`, `SelectGroup`, `SelectLabel`, `SelectSeparator`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea`, `ProgressLabel`, `ProgressValue`, `CommandShortcut`, `SheetFooter`) that were **removed from the codebase 3 days ago** and no longer exist in any file on disk or any commit on the current branch.

**What you expected:** `find_dead_code` should filter results to the current HEAD state of the repository, excluding symbols that only exist in historical git episodes.

**Reproduction:**
```
mcp__memtrace__find_dead_code(repo_id="agenda-clubber", limit=30)
```
Observe symbols known to be deleted appear with paths like:
`\\?\D:\Repos\agenda-clubber\src\components\ui\command.tsx` — `CommandSeparator` (line 137)

These exports were removed in commit on branch `main`. Confirmed via grep:
```
rg "CommandSeparator" D:\Repos\agenda-clubber\src\   → 0 matches
```

**Environment:** memtrace 0.3.86 · Windows 11 · OpenCode

**Repo:** TypeScript/Next.js, ~200 files, single-package

**Logs / error output:**
```json
{"file_path":"\\\\?\\D:\\Repos\\...\\src\\components\\ui\\command.tsx","kind":"Function","name":"CommandSeparator","reason":"no incoming references","start_line":137}
{"file_path":"\\\\?\\D:\\Repos\\...\\src\\components\\ui\\dialog.tsx","kind":"Function","name":"DialogTrigger","reason":"no incoming references","start_line":14}
// ... 15 more deleted Shadcn symbols
```

**Probable cause:** During `index_directory`, git history replay (`replay_history`) creates nodes for every symbol that ever existed in any indexed commit. `find_dead_code` does not filter out nodes whose `valid_until` timestamp is in the past — i.e., symbols that were deleted in a subsequent commit. The query treats them as "live" because no explicit tombstone episode marks them as removed.

**Proposed fix:** Add a temporal filter to `find_dead_code`: exclude any node whose latest episode was a DELETE/REMOVED operation, or whose `valid_until < HEAD_commit_timestamp`. The episode replay already tracks add/modify/remove per symbol — `find_dead_code` should consult that temporal state before listing a symbol as a candidate.

═══════════════════════════════════════════════════════════
BUG 3/5 — `file_path` normalization incomplete (`\\?\` Windows prefix)
═══════════════════════════════════════════════════════════

**What broke:** Symbols appear duplicated 2-3x in query results (`find_most_complex_functions`, `get_codebase_briefing`, `find_dead_code`) because the same file is stored with both `D:\Repos\...` and `\\?\D:\Repos\...` path formats. For example, `claimArtistProfileAction` and `saveArtistOnboardingAction` each appear twice in the high-risk listing.

**What you expected:** Each symbol should appear exactly once with a single normalized `file_path`.

**Reproduction:**
```
mcp__memtrace__get_codebase_briefing(repo_id="agenda-clubber")
```
Observe the `high_risk_functions` array contains duplicates:
```
claimArtistProfileAction  D:\Repos\agenda-clubber\src/features/artists/actions.ts      (line 409)
claimArtistProfileAction  \\?\D:\Repos\agenda-clubber\src\features\artists\actions.ts  (line 409)
saveArtistOnboardingAction  D:\Repos\agenda-clubber\src/features/artists/actions.ts    (line 43)
saveArtistOnboardingAction  \\?\D:\Repos\agenda-clubber\src\features\artists\actions.ts (line 43)
```

**Environment:** memtrace 0.3.86 · Windows 11 · OpenCode

**Repo:** TypeScript/Next.js, ~200 files, single-package

**Probable cause:** v0.3.85 fixed `repo_id` derivation via `RepoIdentity::from_path` (release notes mention drive-letter case drift and `\\?\` prefix normalization). However, `file_path` properties stored on individual CodeNode records still contain raw/unescaped paths from the parser/scanner. The normalization was only applied to the repository-level identity, not to per-symbol file paths. Over time, different index runs (pre- and post-fix) stored the same file under different path formats, and both persist in the graph.

**Proposed fix:** (1) Add a `file_path` normalization step in the scanner/parser (or as a post-processing pass) that strips `\\?\`, normalizes separators to forward slashes, and lowercases the drive letter before storing. (2) On the query side, deduplicate results by normalizing `file_path` at read time as a defensive layer. (3) For existing graphs, offer a migration that updates all `file_path` properties to the canonical form.

═══════════════════════════════════════════════════════════
BUG 4/5 — Daemon dies immediately on Windows (`memtrace daemon start`)
═══════════════════════════════════════════════════════════

**What broke:** `memtrace daemon start` prints "started" but the daemon process exits within 2-3 seconds. `memtrace daemon status` reports "not running". The Windows Service (`dev.memtrace.daemon`, installed via `memtrace daemon install` as admin) is in Stopped state and fails to start with "Cannot open service".

**What you expected:** The daemon should keep running as a background process (or Windows Service), surviving the parent shell and maintaining watchers, episode recording, and cross-session state.

**Reproduction:**
```
memtrace daemon install          # requires admin, creates Windows Service
memtrace daemon start            # prints "started"
sleep 3
memtrace daemon status           # prints "not running"
```
Windows Service verification:
```
Get-Service -Name "dev.memtrace.daemon"   # Status: Stopped
Start-Service -Name "dev.memtrace.daemon" # Error: Cannot open service
```

**Environment:** memtrace 0.3.86 · Windows 11 (PowerShell 5.1) · OpenCode

**Repo:** TypeScript/Next.js (impact: watchers don't persist between sessions, requiring manual `watch_directory` on every restart)

**Logs / error output:**
```
> memtrace daemon start
memtrace daemon (windows): started

> memtrace daemon status
memtrace daemon (windows): not running
```
No log files found under `~/.memtrace/logs/`.

**Probable cause:** The daemon process may be failing during initialization — possibly ArcadeDB failing to connect (port conflict, permissions, missing data directory), or a runtime panic that exits silently before registering itself with the service manager. The `memtrace daemon start` CLI reports success optimistically before the daemon's health check passes.

**Proposed fix:** (1) Add a startup health-check loop in `daemon start`: after spawning, poll the daemon for 5-10 seconds and report the actual outcome (running / failed with reason). (2) Log daemon startup errors to `~/.memtrace/logs/daemon.log` so failures are diagnosable. (3) Ensure the daemon binary can run in non-service mode (foreground process) for testing, with `--verbose` flag to see what step it dies on.

═══════════════════════════════════════════════════════════
BUG 5/5 — Watchers lost on MCP disconnect / session restart
═══════════════════════════════════════════════════════════

**What broke:** Every time the MCP client disconnects (OpenCode restart, Claude Code restart, etc.), all active `watch_directory` registrations are lost. `list_watched_paths` returns `count: 0` on the next session.

**What you expected:** Watcher registrations should persist across MCP sessions. Either the daemon should maintain them independently (if installed), or the MCP server should restore them from durable state on startup.

**Reproduction:**
```
# Session 1
mcp__memtrace__watch_directory(path="D:\Repos\my-project", repo_id="my-project")
mcp__memtrace__list_watched_paths()  → count: 1 ✓

# Close OpenCode, reopen
mcp__memtrace__list_watched_paths()  → count: 0 ✗
```

**Environment:** memtrace 0.3.86 · Windows 11 · OpenCode

**Repo:** TypeScript/Next.js (~200 files). Impact: every session must manually re-activate watch, which agents often forget, causing `get_evolution` and `get_changes_since` to miss working-tree episodes.

**Probable cause:** Watch registrations are held in-memory only (inside the MCP server process). There is no durable persistence layer — no `watches.json`, no database table, no filesystem marker. When the MCP process exits, the watch list evaporates. The daemon (Bug #4) was intended to solve this by being the persistent process, but since it doesn't stay alive on Windows, there is no surviving process to maintain the watch list.

**Proposed fix:** (1) Short-term: persist watch registrations to a `~/.memtrace/watches.json` file on every `watch_directory` / `unwatch_directory` call. On MCP startup, restore all watches from that file. (2) Long-term: once Bug #4 (daemon) is fixed, the daemon becomes the single source of truth for watches and the MCP server reads from it on connect. (3) Add a `restore_watches_on_startup: true` config option.
