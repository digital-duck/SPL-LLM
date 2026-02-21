// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "spl-llm" is now active!');

	const hoverProvider = vscode.languages.registerHoverProvider('spl', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range).toLowerCase(); // Convert to lowercase for case-insensitive matching

            // Logic for 'WITH BUDGET' or just 'BUDGET'
            switch (word) {
                case 'budget': { // Changed to lowercase
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 🪙 SPL Token Compliance\n\n");
                    markdown.appendMarkdown("Defines the maximum token limit for this query session.\n\n");
                    markdown.appendMarkdown("- **Department Limit:** 128k tokens\n");
                    markdown.appendMarkdown("- **Recommendation:** Use smaller budgets for iterative testing.");
                    return new vscode.Hover(markdown);
                }
                case 'prompt': { // Changed to lowercase
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 📝 PROMPT Statement\n\nThe primary statement to define and initiate an LLM interaction. It orchestrates context, input, and generation parameters.");
                    return new vscode.Hover(markdown);
                }
                case 'generate': { // Changed to lowercase
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 💡 GENERATE Clause\n\nInstructs the LLM to produce output based on the provided prompt and context. Can include options like output budget, temperature, and format.");
                    return new vscode.Hover(markdown);
                }
                case 'using': // 'USING MODEL' is handled by checking the next word, but 'USING' itself can trigger a hint
                case 'model': { // Changed to lowercase
                    // This will trigger for both USING and MODEL.
                    // For a more precise 'USING MODEL' phrase, a more complex regex matching could be used
                    // or checking the word adjacent to the current one. For simplicity, this is a good start.
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 🤖 USING MODEL Clause\n\nSpecifies the Large Language Model (LLM) to be used for the current `PROMPT` or `GENERATE` operation.");
                    return new vscode.Hover(markdown);
                }
                case 'limit': { // Changed to lowercase
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 📏 LIMIT Clause\n\nRestricts the number of items returned (e.g., from a SELECT statement) or the token budget for specific operations.");
                    return new vscode.Hover(markdown);
                }
                case 'rag': { // Already lowercase, no change
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 📚 RAG Function (Retrieval Augmented Generation)\n\nPerforms a Retrieval Augmented Generation query to fetch relevant information from external knowledge bases.");
                    return new vscode.Hover(markdown);
                }
                case 'memory': { // Already lowercase, no change
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 🧠 MEMORY Function\n\nAccesses or stores information in the conversational memory for stateful interactions.");
                    return new vscode.Hover(markdown);
                }
                case 'context': { // Already lowercase, no change
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 🌐 CONTEXT Reference\n\nRefers to variables or data available in the current execution context, often populated from external sources.");
                    return new vscode.Hover(markdown);
                }
                case 'system_role': { // Already lowercase, no change
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown("### 👤 SYSTEM_ROLE Function\n\nDefines the persona, instructions, or constraints for the LLM at a system level.");
                    return new vscode.Hover(markdown);
                }
                default:
                    return null; // No hover if the word doesn't match
            }
        }
    });

	context.subscriptions.push(hoverProvider);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('spl-llm.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from SPL-LLM!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
