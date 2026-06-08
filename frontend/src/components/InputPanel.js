function InputPanel({ text, setText }) {
    return (
        <div>
            <textarea
                placeholder="Paste or type your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ minHeight: "200px" }}
            />
            <div style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "6px"
            }}>
                <span style={{
                    fontSize: "11px",
                    color: "var(--text-3)",
                    fontFamily: "var(--font-mono)"
                }}>
                    {text.trim() ? text.trim().split(/\s+/).length : 0} words
                </span>
            </div>
        </div>
    );
}

export default InputPanel;