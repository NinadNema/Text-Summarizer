import React from "react";

const SAMPLE_TEXT = `Artificial Intelligence (AI) is transforming industries across the globe at an unprecedented pace. From healthcare diagnostics and autonomous transportation to financial modeling and creative arts, machine learning algorithms are discovering patterns in complex datasets that were previously impossible for human analysts to detect.

Modern deep learning architectures, particularly transformer models, have revolutionized natural language processing. These models use self-attention mechanisms to understand contextual relationships between words across long documents, enabling human-like summarization, translation, code generation, and conversational reasoning.

However, widespread deployment of AI also introduces significant ethical and technical challenges. Concerns surrounding algorithmic bias, data privacy, computational energy consumption, and intellectual property rights require robust regulatory frameworks and transparent model governance. As researchers continue to push the frontiers toward more efficient and aligned systems, the collaboration between human expertise and automated intelligence promises to unlock breakthroughs in science, education, and global problem-solving.`;

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

    const handleSample = () => {
        setText(SAMPLE_TEXT);
        if (onToast) onToast("Sample text loaded!");
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
                        onClick={handleSample}
                        title="Load sample article"
                    >
                        ⚡ Sample Text
                    </button>
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
                    {text.trim() ? "⚡ Ready to summarize" : "Enter text above or click '⚡ Sample Text'"}
                </div>
            </div>
        </div>
    );
}

export default InputPanel;