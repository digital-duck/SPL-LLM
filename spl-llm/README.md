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
- **`CREATE FUNCTION`** / **`CREATE PROCEDURE`** / **`CREATE TOOL_API`** — all three definition forms highlighted as declaration keywords
- **`LANGUAGE PYTHON`** — implementation language clause for `CREATE TOOL_API` bodies
- `@variables` and `:=` assignment
- `$$...$$` heredoc bodies with `{param}` slot highlighting (prompt templates) or Python code (TOOL_API)
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
| `INPUT` / `OUTPUT` | Parameter declarations |
| `USING MODEL` | Per-call model override |
| `BUDGET` | Token limit for a `GENERATE` call |
| `RAG` / `MEMORY` / `CONTEXT` | Data access patterns |
| `LOGGING LEVEL` | Structured log emission |
| `CREATE FUNCTION` | Define a reusable LLM prompt template (probabilistic) |
| `CREATE PROCEDURE` | Define a reusable multi-step sub-workflow |
| `CREATE TOOL_API` | Define a deterministic Python tool — routed to Python, never to the LLM |
| `LANGUAGE PYTHON` | Implementation language clause in `CREATE TOOL_API` |

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
-- ── Deterministic tool: Python execution, never touches the LLM ──────────────
CREATE TOOL_API stock_price(ticker TEXT) RETURNS FLOAT
LANGUAGE PYTHON AS
$$
import yfinance as yf
return yf.Ticker(ticker).info['regularMarketPrice']
$$

-- ── Probabilistic function: LLM prompt template ───────────────────────────────
CREATE FUNCTION summarize({text}) RETURNS TEXT AS
$$
Summarize the following in 3 bullet points:
{text}
$$

-- ── Workflow: hybrid computation ─────────────────────────────────────────────
WORKFLOW analyze_stock
  INPUT:  @ticker TEXT
  OUTPUT: @report TEXT

  -- Deterministic fetch via TOOL_API (Python, exact)
  CALL stock_price(@ticker) INTO @price

  -- Probabilistic analysis via LLM
  GENERATE "Stock {@ticker} is at ${@price}. Provide brief analyst commentary." INTO @report
    USING MODEL "claude-sonnet-4-6"
    WITH BUDGET 512 TOKENS

  -- Conditional branching
  EVALUATE @report
    WHEN = "" THEN RAISE QualityBelowThreshold
    OTHERWISE   RETURN @report WITH status="done"
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

### 0.0.5
- **`CREATE TOOL_API` syntax support** — new declaration keyword highlighted alongside `CREATE FUNCTION` and `CREATE PROCEDURE`
- **`LANGUAGE PYTHON` clause** — highlighted as keyword + language constant in `CREATE TOOL_API` bodies
- **Hover docs** for `CREATE TOOL_API`: full description of the deterministic Python tool pattern, regime principle, and `tool-api list/promote/remove` CLI commands
- **Hover docs** for `LANGUAGE` clause
- **Updated `create` hover** to document all three `CREATE` forms and the hybrid computation 2×2 matrix they complete
- **Quick reference** updated with a hybrid computation example (TOOL_API + GENERATE in one workflow)
- **Fixed: control-flow and generator keywords not highlighted** — added `configurationDefaults` with `editor.tokenColorCustomizations` TextMate rules so that `WHILE`, `CALL`, `GENERATE`, `END`, `RETURN`, `EXCEPTION`, `WHEN`, `THEN` are always colored regardless of the active theme. The root cause was theme scope-selector specificity: themes with explicit rules only for `keyword.declaration` left `keyword.control.flow.spl` and `keyword.other.generate.spl` uncolored

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
