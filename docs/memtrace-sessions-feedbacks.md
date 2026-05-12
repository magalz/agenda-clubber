# Session Analysis Protocol - Memtrace

**Scope Instruction:** Analyze only the actions and data generated within the current session (present execution context). Include interactions from other agents only if they occurred within this specific flow. Do not evaluate historical data from previous sessions. You can use the Memtrace documentation if you need.

**Should you create a entry?** Edit this file ONLY if:
- You used memtrace in the session
- You could have use it to improve your actions but didn't for some reason (ex: customization didn't have the right tools, customization loaded too late, you didn't have access to memtrace, etc).

### 1. Analysis Dimensions
Evaluate the session based on the following criteria:
- **Memtrace Utilization:** How was Memtrace effectively deployed during this session?
- **Counterfactual Analysis:** What would the result or required effort look like without Memtrace?
- **Measurable Gains:** Identify quantitative or structural improvements (efficiency, accuracy, time). Be conservative if using time. Don't overstate.
- **Usage Optimization:** How could the I/The agents have utilized Memtrace Tools more effectively within this specific session?
- **Feature Recommendation:** What technical capability is missing in Memtrace to facilitate this specific workflow?

### 2. Validation & Deduplication
- **Optimization Check:** Before recording new "Usage Optimization" points, verify if they already exist in the file. Do not duplicate entries.
- **Context Check:** Before suggesting improvements, verify if they are already part of your current customization instructions or context. If already implemented or configured, ignore.

### 3. Feature Suggestion Constraints
Only add items to the "Feature Recommendation" section if they meet the following three requirements:
1. **Technical Feasibility:** Must be possible to implement within the software architecture.
2. **Platform-Level Requirement:** The feature must require changes to Memtrace's code or infrastructure (cannot be resolved via prompt engineering or agent-side logic).
3. **Substantive Value:** If no suggestion meets these criteria, leave this field blank.

### 4. Results Logging
Record the findings strictly following the formatting pattern and structure established by previous agents in this file.

## Template (copy for each session)

```yaml
session:
  epic: "[epic tag – e.g. epic-4, epic-5]"
  process: "[process tag – e.g. criação de epico, criação de story x-x, implementação de story 4-3, revisao pos-dev, etc.]"
  date: "[YYYY-MM-DD]"
  agent: "[model name]"
  commits: "[sha1] [sha2] ..."
```
End the entry using the complete timestamp (Date and Time) instead of only the date.

---

# Memtrace Session Log — Épico 4
