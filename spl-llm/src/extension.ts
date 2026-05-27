import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

// ─── Hover documentation ──────────────────────────────────────────────────────

interface HoverEntry {
    title: string;
    body: string;
    example?: string;
}

const HOVER_DOCS: Record<string, HoverEntry> = {
    // ── Declarations ──────────────────────────────────────────────────────────
    workflow: {
        title: '🔄 WORKFLOW',
        body: 'Declares a named SPL workflow — the top-level unit of execution.\n\nA workflow has optional `INPUT` / `OUTPUT` parameter blocks and a body of SPL statements.',
        example: 'WORKFLOW summarize_article\n  INPUT: @url TEXT\n  OUTPUT: @summary TEXT\n  ...\nEND',
    },
    import: {
        title: '📦 IMPORT',
        body: 'Loads workflow definitions from an external `.spl` file at parse time.\n\nAll `WORKFLOW` definitions in the imported file become available in the current file.',
        example: "IMPORT 'lib/code_agents.spl'\nIMPORT '../shared/validators.spl'",
    },
    create: {
        title: '🏗️ CREATE FUNCTION / CREATE PROCEDURE / CREATE TOOL_API',
        body: 'Defines a reusable SPL definition. Three forms:\n\n' +
              '• **`CREATE FUNCTION`** — LLM prompt template with `$$...$$` body; `{param}` slots filled at call time → probabilistic, calls `GENERATE` internally.\n\n' +
              '• **`CREATE PROCEDURE`** — multi-step SPL sub-workflow; called via `CALL`.\n\n' +
              '• **`CREATE TOOL_API`** — Python tool with `LANGUAGE PYTHON AS $$...$$` body; routed entirely to Python execution, never to the LLM → deterministic, reproducible. Closes the hybrid computation 2×2 matrix.',
        example:
            "-- Probabilistic: LLM handles this\n" +
            "CREATE FUNCTION summarize({text}) RETURNS TEXT AS\n$$\nSummarize in 3 bullet points:\n{text}\n$$\n\n" +
            "-- Deterministic: Python handles this\n" +
            "CREATE TOOL_API stock_price(ticker TEXT) RETURNS FLOAT\n" +
            "LANGUAGE PYTHON AS\n$$\nimport yfinance as yf\nreturn yf.Ticker(ticker).info['regularMarketPrice']\n$$",
    },
    tool_api: {
        title: '🔧 CREATE TOOL_API',
        body: 'Defines a deterministic Python tool that is routed **entirely away from the LLM**.\n\n' +
              'The body (delimited by `$$...$$`) is plain Python. SPL\'s executor calls it via the TOOL_API registry at runtime — exact, reproducible, no token cost.\n\n' +
              '**Regime principle:** Use `CREATE TOOL_API` for operations that have a single correct answer (fetch, parse, compute). Use `CREATE FUNCTION` for operations that require reasoning, judgment, or generation.\n\n' +
              '**CLI registry commands:**\n' +
              '• `spl3 tool-api list` — list all registered tools\n' +
              '• `spl3 tool-api promote <name>` — promote a tool to the shared registry\n' +
              '• `spl3 tool-api remove <name>` — remove from registry',
        example:
            "CREATE TOOL_API stock_price(ticker TEXT) RETURNS FLOAT\n" +
            "LANGUAGE PYTHON AS\n" +
            "$$\n" +
            "import yfinance as yf\n" +
            "return yf.Ticker(ticker).info['regularMarketPrice']\n" +
            "$$\n\n" +
            "-- Call it deterministically — never touches the LLM:\n" +
            "CALL stock_price('AAPL') INTO @price",
    },
    language: {
        title: '💻 LANGUAGE clause',
        body: 'Specifies the implementation language for a `CREATE TOOL_API` body.\n\n`LANGUAGE PYTHON` is the supported form in SPL 3.0. The body follows `AS $$...$$`.',
        example: "CREATE TOOL_API parse_csv(path TEXT) RETURNS LIST\nLANGUAGE PYTHON AS\n$$\nimport csv\nwith open(path) as f:\n    return list(csv.DictReader(f))\n$$",
    },
    // ── Control flow ──────────────────────────────────────────────────────────
    evaluate: {
        title: '🔀 EVALUATE ... WHEN ... THEN ... END',
        body: 'Pattern-matches a variable against one or more `WHEN` cases — SPL\'s equivalent of a switch/match statement.\n\nFalls through to `OTHERWISE` if no case matches.',
        example: 'EVALUATE @score\n  WHEN > 0.8 THEN @verdict := "PASS"\n  WHEN > 0.5 THEN @verdict := "REVIEW"\n  OTHERWISE   @verdict := "FAIL"\nEND',
    },
    when: {
        title: '🔀 WHEN clause',
        body: 'A case arm inside an `EVALUATE` block. Matches the subject variable against a condition.',
    },
    otherwise: {
        title: '🔀 OTHERWISE clause',
        body: 'The default arm of an `EVALUATE` block — executed when no `WHEN` case matches.',
    },
    while: {
        title: '🔁 WHILE ... DO ... END',
        body: 'Loops while a condition is true. Requires a path to exit (a `RETURN` or `COMMIT` reachable inside the loop) — `spl3 validate --semantic` flags infinite loops.',
        example: 'WHILE @score < 0.8 AND @tries < 5 DO\n  GENERATE ...\n  @tries := @tries + 1\nEND',
    },
    for: {
        title: '🔁 FOR @var IN @collection DO ... END',
        body: 'Iterates over each element of a list or collection.',
        example: 'FOR @item IN @results DO\n  GENERATE ...\nEND',
    },
    call: {
        title: '📞 CALL',
        body: 'Invokes a named workflow or stdlib function, capturing the result into a variable.\n\nFor sub-workflows: resolves through the workflow registry.',
        example: 'CALL generate_code(@spec) INTO @code\nCALL summarize(@text) INTO @summary',
    },
    parallel: {
        title: '⚡ CALL PARALLEL ... END',
        body: 'Dispatches multiple sub-workflows concurrently via `asyncio.gather`. Each branch is a `workflow_name(@args) INTO @var` call.',
        example: 'CALL PARALLEL\n  critique(@draft) INTO @critique,\n  score(@draft)    INTO @score\nEND',
    },
    return: {
        title: '↩️ RETURN',
        body: 'Exits the current workflow and returns a value. Use `WITH status=` to signal a specific commit channel.',
        example: 'RETURN @result\nRETURN @output WITH status="success"',
    },
    commit: {
        title: '✅ COMMIT',
        body: 'Commits the workflow result to an output channel (analogous to a transaction commit).\n\nThe status string is matched by the caller\'s `EXCEPTION` block.',
        example: 'COMMIT @result WITH status="done"\nCOMMIT @error  WITH status="failed"',
    },
    raise: {
        title: '⚠️ RAISE',
        body: 'Raises a named exception, transferring control to the nearest `EXCEPTION` handler.',
        example: 'RAISE HallucinationDetected\nRAISE QualityBelowThreshold',
    },
    retry: {
        title: '🔄 RETRY',
        body: 'Re-executes the current statement or block from the top. Used inside `EXCEPTION` handlers.',
    },
    exception: {
        title: '🛡️ EXCEPTION',
        body: 'Catches named exceptions raised within a block. Each `WHEN ExceptionType THEN` arm handles a specific error.',
        example: 'EXCEPTION\n  WHEN HallucinationDetected THEN RETRY\n  WHEN OTHERS               THEN RAISE RuntimeError\nEND',
    },
    batch: {
        title: '📦 BATCH',
        body: 'Processes a collection in parallel batches, applying a workflow to each element.',
    },
    // ── LLM invocation ────────────────────────────────────────────────────────
    generate: {
        title: '💡 GENERATE',
        body: 'Sends a prompt to the LLM and stores the output in a variable.\n\nSupports `USING MODEL`, `WITH BUDGET ... TOKENS`, and `FORMAT` clauses.',
        example: 'GENERATE "Summarize: {@text}" INTO @summary\nGENERATE @prompt INTO @result\n  USING MODEL "claude-sonnet-4-6"\n  WITH BUDGET 2048 TOKENS',
    },
    prompt: {
        title: '📝 PROMPT',
        body: 'Defines and sends an LLM prompt (SPL 2.0 style). In SPL 3.0 prefer `GENERATE` for clarity.',
    },
    // ── Parameters ────────────────────────────────────────────────────────────
    input: {
        title: '📥 INPUT',
        body: 'Declares the input parameters of a workflow. Each parameter has a name (`@var`), type, and optional `DEFAULT`.',
        example: 'INPUT:\n  @query  TEXT\n  @top_k  INT DEFAULT 5\n  @model  TEXT DEFAULT "claude-sonnet-4-6"',
    },
    output: {
        title: '📤 OUTPUT',
        body: 'Declares the output parameters of a workflow.',
        example: 'OUTPUT:\n  @result TEXT\n  @score  FLOAT',
    },
    // ── Clauses / modifiers ───────────────────────────────────────────────────
    using: {
        title: '🤖 USING MODEL',
        body: 'Overrides the default LLM model for a single `GENERATE` call.',
        example: 'GENERATE @prompt INTO @result\n  USING MODEL "claude-opus-4-6"',
    },
    model: {
        title: '🤖 MODEL',
        body: 'Specifies the LLM model. Used after `USING` or as a standalone configuration keyword.',
    },
    budget: {
        title: '🪙 BUDGET (tokens)',
        body: 'Sets the maximum token output limit for a `GENERATE` call.',
        example: 'GENERATE @prompt INTO @result WITH BUDGET 4096 TOKENS',
    },
    with: {
        title: '⚙️ WITH',
        body: 'Introduces clauses on `GENERATE` (BUDGET, FORMAT, CACHE, TEMPERATURE) or `RETURN`/`COMMIT` (status=).',
    },
    logging: {
        title: '📋 LOGGING LEVEL',
        body: 'Emits a log message at the specified severity level.',
        example: 'LOGGING LEVEL INFO "Starting pipeline for {@query}"',
    },
    // ── Data access ───────────────────────────────────────────────────────────
    rag: {
        title: '📚 RAG (Retrieval-Augmented Generation)',
        body: 'Queries a vector store for semantically relevant documents. Results are injected into the prompt context.',
        example: 'CALL rag.query(@question, top_k=5) INTO @context',
    },
    memory: {
        title: '🧠 MEMORY',
        body: 'Reads from or writes to the conversational memory store — persistent across workflow steps.',
        example: 'memory.set("last_query", @query)\n@prev := memory.get("last_query")',
    },
    context: {
        title: '🌐 CONTEXT',
        body: 'Accesses variables from the ambient execution context (environment, session, or parent workflow scope).',
    },
    store: {
        title: '💾 STORE RESULT IN',
        body: 'Persists a generated result to memory.',
        example: 'STORE RESULT IN memory.summary',
    },
};

