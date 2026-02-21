# SPL-LLM VS Code Extension

This VS Code extension provides language support for **SPL (Structured Prompt Language)**, a declarative language designed for managing and interacting with Large Language Models (LLMs). SPL is syntactically modeled after SQL, offering a structured approach to prompt engineering, context management, and LLM orchestration.

## Features

*   **Syntax Highlighting:** Provides rich syntax highlighting for SPL files (`.spl`), making code more readable and easier to understand. Keywords, built-in functions, strings, and comments are color-coded for clarity.
*   **SQL-like Structure:** SPL uses familiar SQL-like constructs such as `SELECT`, `FROM`, `WHERE`, `WITH`, `AS`, and `LIMIT` to define prompt logic and data flow.
*   **LLM-Specific Keywords:** Includes specialized keywords like `PROMPT` (to define prompt templates), `GENERATE` (to trigger LLM inference), `WITH BUDGET` (for token management), and `USING MODEL` (to specify LLMs).
*   **Built-in Functions:** Supports functions for common LLM interaction patterns, suchs as `rag()` (for Retrieval Augmented Generation), `memory()` (for conversational memory), `context()` (for accessing contextual data), and `system_role()` (for defining system-level instructions).
*   **Comment Support:** Supports standard SQL-style single-line (`--`) and multi-line (`/* ... */`) comments.

## Language Overview (SPL)

SPL aims to bring structure and observability to prompt engineering. Key elements include:

*   **`PROMPT` Statements:** Define the core interaction with an LLM, often including clauses for budget, model selection, and caching.
*   **Common Table Expressions (CTEs):** Use `WITH ... AS` to create reusable sub-queries for complex prompt constructions.
*   **Data Retrieval:** `SELECT` statements are used to gather data from various sources (e.g., `context.variable`, `rag.query()`, `memory.get()`) to build the LLM's input.
*   **Output Generation:** The `GENERATE` clause specifies how the LLM should produce its output, with options for output budget, temperature, and format.
*   **Result Storage:** `STORE RESULT IN memory.identifier` allows for persisting LLM outputs for future use.
*   **Functionality:** Supports `CREATE FUNCTION` for user-defined logic, and `EXPLAIN PROMPT` / `EXECUTE PROMPT` for analysis and execution.

## Installation

This extension can be installed from the VS Code Marketplace.

## Usage

Simply open any file with the `.spl` extension, and the SPL-LLM extension will automatically provide syntax highlighting.

## Requirements

*   Visual Studio Code version ^1.109.0 or higher.

## Development

For developers interested in contributing or extending this extension:

1.  **Clone the Repository:**
    ```bash
    git clone [repository-url]
    cd spl-llm
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Compile and Run in Development Host:**
    *   Open the project in VS Code.
    *   Press `F5` to compile the extension and launch a new Extension Development Host window with the extension loaded.

## Known Issues

*   (Currently none)

## Release Notes

### 0.0.1

*   Initial release with basic SPL syntax highlighting.

---

**Enjoy a structured approach to LLM prompting with SPL!**
