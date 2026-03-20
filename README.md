# SPL-LLM
VS Code Extension for SPL and SPL-flow development


## Setup

### Prerequisites

Node.js (v18+) and npm are required. Check your versions:

```bash
node --version
npm --version
```

### 1. Install vsce

`vsce` is the VS Code Extension packaging tool. Install it globally:

```bash
npm install -g @vscode/vsce
vsce --version   # verify
```

> On Ubuntu you may need to prefix with `sudo`, or configure npm to use a
> user-local prefix to avoid permission errors:
>
> ```bash
> mkdir -p ~/.npm-global
> npm config set prefix '~/.npm-global'
> echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
> source ~/.bashrc
> npm install -g @vscode/vsce
> ```

### 2. Install dependencies and compile

```bash
cd /path/to/SPL-LLM/spl-llm
npm install          # install dev dependencies
npm run compile      # type-check, lint, and bundle via esbuild
```

### 3. Package the extension

```bash
vsce package         # produces spl-llm-0.0.2.vsix in the current directory
```

### 4. Install into VS Code

```bash
code --install-extension spl-llm-0.0.2.vsix
```

Then reload VS Code (`Ctrl+Shift+P` → **Developer: Reload Window**).

### Quick one-liner (after vsce is installed)

```bash
cd spl-llm && npm install && vsce package && code --install-extension spl-llm-0.0.2.vsix
```