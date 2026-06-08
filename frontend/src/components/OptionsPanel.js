function OptionsPanel({ length, setLength, mode, setMode }) {
    const lengths = [
        { value: "short",  label: "Short"    },
        { value: "medium", label: "Medium"   },
        { value: "long",   label: "Long"     },
    ];

    const modes = [
        { value: "normal",   label: "Normal"   },
        { value: "academic", label: "Academic" },
        { value: "simple",   label: "Simple"   },
        { value: "research", label: "Research" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* LENGTH */}
            <div>
                <div style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "8px"
                }}>
                    Summary Length
                </div>
                <div className="pill-group">
                    {lengths.map((l) => (
                        <button
                            key={l.value}
                            className={`pill ${length === l.value ? "active" : ""}`}
                            onClick={() => setLength(l.value)}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MODE */}
            <div>
                <div style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "8px"
                }}>
                    Summary Mode
                </div>
                <div className="pill-group">
                    {modes.map((m) => (
                        <button
                            key={m.value}
                            className={`pill ${mode === m.value ? "active" : ""}`}
                            onClick={() => setMode(m.value)}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default OptionsPanel;