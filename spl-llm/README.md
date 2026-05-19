# SPL-LLM — VS Code Extension

Language support for **SPL (Structured Prompt Language)**, a declarative language for
designing, running, and evaluating LLM workflows. SPL is syntactically inspired by SQL
and brings structure and observability to prompt engineering — making the gap between
natural-language intent and LLM execution visible and measurable.

---

## Features

### Syntax Highlighting
Full TextMate grammar for `.spl` files:
- Keywords: `WORKFLOW`, `GENERATE`, `CALL PARALLEL`, `EVALUATE`, `WHILE`, `IMPORT`, `COMMIT`, …
- `@variables` and `:=` assignment
- `$$...$$` prompt body heredocs with `{param}` slot highlighting
- F-strings: `f"...{@var}..."`, `f"""..."""`
- String literals (single, double, triple-quoted)
- `-- line comments` and `/* block comments */`
- Built-in functions: `summarize()`, `classify()`, `web_search()`, `json_get()`, …
- Exception types: `HallucinationDetected`, `QualityBelowThreshold`, …
- SPL data types: `TEXT`, `INT`, `FLOAT`, `BOOL`, `LIST`, `MAP`, `JSON`, …
- Markdown code blocks (` ```spl `) are also highlighted

### Hover Documentation
Hover over any SPL keyword to see its description and a usage example. Coverage includes:

| Keyword | Description |
|---------|-------------|
| `WORKFLOW` | Top-level workflow declaration |
| `IMPORT` | Load workflow definitions from an external `.spl` file |
| `GENERATE` | Invoke the LLM and capture output into a variable |
| `CALL` | Invoke a named workflow or stdlib function |
| `CALL PARALLEL` | Dispatch multiple sub-workflows concurrently |
| `EVALUATE` | Pattern-match a variable across `WHEN` cases |
| `WHILE` | Loop while a condition is true |
| `FOR` | Iterate over a list |
| `COMMIT` / `RETURN` | Exit the workflow and signal a status channel |
| `RAISE` / `EXCEPTION` | Raise and catch named exceptions |
| `IMPORT` | Multi-file workflow loading |
| `INPUT` / `OUTPUT` | Parameter declarations |
| `USING MODEL` | Per-call model override |
| `BUDGET` | Token limit for a `GENERATE` call |
| `RAG` / `MEMORY` / `CONTEXT` | Data access patterns |
| `LOGGING LEVEL` | Structured log emission |

### Validate on Save
When you save an `.spl` file, the extension automatically runs `spl3 validate` and
shows inline squiggles for syntax errors and semantic warnings:

- **Red squiggles** — syntax errors or semantic errors (undefined variable reads,
  unreachable code after `RETURN`)
- **Yellow squiggles** — warnings (e.g. `WHILE` loop with no reachable exit)

### Commands
Open the Command Palette (`Ctrl+Shift+P`) and search for:

| Command | Description |
|---------|-------------|
| `SPL: Validate Current File` | Syntax check only |
| `SPL: Validate Current File (with semantic checks)` | Syntax + undefined vars, unreachable code, infinite loops |

---

## Requirements

- VS Code `^1.108.0`
- [`spl3`](https://github.com/digital-duck/SPL.py) installed and on `PATH` (or configured via `spl-llm.spl3Path`)

---

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `spl-llm.validateOnSave` | `true` | Run `spl3 validate` automatically on save |
| `spl-llm.semanticValidation` | `true` | Include semantic checks (undefined vars, unreachable code, infinite loops) |
| `spl-llm.spl3Path` | `"spl3"` | Path to the `spl3` executable — set to a full path if `spl3` is inside a conda env |

**Example** — if `spl3` lives in a conda environment named `spl123`:

```json
{
  "spl-llm.spl3Path": "/home/yourname/miniconda3/envs/spl123/bin/spl3"
}
```

---

## Installation

### From .vsix (local build)

```bash
code --install-extension spl-llm-0.0.4.vsix
```

Then reload VS Code (`Ctrl+Shift+P` → **Developer: Reload Window**).

### From VS Code Marketplace

Search for **SPL-LLM** in the Extensions panel (coming soon).

---

## SPL Language Quick Reference

```spl
-- Declare a workflow
WORKFLOW summarize_article
  INPUT:  @url TEXT
  OUTPUT: @summary TEXT

  -- Fetch and generate
  CALL fetch_page(@url) INTO @content
  GENERATE "Summarize in 3 bullet points: {@content}" INTO @summary
    USING MODEL "claude-sonnet-4-6"
    WITH BUDGET 1024 TOKENS

  -- Conditional branching
  EVALUATE @summary
    WHEN = "" THEN RAISE QualityBelowThreshold
    OTHERWISE   RETURN @summary WITH status="done"
  END

  EXCEPTION
    WHEN QualityBelowThreshold THEN RETRY
    WHEN OTHERS                THEN RAISE RuntimeError
  END
END
```

For the full language reference see the
[SPL User Guide](https://github.com/digital-duck/SPL.py/blob/main/docs/GUIDE/USER-GUIDE.md).

---

## Release Notes

### 0.0.4
- **Validate-on-save** with inline error/warning squiggles (`spl3 validate`)
- **Hover docs** for all SPL 3.0 keywords with descriptions and examples
- Two new commands: `SPL: Validate Current File` and `SPL: Validate Current File (with semantic checks)`
- Three new settings: `validateOnSave`, `semanticValidation`, `spl3Path`
- Categories updated to `Programming Languages` + `Linters`

### 0.0.3
- Hover provider for SPL 2.0 keywords (`BUDGET`, `PROMPT`, `GENERATE`, `USING MODEL`, …)
- Syntax highlighting for `$$...$$` prompt bodies, f-strings, exception types, data types

### 0.0.2
- Extended TextMate grammar: variables, operators, built-in functions, markdown injection

### 0.0.1
- Initial release with basic SPL syntax highlighting
