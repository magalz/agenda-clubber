---
name: bmad-memtrace-feedback
description: Record structured Memtrace feedback at the end of any BMad session. Use when asked to register tooling feedback.
---

# Memtrace Feedback Recorder

## Overview

Records structured feedback about Memtrace usage at the end of BMad sessions (create-story, dev-story, code-review, QA, retrospective). Appends to `memtrace-sessions-feedbacks.md` and optionally calls `record_external_episode` on the Memtrace graph.

## When to Use

- At the end of any session where Memtrace tools were used (or could have been used)
- When the user says "register feedback", "record session", or "log memtrace session"

## Outputs

1. Appended entry in `docs/memtrace-sessions-feedbacks.md`
2. (Optional) External episode recorded in Memtrace graph via `record_external_episode`
