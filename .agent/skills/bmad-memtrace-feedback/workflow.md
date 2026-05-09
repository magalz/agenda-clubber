# Memtrace Feedback Workflow

## Execution

<workflow>

<step n="1" goal="Detect session context">
  <action>Run `git log --oneline -5` to get recent commits</action>
  <action>Run `mcp__memtrace__list_indexed_repositories` to verify Memtrace is connected</action>
  <action>Get current timestamp for the entry header</action>
  <output>Session Context:
    - Date: {{current_date}}
    - Agent: {{agent_model_name_version}}
    - Repos: {{indexed_repos}}
    - Recent commits: {{recent_commits}}
  </output>
</step>

<step n="2" goal="Collect Memtrace usage data">
  <check if="Memtrace MCP tools were used this session">
    <action>List the Memtrace tools that were invoked:
      - find_code / find_symbol
      - get_impact / get_symbol_context
      - get_codebase_briefing / get_evolution
      - find_dead_code / find_most_complex_functions
      - find_bridge_symbols / find_central_symbols
      - get_process_flow / list_processes
      - watch_directory / list_watched_paths
    </action>
  </check>
</step>

<step n="3" goal="Fill and append feedback entry">
  <action>Load the template from template.md</action>
  <action>Fill each section based on session experience</action>
  <action>Read existing `docs/memtrace-sessions-feedbacks.md` (if exists)</action>
  <action>Append the new entry at the end</action>
  <check if="docs/memtrace-sessions-feedbacks.md does NOT exist">
    <action>Create it with a header and the first entry</action>
  </check>
</step>

<step n="4" goal="Record external episode (optional)">
  <check if="entry contains actionable feedback (bugs, feature requests, significant findings)">
    <action>Call `mcp__memtrace__record_external_episode` with:
      - repo_id: "agenda-clubber"
      - source_type: "session_feedback"
      - source_id: "feedback-{{YYYY-MM-DD-HHmm}}"
      - metadata: {summary, tools_used, findings}
    </action>
  </check>
</step>

</workflow>
