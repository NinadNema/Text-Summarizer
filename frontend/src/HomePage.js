import { useState, useEffect } from "react";
import "./HomePage.css";

function HomePage({ onEnterApp, onGoToApp, darkMode, setDarkMode, loggedInUser }) {
    const [showScroll, setShowScroll] = useState(false);

    // Show scroll-to-top button when user scrolls down
    useEffect(() => {
        const onScroll = () => setShowScroll(window.scrollY > 400);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const features = [
        {
            icon: "⚡",
            title: "Lightning Fast",
            desc: "Powered by Facebook's BART model — generates accurate summaries in seconds, not minutes."
        },
        {
            icon: "📄",
            title: "Multiple Formats",
            desc: "Upload PDF, DOCX, or TXT files, or paste text directly. Any format, any length."
        },
        {
            icon: "🔑",
            title: "Keyword Extraction",
            desc: "Automatically identifies the most important keywords and highlights them in your summary."
        },
        {
            icon: "🎯",
            title: "4 Summary Modes",
            desc: "Normal, Academic, Simple, or Research — tailored output for every use case."
        },
        {
            icon: "📊",
            title: "Smart Analytics",
            desc: "Reading time estimates, compression ratio, and key statistics for every summary."
        },
        {
            icon: "🕐",
            title: "Summary History",
            desc: "Every summary is saved. Search, favorite, and revisit your past summaries anytime."
        },
    ];

    const steps = [
        { num: "01", title: "Paste or Upload", desc: "Add your text directly or upload a PDF, DOCX, or TXT file." },
        { num: "02", title: "Choose Options",  desc: "Select your preferred length and summary mode." },
        { num: "03", title: "Generate",        desc: "Click Generate and get your summary in seconds." },
        { num: "04", title: "Explore Results", desc: "View summary, key points, keywords, and important sentences." },
    ];

    return (
        <div className="hp-root">

            {/* ── NAVBAR ─────────────────────────────── */}
            <nav className="hp-nav">
                <div className="hp-nav-logo">
                    <div className="hp-nav-logo-icon">✦</div>
                    <span className="hp-nav-logo-name">Summar<span>AI</span></span>
                </div>
                <div className="hp-nav-right">
                    <button className="hp-theme-btn" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? "☀️ Light" : "🌙 Dark"}
                    </button>
                    {loggedInUser ? (
                        <button className="hp-user-btn" onClick={onGoToApp}>
                            <div className="hp-user-avatar">
                                {loggedInUser.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="hp-user-name">{loggedInUser}</span>
                            <span className="hp-user-arrow">→</span>
                        </button>
                    ) : (
                        <button className="hp-nav-btn" onClick={onEnterApp}>
                            👤 Login / Sign Up
                        </button>
                    )}
                </div>
            </nav>

            {/* ── HERO ────────────────────────────────── */}
            <section className="hp-hero">
                <div className="hp-hero-blob hp-hero-blob1"></div>
                <div className="hp-hero-blob hp-hero-blob2"></div>
                <div className="hp-hero-blob hp-hero-blob3"></div>

                <div className="hp-hero-content">
                    <div className="hp-hero-badge">✦ AI-Powered Text Summarizer</div>
                    <h1 className="hp-hero-title">
                        Summarize anything<br />
                        <span className="hp-hero-title-accent">in seconds</span>
                    </h1>
                    <p className="hp-hero-sub">
                        Paste any text or upload a document — SummarAI instantly extracts the key ideas,
                        keywords, and important sentences so you can focus on what matters.
                    </p>
                    <div className="hp-hero-actions">
                        <button className="hp-btn-primary" onClick={onEnterApp}>
                            ⚡ Get Started — It's Free
                        </button>
                        <a href="#features" className="hp-btn-ghost">See Features ↓</a>
                    </div>

                    {/* STATS ROW */}
                    <div className="hp-hero-stats">
                        <div className="hp-hero-stat">
                            <div className="hp-hero-stat-num">4</div>
                            <div className="hp-hero-stat-label">Summary Modes</div>
                        </div>
                        <div className="hp-hero-stat-divider"></div>
                        <div className="hp-hero-stat">
                            <div className="hp-hero-stat-num">3</div>
                            <div className="hp-hero-stat-label">File Formats</div>
                        </div>
                        <div className="hp-hero-stat-divider"></div>
                        <div className="hp-hero-stat">
                            <div className="hp-hero-stat-num">88%</div>
                            <div className="hp-hero-stat-label">Avg Compression</div>
                        </div>
                        <div className="hp-hero-stat-divider"></div>
                        <div className="hp-hero-stat">
                            <div className="hp-hero-stat-num">∞</div>
                            <div className="hp-hero-stat-label">Summaries Saved</div>
                        </div>
                    </div>
                </div>

                {/* HERO PREVIEW CARD */}
                <div className="hp-hero-card">
                    <div className="hp-hero-card-bar">
                        <div className="hp-card-dot" style={{background:"#ef4444"}}></div>
                        <div className="hp-card-dot" style={{background:"#f59e0b"}}></div>
                        <div className="hp-card-dot" style={{background:"#10b981"}}></div>
                        <span style={{fontSize:"11px", color:"rgba(255,255,255,0.3)", marginLeft:"8px"}}>SummarAI</span>
                    </div>
                    <div className="hp-card-input-label">Input Text</div>
                    <div className="hp-card-input-mock">
                        Education is one of the most powerful tools that shapes individuals,
                        communities, and nations. It plays a vital role in the development of
                        human civilization by spreading knowledge...
                    </div>
                    <div className="hp-card-arrow">↓</div>
                    <div className="hp-card-output-label">
                        <span className="hp-card-check">✓</span> Summary
                    </div>
                    <div className="hp-card-output-mock">
                        Education shapes individuals and nations by spreading knowledge and
                        encouraging innovation. A well-educated population contributes to
                        growth and stability.
                    </div>
                    <div className="hp-card-stats-row">
                        <div className="hp-card-stat">
                            <span className="hp-card-stat-num">1204</span>
                            <span className="hp-card-stat-label">words</span>
                        </div>
                        <div className="hp-card-stat-arrow">→</div>
                        <div className="hp-card-stat">
                            <span className="hp-card-stat-num" style={{color:"#10b981"}}>147</span>
                            <span className="hp-card-stat-label">words</span>
                        </div>
                        <div className="hp-card-stat-badge">88% reduced</div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ────────────────────────────── */}
            <section className="hp-section" id="features">
                <div className="hp-section-inner">
                    <div className="hp-section-badge">Features</div>
                    <h2 className="hp-section-title">Everything you need to summarize smarter</h2>
                    <p className="hp-section-sub">
                        Built with powerful AI and a clean interface to make summarization effortless.
                    </p>
                    <div className="hp-features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="hp-feature-card">
                                <div className="hp-feature-icon">{f.icon}</div>
                                <div className="hp-feature-title">{f.title}</div>
                                <div className="hp-feature-desc">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────── */}
            <section className="hp-section hp-section-alt" id="how">
                <div className="hp-section-inner">
                    <div className="hp-section-badge">How It Works</div>
                    <h2 className="hp-section-title">From text to summary in 4 steps</h2>
                    <div className="hp-steps">
                        {steps.map((s, i) => (
                            <div key={i} className="hp-step">
                                <div className="hp-step-num">{s.num}</div>
                                <div className="hp-step-body">
                                    <div className="hp-step-title">{s.title}</div>
                                    <div className="hp-step-desc">{s.desc}</div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="hp-step-arrow">→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MODES SECTION ───────────────────────── */}
            <section className="hp-section" id="modes">
                <div className="hp-section-inner">
                    <div className="hp-section-badge">Summary Modes</div>
                    <h2 className="hp-section-title">One tool, four different outputs</h2>
                    <div className="hp-modes-grid">
                        <div className="hp-mode-card hp-mode-normal">
                            <div className="hp-mode-icon">📝</div>
                            <div className="hp-mode-title">Normal</div>
                            <div className="hp-mode-desc">A balanced, general-purpose summary suitable for any type of content.</div>
                        </div>
                        <div className="hp-mode-card hp-mode-academic">
                            <div className="hp-mode-icon">🎓</div>
                            <div className="hp-mode-title">Academic</div>
                            <div className="hp-mode-desc">Formal language and structured output for essays, papers, and academic content.</div>
                        </div>
                        <div className="hp-mode-card hp-mode-simple">
                            <div className="hp-mode-icon">💬</div>
                            <div className="hp-mode-title">Simple</div>
                            <div className="hp-mode-desc">Plain English explanations — perfect for beginners or casual reading.</div>
                        </div>
                        <div className="hp-mode-card hp-mode-research">
                            <div className="hp-mode-icon">🔬</div>
                            <div className="hp-mode-title">Research</div>
                            <div className="hp-mode-desc">Extracts objectives, methodology, findings, and conclusions from research papers.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────── */}
            <section className="hp-cta">
                <div className="hp-cta-blob1"></div>
                <div className="hp-cta-blob2"></div>
                <div className="hp-cta-inner">
                    <h2 className="hp-cta-title">Ready to summarize smarter?</h2>
                    <p className="hp-cta-sub">
                        Join SummarAI and start turning long documents into clear, concise summaries.
                    </p>
                    <button className="hp-btn-primary hp-btn-large" onClick={onEnterApp}>
                        ⚡ Get Started — It's Free
                    </button>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────── */}
            <footer className="hp-footer">
                <div className="hp-footer-logo">
                    <div className="hp-nav-logo-icon" style={{width:"24px",height:"24px",fontSize:"12px"}}>✦</div>
                    <span style={{fontSize:"14px", fontWeight:"600"}}>SummarAI</span>
                </div>
            </footer>

            {/* ── SCROLL TO TOP BUTTON ────────────────── */}
            {showScroll && (
                <button className="hp-scroll-top" onClick={scrollToTop} title="Scroll to top">
                    ↑
                </button>
            )}

        </div>
    );
}

export default HomePage;