function buildHover(entry: HoverEntry): vscode.Hover {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`### ${entry.title}\n\n${entry.body}`);
    if (entry.example) {
        md.appendMarkdown('\n\n**Example:**\n');
        md.appendCodeblock(entry.example, 'spl');
    }
    return new vscode.Hover(md);
}

// ─── Diagnostics / validate-on-save ──────────────────────────────────────────

const diagnosticCollection = vscode.languages.createDiagnosticCollection('spl');

// Match: "  ERROR  workflow_name  message text"
// or:    "  WARN   workflow_name  message text"
const ISSUE_RE = /^\s+(ERROR|WARN)\s+(\S+)\s+(.+)$/;

// Match: "SYNTAX ERROR in <file>: <msg>" or "SYNTAX ERROR: <msg>"
const SYNTAX_RE = /^SYNTAX ERROR(?:\s+in\s+\S+)?:\s*(.+)$/i;

// Match: "line N" inside a message
const LINE_RE = /\bline\s+(\d+)\b/i;

function parseDiagnostics(output: string, docUri: vscode.Uri): vscode.Diagnostic[] {
    const diags: vscode.Diagnostic[] = [];

    for (const raw of output.split('\n')) {
        const issue = ISSUE_RE.exec(raw);
        if (issue) {
            const [, level, , message] = issue;
            const lineMatch = LINE_RE.exec(message);
            const lineNum = lineMatch ? Math.max(0, parseInt(lineMatch[1]) - 1) : 0;
            const range = new vscode.Range(lineNum, 0, lineNum, Number.MAX_SAFE_INTEGER);
            const severity = level === 'ERROR'
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;
            diags.push(new vscode.Diagnostic(range, message.trim(), severity));
            continue;
        }
        const syntax = SYNTAX_RE.exec(raw);
        if (syntax) {
            const message = syntax[1];
            const lineMatch = LINE_RE.exec(message);
            const lineNum = lineMatch ? Math.max(0, parseInt(lineMatch[1]) - 1) : 0;
            const range = new vscode.Range(lineNum, 0, lineNum, Number.MAX_SAFE_INTEGER);
            diags.push(new vscode.Diagnostic(range, message.trim(), vscode.DiagnosticSeverity.Error));
        }
    }
    return diags;
}

