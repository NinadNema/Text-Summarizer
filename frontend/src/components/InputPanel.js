import React from "react";

function InputPanel({ text, setText, onSummarize, disabled, onToast }) {
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (onSummarize && !disabled && text.trim()) {
                onSummarize();
            }
        }
    };

    const handlePaste = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText) {
                setText(clipboardText);
                if (onToast) onToast("Pasted from clipboard!");
            }
        } catch (err) {
            if (onToast) onToast("Please allow clipboard access or use Ctrl+V", "error");
        }
    };

    const handleClear = () => {
        setText("");
    };

    return (
        <div className="input-panel-container">
            {/* TOOLBAR */}
            <div className="input-toolbar">
                <div className="input-toolbar-left">
                    <button
                        type="button"
                        className="input-tool-btn"
                        onClick={handlePaste}
                        title="Paste from clipboard"
                    >
                        📋 Paste
                    </button>
                    {text && (
                        <button
                            type="button"
                            className="input-tool-btn input-tool-clear"
                            onClick={handleClear}
                            title="Clear input"
                        >
                            🗑️ Clear
                        </button>
                    )}
                </div>
                <div className="input-toolbar-right">
                    <span className="input-shortcut-pill" title="Press Ctrl + Enter to summarize instantly">
                        <kbd>Ctrl</kbd> + <kbd>↵ Enter</kbd> to summarize
                    </span>
                </div>
            </div>

            {/* TEXTAREA */}
            <textarea
                className="input-textarea"
                placeholder="Paste or type your text here... (Supports any language and article length)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                rows={9}
            />

            {/* FOOTER STATS */}
            <div className="input-footer">
                <div className="input-stats">
                    <span className="stat-badge">{wordCount} words</span>
                    <span className="stat-badge">{charCount} chars</span>
                </div>
                <div className="input-hint">
                    {text.trim() ? "⚡ Ready to summarize" : "Enter or paste text above"}
                </div>
            </div>
        </div>
    );
}

export default InputPanel;
