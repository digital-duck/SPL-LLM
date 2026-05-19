# SPL-LLM

VS Code extension for **SPL (Structured Prompt Language)** — a declarative language for
designing, running, and evaluating LLM workflows.

> SPL is to LLM workflows what SQL is to databases: structured, human-readable, and
> runtime-agnostic. The same `.spl` file runs on any supported adapter (Claude, OpenAI,
> Ollama, OpenRouter, …) without changes — DODA: Design Once, Deploy Anywhere.

---

## What's inside

```
SPL-LLM/
├── spl-llm/              # VS Code extension source
│   ├── src/extension.ts  # Hover docs + validate-on-save
│   ├── syntaxes/         # TextMate grammar (tmLanguage.json) + Markdown injection
│   ├── language-configuration.json
│   ├── package.json
│   └── spl-llm-0.0.4.vsix   # Latest packaged extension
└── tmLanguage.json       # Standalone grammar (for other editors)
```

## Quick install

```bash
code --install-extension spl-llm/spl-llm-0.0.4.vsix
```

Reload VS Code (`Ctrl+Shift+P` → **Developer: Reload Window**).

## Features at a glance

| Feature | Details |
|---------|---------|
| Syntax highlighting | Keywords, `@variables`, `$$...$$` prompt bodies, f-strings, comments, built-in functions |
| Hover docs | All SPL 3.0 keywords — description + usage example |
| Validate on save | Runs `spl3 validate` on every `.spl` save; shows inline squiggles |
| Semantic checks | Undefined variable reads, unreachable code, `WHILE` loops with no exit |
| Markdown support | ` ```spl ` code blocks highlighted in `.md` files |

See [`spl-llm/README.md`](spl-llm/README.md) for full documentation, settings, and release notes.

---

## Build from source

### Prerequisites

- Node.js v18+ and npm
- `vsce` packaging tool:

```bash
npm install -g @vscode/vsce
# or, without global install:
npx @vscode/vsce package
```

> On Ubuntu without sudo, configure a user-local npm prefix:
> ```bash
> mkdir -p ~/.npm-global
> npm config set prefix '~/.npm-global'
> echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
> source ~/.bashrc
> npm install -g @vscode/vsce
> ```

### Build and install

```bash
cd spl-llm
npm install          # install dev dependencies
npm run compile      # type-check, lint, and bundle via esbuild
vsce package         # produces spl-llm-<version>.vsix
code --install-extension spl-llm-0.0.4.vsix
```

### One-liner (after vsce is installed)

```bash
cd spl-llm && npm install && vsce package && code --install-extension spl-llm-0.0.4.vsix
```

---

## Related projects

- **[SPL.py](https://github.com/digital-duck/SPL.py)** — SPL 3.0 runtime, compiler, and CLI (`spl3`)
- **VibeSCOPE** — SPL Studio web app (Streamlit + FastAPI) for designing, running, and evaluating SPL workflows