function runValidate(document: vscode.TextDocument, semantic: boolean): void {
    const config = vscode.workspace.getConfiguration('spl-llm');
    const spl3 = config.get<string>('spl3Path', 'spl3');
    const semanticFlag = semantic ? '--semantic' : '--no-semantic';
    const args = ['validate', semanticFlag, document.fileName];

    cp.execFile(spl3, args, { timeout: 15000 }, (err, stdout, stderr) => {
        const output = stdout + stderr;

        // "OK" or "OK (with N warning(s))" → clear then re-parse for warnings
        if (/^OK/m.test(output)) {
            const diags = parseDiagnostics(output, document.uri);
            diagnosticCollection.set(document.uri, diags);
            return;
        }

        // spl3 not found
        if (err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
            vscode.window.showWarningMessage(
                `SPL-LLM: spl3 not found at "${spl3}". ` +
                `Set spl-llm.spl3Path in settings to the full path of the spl3 executable.`
            );
            return;
        }

        const diags = parseDiagnostics(output, document.uri);
        if (diags.length === 0 && output.trim()) {
            // Fallback: mark line 0 with the raw message
            diags.push(new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                output.trim().split('\n')[0],
                vscode.DiagnosticSeverity.Error,
            ));
        }
        diagnosticCollection.set(document.uri, diags);
    });
}

