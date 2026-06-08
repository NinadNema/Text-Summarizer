import { useState } from "react";

// ── SKELETON BLOCK ────────────────────────────────────
function Skeleton({ width = "100%", height = "14px", style = {} }) {
    return (
        <div className="skeleton" style={{ width, height, ...style }} />
    );
}

// ── SKELETON LOADING STATE ────────────────────────────
function SkeletonPanel() {
    return (
        <div className="result-panel-wrap">
            <div className="stat-grid" style={{ marginBottom: "14px", marginTop: 0 }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="stat-card">
                        <Skeleton width="50%" height="22px" style={{ margin: "0 auto 6px" }} />
                        <Skeleton width="70%" height="10px" style={{ margin: "0 auto" }} />
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width="23%" height="32px" style={{ borderRadius: "6px" }} />
                ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "4px 0" }}>
                <Skeleton width="100%" height="14px" />
                <Skeleton width="95%"  height="14px" />
                <Skeleton width="98%"  height="14px" />
                <Skeleton width="88%"  height="14px" />
                <Skeleton width="93%"  height="14px" />
                <Skeleton width="80%"  height="14px" />
                <Skeleton width="96%"  height="14px" />
                <Skeleton width="72%"  height="14px" />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "16px" }}>
                <Skeleton width="50%" height="36px" style={{ borderRadius: "8px" }} />
                <Skeleton width="50%" height="36px" style={{ borderRadius: "8px" }} />
            </div>
        </div>
    );
}

// ── READING TIME ──────────────────────────────────────
function readingTime(wordCount) {
    if (!wordCount) return null;
    const mins = wordCount / 200;
    if (mins < 1) return "< 1 min read";
    return `~${Math.ceil(mins)} min read`;
}

// ── HIGHLIGHT TEXT ────────────────────────────────────
// Wraps all occurrences of `word` in the text with a highlight span
function HighlightedText({ text, keyword }) {
    if (!keyword) return <span>{text}</span>;

    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex   = new RegExp(`(${escaped})`, "gi");
    const parts   = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="kw-highlight">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}