// ─── Token-color bootstrap ────────────────────────────────────────────────────
//
// VS Code does not propagate extension configurationDefaults for
// editor.tokenColorCustomizations into the active theme's tokenizer — that
// setting is only honored when the user explicitly sets it in settings.json.
// On first activation (or when our rules are missing) we inject the rules
// ourselves so SPL keywords are always colored regardless of active theme.
//
// Rules are keyed by scope name and merged into the existing textMateRules
// array.  We never remove or overwrite rules the user already has.

const SPL_TOKEN_RULES: Array<{ scope: string; settings: Record<string, string> }> = [
    { scope: 'keyword.declaration.spl',           settings: { foreground: '#E5C07B', fontStyle: 'bold' } },
    { scope: 'keyword.declaration.parameter.spl', settings: { foreground: '#56B6C2' } },
    { scope: 'keyword.control.flow.spl',          settings: { foreground: '#C678DD' } },
    { scope: 'keyword.control.query.spl',         settings: { foreground: '#C678DD' } },
    { scope: 'keyword.other.generate.spl',        settings: { foreground: '#61AFEF', fontStyle: 'bold' } },
    { scope: 'keyword.other.spl',                 settings: { foreground: '#98C379' } },
    { scope: 'variable.other.spl',                settings: { foreground: '#E06C75' } },
    { scope: 'support.type.exception.spl',        settings: { foreground: '#E06C75', fontStyle: 'italic' } },
    { scope: 'support.type.spl',                  settings: { foreground: '#56B6C2' } },
    { scope: 'support.function.builtin.spl',      settings: { foreground: '#61AFEF' } },
    { scope: 'support.function.tool.spl',         settings: { foreground: '#D19A66' } },
    { scope: 'entity.name.type.model.spl',        settings: { foreground: '#D19A66', fontStyle: 'italic' } },
    { scope: 'support.constant.log-level.spl',    settings: { foreground: '#98C379' } },
    { scope: 'support.constant.language.spl',     settings: { foreground: '#D19A66' } },
    { scope: 'string.unquoted.heredoc.spl',       settings: { foreground: '#98C379' } },
    { scope: 'punctuation.definition.heredoc.spl',settings: { foreground: '#ABB2BF', fontStyle: 'bold' } },
];

async function ensureSplTokenColors(): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    const existing = config.get<Record<string, unknown>>('editor.tokenColorCustomizations', {});
    const existingRules: Array<Record<string, unknown>> =
        Array.isArray(existing['textMateRules']) ? existing['textMateRules'] as Array<Record<string, unknown>> : [];

    // Collect scopes already present so we don't overwrite user customisations
    const existingScopes = new Set(existingRules.map(r => r['scope'] as string));
    const missing = SPL_TOKEN_RULES.filter(r => !existingScopes.has(r.scope));

    if (missing.length === 0) {
        return; // nothing to do
    }

    const merged = { ...existing, textMateRules: [...existingRules, ...missing] };
    await config.update('editor.tokenColorCustomizations', merged, vscode.ConfigurationTarget.Global);
}

// ─── Activation ───────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {

    // Inject SPL token colors into the user's settings.json if not already present.
    // (configurationDefaults is silently ignored by VS Code for this setting.)
    ensureSplTokenColors().catch(err =>
        console.error('[SPL-LLM] Failed to set token colors:', err)
    );

    // Hover provider
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('spl', {
            provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) { return null; }
                const word = document.getText(range).toLowerCase();
                const entry = HOVER_DOCS[word];
                return entry ? buildHover(entry) : null;
            }
        })
    );

    // Validate on save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            if (document.languageId !== 'spl') { return; }
            const config = vscode.workspace.getConfiguration('spl-llm');
            if (!config.get<boolean>('validateOnSave', true)) { return; }
            const semantic = config.get<boolean>('semanticValidation', true);
            runValidate(document, semantic);
        })
    );

    // Clear diagnostics when file is closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(document => {
            diagnosticCollection.delete(document.uri);
        })
    );

    // Command: SPL: Validate Current File
    context.subscriptions.push(
        vscode.commands.registerCommand('spl-llm.validate', () => {
            const doc = vscode.window.activeTextEditor?.document;
            if (!doc || doc.languageId !== 'spl') {
                vscode.window.showWarningMessage('SPL-LLM: Open an .spl file first.');
                return;
            }
            runValidate(doc, false);
        })
    );

    // Command: SPL: Validate Current File (with semantic checks)
    context.subscriptions.push(
        vscode.commands.registerCommand('spl-llm.validateSemantic', () => {
            const doc = vscode.window.activeTextEditor?.document;
            if (!doc || doc.languageId !== 'spl') {
                vscode.window.showWarningMessage('SPL-LLM: Open an .spl file first.');
                return;
            }
            runValidate(doc, true);
        })
    );

    context.subscriptions.push(diagnosticCollection);
}

export function deactivate(): void {
    diagnosticCollection.clear();
}