// ── RESULT PANEL ──────────────────────────────────────
function ResultPanel({
    summary,
    bullets = [],
    keywords = [],
    importantSentences = [],
    originalWords = 0,
    summaryWords = 0,
    onDownload,
    onToast,
    loading
}) {
    const [activeTab, setActiveTab]       = useState("summary");
    const [activeKeyword, setActiveKeyword] = useState(null);

    const tabs = [
        { id: "summary",   label: "Summary",   icon: "✓" },
        { id: "keypoints", label: "Key Points", icon: "●" },
        { id: "keywords",  label: "Keywords",   icon: "◈" },
        { id: "important", label: "Important",  icon: "★" },
    ];

    // SMART COPY
    const handleCopy = () => {
        let content = "";
        let label   = "";
        if (activeTab === "summary")   { content = summary;                                                        label = "Summary"; }
        if (activeTab === "keypoints") { content = bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");            label = "Key Points"; }
        if (activeTab === "keywords")  { content = keywords.join(", ");                                            label = "Keywords"; }
        if (activeTab === "important") { content = importantSentences.map((s, i) => `${i + 1}. ${s}`).join("\n"); label = "Important Sentences"; }
        if (!content) return;
        navigator.clipboard.writeText(content);
        if (onToast) onToast(`${label} copied!`);
    };

    // Toggle keyword highlight — click same keyword again to deselect
    const handleKeywordClick = (word) => {
        setActiveKeyword(prev => prev === word ? null : word);
        // Switch to summary tab so user can see the highlights
        setActiveTab("summary");
    };

    if (loading) return <SkeletonPanel />;

    if (!summary) {
        return (
            <div className="result-panel-wrap">
                <div className="empty-state">
                    <div className="empty-state-icon">✦</div>
                    <div className="empty-state-text">Your summary will appear here</div>
                </div>
            </div>
        );
    }

    const reduction       = originalWords > 0 ? Math.round((1 - summaryWords / originalWords) * 100) : 0;
    const origReadTime    = readingTime(originalWords);
    const summaryReadTime = readingTime(summaryWords);

    return (
        <div className="result-panel-wrap">

            {/* STATS */}
            <div className="stat-grid" style={{ marginBottom: "14px", marginTop: 0 }}>
                <div className="stat-card">
                    <div className="stat-card-num">{originalWords}</div>
                    <div className="stat-card-label">Original Words</div>
                    {origReadTime && <div className="stat-card-reading">{origReadTime}</div>}
                </div>
                <div className="stat-card">
                    <div className="stat-card-num">{summaryWords}</div>
                    <div className="stat-card-label">Summary Words</div>
                    {summaryReadTime && <div className="stat-card-reading">{summaryReadTime}</div>}
                </div>
                <div className="stat-card">
                    <div className="stat-card-num">{reduction}%</div>
                    <div className="stat-card-label">Reduced</div>
                    <div className="compression-bar-wrap">
                        <div className="compression-bar-track">
                            <div className="compression-bar-fill" style={{ width: `${100 - reduction}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="result-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`result-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="result-tab-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="result-tab-content">

                {/* SUMMARY — shows highlights if keyword active */}
                {activeTab === "summary" && (
                    <div>
                        {activeKeyword && (
                            <div className="kw-highlight-banner">
                                <span>Highlighting: <strong>{activeKeyword}</strong></span>
                                <button
                                    className="kw-clear-btn"
                                    onClick={() => setActiveKeyword(null)}
                                >
                                    ✕ Clear
                                </button>
                            </div>
                        )}
                        <div className="result-text">
                            <HighlightedText text={summary} keyword={activeKeyword} />
                        </div>
                    </div>
                )}

                {/* KEY POINTS */}
                {activeTab === "keypoints" && (
                    bullets.length > 0 ? (
                        <>
                            <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "12px", fontFamily: "var(--font-mono)" }}>
                                {bullets.length} points
                            </div>
                            <ul className="bullet-list">
                                {bullets.map((bullet, i) => (
                                    <li key={i}>
                                        <div className="bullet-dot"></div>
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div className="empty-state" style={{ padding: "20px" }}>
                            <div className="empty-state-text">No key points available</div>
                        </div>
                    )
                )}

                {/* KEYWORDS — clickable to highlight */}
                {activeTab === "keywords" && (
                    keywords.length > 0 ? (
                        <>
                            <div style={{
                                fontSize: "11px",
                                color: "var(--text-3)",
                                marginBottom: "10px",
                                fontFamily: "var(--font-mono)"
                            }}>
                                {keywords.length} keywords — click any to highlight in summary
                            </div>
                            <div>
                                {keywords.map((word, i) => (
                                    <span
                                        key={i}
                                        className={`tag tag-green kw-tag ${activeKeyword === word ? "kw-tag-active" : ""}`}
                                        style={{ fontSize: "13px", padding: "6px 14px", margin: "4px", cursor: "pointer" }}
                                        onClick={() => handleKeywordClick(word)}
                                        title={`Click to highlight "${word}" in summary`}
                                    >
                                        {activeKeyword === word ? "✓ " : ""}{word}
                                    </span>
                                ))}
                            </div>
                            {activeKeyword && (
                                <div style={{ marginTop: "14px" }}>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ fontSize: "12px", padding: "6px 14px" }}
                                        onClick={() => {
                                            setActiveKeyword(null);
                                            setActiveTab("summary");
                                        }}
                                    >
                                        View Summary with highlights →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state" style={{ padding: "20px" }}>
                            <div className="empty-state-text">No keywords found</div>
                        </div>
                    )
                )}

                {/* IMPORTANT SENTENCES */}
                {activeTab === "important" && (
                    importantSentences.length > 0 ? (
                        importantSentences.map((s, i) => (
                            <div key={i} className="important-item">
                                <div className="important-num">{i + 1}</div>
                                <span>{s}</span>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" style={{ padding: "20px" }}>
                            <div className="empty-state-text">No important sentences found</div>
                        </div>
                    )
                )}

            </div>

            {/* COPY & DOWNLOAD */}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexShrink: 0 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopy}>
                    📋 Copy {
                        activeTab === "summary"   ? "Summary"    :
                        activeTab === "keypoints" ? "Key Points" :
                        activeTab === "keywords"  ? "Keywords"   :
                        "Important"
                    }
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onDownload}>
                    ⬇ Download PDF
                </button>
            </div>

        </div>
    );
}

export default ResultPanel;