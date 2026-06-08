import { useState, useEffect } from "react";
import API from "./api";
import jsPDF from "jspdf";
import InputPanel from "./components/InputPanel";
import OptionsPanel from "./components/OptionsPanel";
import ResultPanel from "./components/ResultPanel";
import HomePage from "./HomePage";
import "./App.css";

// ── TOAST ─────────────────────────────────────────────
function Toast({ message, type }) {
    if (!message) return null;
    return (
        <div style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: type === "error" ? "var(--danger)" : "var(--accent)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "500",
            fontFamily: "var(--font)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            zIndex: 9999,
            whiteSpace: "nowrap",
            animation: "fadeInUp 0.2s ease",
            pointerEvents: "none"
        }}>
            {type === "error" ? "✕  " : "✓  "}{message}
        </div>
    );
}

// ── SIDEBAR NAV BUTTON ────────────────────────────────
function SidebarBtn({ icon, label, active, onClick, expanded }) {
    return (
        <button
            className={`sidebar-btn ${active ? "active" : ""}`}
            onClick={onClick}
            title={label}
        >
            <span style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</span>
            <span className="sidebar-label">{label}</span>
            {!expanded && <span className="tooltip">{label}</span>}
        </button>
    );
}

// ── MAIN APP ──────────────────────────────────────────
function App() {
    const [activePage, setActivePage]                 = useState("summarize");
    const [showHome, setShowHome]                     = useState(true);
    const [showLoginModal, setShowLoginModal]         = useState(false);
    const [sidebarExpanded, setSidebarExpanded]       = useState(false);
    const [dragOver, setDragOver]                     = useState(false);
    const [text, setText]                             = useState("");
    const [length, setLength]                         = useState("medium");
    const [mode, setMode]                             = useState("normal");
    const [summary, setSummary]                       = useState("");
    const [bullets, setBullets]                       = useState([]);
    const [keywords, setKeywords]                     = useState([]);
    const [importantSentences, setImportantSentences] = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [originalWords, setOriginalWords]           = useState(0);
    const [summaryWords, setSummaryWords]             = useState(0);
    const [file, setFile]                             = useState(null);
    const [history, setHistory]                       = useState([]);
    const [searchTerm, setSearchTerm]                 = useState("");
    const [username, setUsername]                     = useState("");
    const [password, setPassword]                     = useState("");
    const [authTab, setAuthTab]                       = useState("login");
    const [token, setToken]                           = useState("");
    const [loggedInUser, setLoggedInUser]             = useState("");
    const [darkMode, setDarkMode]                     = useState(
        () => localStorage.getItem("darkMode") === "true"
    );
    const [showPassword, setShowPassword]             = useState(false);

    // ── TOAST ─────────────────────────────────────────
    const [toast, setToast] = useState({ message: "", type: "success" });
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: "", type: "success" }), 3000);
    };

    // ── THEME ─────────────────────────────────────────
    useEffect(() => {
        document.body.className = darkMode ? "dark" : "light";
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    // ── BROWSER BACK BUTTON → HOME ────────────────────
    // When showHome becomes false (user enters app), push a new history state
    // When user presses browser back, popstate fires and we go back to home
    useEffect(() => {
        if (!showHome) {
            window.history.pushState({ page: "app" }, "");
        }
    }, [showHome]);

    useEffect(() => {
        const handlePopState = () => {
            setShowHome(true);
            setShowLoginModal(false);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // ── FETCH HISTORY ─────────────────────────────────
    const fetchHistory = async (tkn = token) => {
        try {
            const res = await API.get("/history", {
                headers: { Authorization: `Bearer ${tkn}` }
            });
            setHistory(res.data.history || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (token) fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ── DELETE HISTORY ────────────────────────────────
    const deleteHistory = async (id) => {
        try {
            await API.delete(`/history/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchHistory();
            showToast("History item deleted");
        } catch (e) { showToast("Failed to delete", "error"); }
    };

    // ── TOGGLE FAVORITE ───────────────────────────────
    const toggleFavorite = async (id) => {
        try {
            await API.put(`/favorite/${id}`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchHistory();
        } catch (e) { console.error(e); }
    };

    // ── REGISTER ──────────────────────────────────────
    const handleRegister = async () => {
        if (!username.trim() || !password.trim()) {
            showToast("Please enter username and password", "error"); return;
        }
        try {
            const res = await API.post("/register", { username, password });
            if (res.data.error) { showToast(res.data.error, "error"); return; }
            showToast("Registered! Please login.");
            setAuthTab("login");
            setPassword("");
        } catch (e) { showToast("Registration failed", "error"); }
    };

    // ── LOGIN ─────────────────────────────────────────
    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            showToast("Please enter username and password", "error"); return;
        }
        try {
            const res = await API.post("/login", { username, password }, {
                timeout: 10000
            });
            if (res.data.error) { showToast(res.data.error, "error"); return; }
            const accessToken = res.data.access_token;
            localStorage.setItem("token", accessToken);
            localStorage.setItem("username", res.data.username);
            setToken(accessToken);
            setLoggedInUser(res.data.username);
            fetchHistory(accessToken);
            setShowHome(false);
            setShowLoginModal(false);
        } catch (e) {
            if (e.code === "ECONNABORTED") {
                showToast("Login timed out — try again", "error");
            } else {
                showToast("Login failed", "error");
            }
        }
    };

    // ── LOGOUT ────────────────────────────────────────
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setToken(""); setLoggedInUser("");
        setHistory([]); setText(""); setSummary("");
        setBullets([]); setKeywords([]);
        setImportantSentences([]);
        setOriginalWords(0); setSummaryWords(0);
        setFile(null);
        setShowHome(true);
        setShowLoginModal(false);
    };

    // ── CLEAR ALL (New Summary) ───────────────────────
    const clearAll = () => {
        setText(""); setSummary("");
        setBullets([]); setKeywords([]);
        setImportantSentences([]);
        setOriginalWords(0); setSummaryWords(0);
        setLength("medium"); setMode("normal");
        setActivePage("summarize");
    };

    // ── SUMMARIZE ─────────────────────────────────────
    const handleSummarize = async () => {
        if (!text.trim()) {
            showToast("Please enter text", "error"); return;
        }
        try {
            setLoading(true);
            setSummary(""); setBullets([]); setKeywords([]);
            setImportantSentences([]); setOriginalWords(0); setSummaryWords(0);

            const res = await API.post(
                "/summarize",
                { text, length, mode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.error) { showToast(res.data.error, "error"); return; }
            setSummary(res.data.summary);
            setBullets(res.data.bullets || []);
            setKeywords(res.data.keywords || []);
            setImportantSentences(res.data.important_sentences || []);
            setOriginalWords(res.data.original_words);
            setSummaryWords(res.data.summary_words);
            fetchHistory();
        } catch (e) {
            showToast(e.response?.data?.error || "Error generating summary", "error");
        } finally { setLoading(false); }
    };

    // ── FILE UPLOAD ───────────────────────────────────
    const handleFileUpload = async () => {
        if (!file) { showToast("Please select a file", "error"); return; }
        const formData = new FormData();
        formData.append("file", file);
        try {
            setLoading(true);
            setSummary(""); setBullets([]); setKeywords([]);
            setImportantSentences([]); setOriginalWords(0); setSummaryWords(0);

            const res = await API.post(
                `/upload?length=${length}&mode=${mode}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (res.data.error) { showToast(res.data.error, "error"); return; }
            setSummary(res.data.summary);
            setBullets(res.data.bullets || []);
            setKeywords(res.data.keywords || []);
            setImportantSentences(res.data.important_sentences || []);
            setOriginalWords(res.data.original_words);
            setSummaryWords(res.data.summary_words);
            fetchHistory();
            setActivePage("summarize");
            showToast("File summarized successfully!");
        } catch (e) {
            showToast(e.response?.data?.error || "File upload failed", "error");
        } finally { setLoading(false); }
    };

    // ── VIEW HISTORY ITEM ─────────────────────────────
    const viewHistoryItem = (item) => {
        setSummary(""); setBullets([]); setKeywords([]);
        setImportantSentences([]); setOriginalWords(0); setSummaryWords(0);
        setText(item.original_text);
        setLength(item.length);
        setMode(item.mode);
        setSummary(item.summary);
        setBullets(item.bullets || []);
        setKeywords(item.keywords || []);
        setImportantSentences(item.important_sentences || []);
        setOriginalWords(
            item.original_text ? item.original_text.trim().split(/\s+/).length : 0
        );
        setSummaryWords(
            item.summary ? item.summary.trim().split(/\s+/).length : 0
        );
        setActivePage("summarize");
    };

    // ── PDF EXPORT ────────────────────────────────────
    const downloadPDF = () => {
        const doc = new jsPDF();
        let y = 15;
        doc.setFontSize(14); doc.text("Summary", 10, y); y += 8;
        doc.setFontSize(12);
        const ss = doc.splitTextToSize(summary, 180);
        doc.text(ss, 10, y); y += ss.length * 7 + 10;

        if (bullets.length > 0) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(14); doc.text("Key Points", 10, y); y += 8;
            doc.setFontSize(12);
            bullets.forEach((b) => {
                if (y > 270) { doc.addPage(); y = 20; }
                const sp = doc.splitTextToSize(`• ${b}`, 170);
                doc.text(sp, 15, y); y += sp.length * 7;
            });
            y += 10;
        }
        if (keywords.length > 0) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(14); doc.text("Keywords", 10, y); y += 8;
            doc.setFontSize(12);
            if (y > 270) { doc.addPage(); y = 20; }
            const sk = doc.splitTextToSize(keywords.join(", "), 170);
            doc.text(sk, 15, y);
        }
        doc.save("summary.pdf");
        showToast("PDF downloaded!");
    };

    const initials = loggedInUser ? loggedInUser.slice(0, 2).toUpperCase() : "?";
    const getShortLabel = (item) => {
        const words = (item.original_text || item.summary || "Untitled").trim().split(/\s+/);
        return words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");
    };
    const recentSummaries = history.slice(0, 5);

    // ── AUTH PAGE (SPLIT SCREEN) ───────────────────────
    // ── SHOW HOMEPAGE ─────────────────────────────────
    if (showHome) {
        return (
            <>
                <HomePage
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    loggedInUser={loggedInUser}
                    onEnterApp={() => {
                        if (token) {
                            // already logged in — skip modal, go straight to app
                            setShowHome(false);
                        } else {
                            // not logged in — show modal ON TOP of homepage
                            setShowLoginModal(true);
                        }
                    }}
                    onGoToApp={() => setShowHome(false)}
                />
                {/* LOGIN MODAL POPUP */}
                {showLoginModal && (
                    <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
                        <div className="modal-split" onClick={(e) => e.stopPropagation()}>

                            {/* LEFT — Visual panel */}
                            <div className="modal-left">
                                <div className="modal-left-blob1"></div>
                                <div className="modal-left-blob2"></div>
                                <div className="modal-left-content">
                                    <div className="modal-brand-icon">✦</div>
                                    <div className="modal-brand-name">Summar<span>AI</span></div>
                                    <div className="modal-brand-tagline">
                                        Summarize anything.<br/>Understand everything.
                                    </div>
                                    <div className="modal-left-features">
                                        <div className="modal-left-feat">⚡ AI-powered summaries</div>
                                        <div className="modal-left-feat">📄 PDF, DOCX, TXT support</div>
                                        <div className="modal-left-feat">🔑 Keyword extraction</div>
                                        <div className="modal-left-feat">🕐 Full history saved</div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Form panel */}
                            <div className="modal-right">
                                <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>

                                <div className="modal-form-title">
                                    {authTab === "login" ? "Welcome back" : "Create account"}
                                </div>
                                <div className="modal-form-sub">
                                    {authTab === "login"
                                        ? "Sign in to continue to SummarAI"
                                        : "Start summarizing smarter today"}
                                </div>

                                {/* TABS */}
                                <div className="modal-tabs">
                                    <button
                                        className={`modal-tab ${authTab === "login" ? "active" : ""}`}
                                        onClick={() => { setAuthTab("login"); setShowPassword(false); setUsername(""); setPassword(""); }}
                                    >Login</button>
                                    <button
                                        className={`modal-tab ${authTab === "register" ? "active" : ""}`}
                                        onClick={() => { setAuthTab("register"); setShowPassword(false); setUsername(""); setPassword(""); }}
                                    >Sign Up</button>
                                </div>

                                {/* USERNAME */}
                                <div className="modal-field">
                                    <label className="modal-label">USERNAME</label>
                                    <div className="modal-input-wrap">
                                        <span className="modal-input-icon">👤</span>
                                        <input
                                            className="modal-input"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && (authTab === "login" ? handleLogin() : handleRegister())}
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div className="modal-field">
                                    <label className="modal-label">PASSWORD</label>
                                    <div className="modal-input-wrap">
                                        <span className="modal-input-icon">🔒</span>
                                        <input
                                            className="modal-input"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && (authTab === "login" ? handleLogin() : handleRegister())}
                                        />
                                        <button
                                            className="modal-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            type="button"
                                        >
                                            {showPassword ? "👁️" : "👁️‍🗨️"}
                                        </button>
                                    </div>
                                </div>

                                {/* SUBMIT */}
                                <button
                                    className="modal-submit-btn"
                                    onClick={authTab === "login" ? handleLogin : handleRegister}
                                >
                                    {authTab === "login" ? "Login →" : "Create Account →"}
                                </button>

                                <div className="modal-switch-text">
                                    {authTab === "login"
                                        ? <>Don't have an account? <span onClick={() => { setAuthTab("register"); setShowPassword(false); setUsername(""); setPassword(""); }}>Sign Up</span></>
                                        : <>Already have an account? <span onClick={() => { setAuthTab("login"); setShowPassword(false); setUsername(""); setPassword(""); }}>Login</span></>
                                    }
                                </div>
                            </div>

                        </div>
                    </div>
                )}
                <Toast message={toast.message} type={toast.type} />
            </>
        );
    }

    const filteredHistory = history.filter((item) =>
        (item.summary || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── MAIN LAYOUT ───────────────────────────────────
    return (
        <div className="app-layout">

            {/* SIDEBAR */}
            <aside className={`sidebar ${sidebarExpanded ? "expanded" : ""}`}>
                <div className="sidebar-logo-wrap"
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    title={sidebarExpanded ? "Collapse" : "Expand"}>
                    <div className="sidebar-logo">✦</div>
                    <span className="sidebar-logo-name">SummarAI</span>
                </div>

                <div className="sidebar-nav">
                    <button className="sidebar-btn sidebar-new-btn"
                        onClick={clearAll} title="New Summary">
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>✦</span>
                        <span className="sidebar-label">New Summary</span>
                        {!sidebarExpanded && <span className="tooltip">New Summary</span>}
                    </button>

                    <div className="sidebar-divider" />

                    <SidebarBtn icon="✏️" label="Summarize"
                        active={activePage === "summarize"}
                        onClick={() => setActivePage("summarize")}
                        expanded={sidebarExpanded} />
                    <SidebarBtn icon="📁" label="Upload File"
                        active={activePage === "upload"}
                        onClick={() => setActivePage("upload")}
                        expanded={sidebarExpanded} />
                    <SidebarBtn icon="🕐" label="History"
                        active={activePage === "history"}
                        onClick={() => setActivePage("history")}
                        expanded={sidebarExpanded} />

                    {sidebarExpanded && recentSummaries.length > 0 && (
                        <div className="sidebar-recents">
                            <div className="sidebar-recents-label">Recents</div>
                            {recentSummaries.map((item) => (
                                <button
                                    key={item.id}
                                    className="sidebar-recent-item"
                                    onClick={() => viewHistoryItem(item)}
                                    title={item.original_text?.slice(0, 100)}
                                >
                                    <span className="sidebar-recent-text">{getShortLabel(item)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-avatar" title={loggedInUser}
                        style={{ margin: sidebarExpanded ? "0 0 0 14px" : "0 auto" }}>
                        {initials}
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className={`main-area ${sidebarExpanded ? "expanded" : ""}`}>

                {/* TOPBAR */}
                <header className="topbar">
                    <div className="topbar-left">
                        <div className="topbar-title">
                            {activePage === "summarize" && "Text Summarizer"}
                            {activePage === "upload"    && "Upload File"}
                            {activePage === "history"   && "Summary History"}
                        </div>
                        <div className="topbar-breadcrumb">
                            <span>SummarAI</span>
                            <span>›</span>
                            <span style={{ color: "var(--accent)" }}>
                                {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? "☀️ Light" : "🌙 Dark"}
                        </button>
                        <div className="topbar-user">
                            <div className="topbar-user-dot">{initials}</div>
                            <span className="topbar-username">{loggedInUser}</span>
                        </div>
                        <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
                    </div>
                </header>

                {/* PAGE: SUMMARIZE */}
                {activePage === "summarize" && (
                    <div className="page-content">
                        <div className="summarize-layout">
                            <div className="summarize-left">
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            <div className="card-title-dot"></div>
                                            Input Text
                                        </div>
                                    </div>
                                    <InputPanel text={text} setText={setText} />
                                </div>

                                <div className="card" style={{ marginTop: "16px" }}>
                                    <div className="card-header">
                                        <div className="card-title">
                                            <div className="card-title-dot" style={{
                                                background: "var(--blue)",
                                                boxShadow: "0 0 6px rgba(59,130,246,0.5)"
                                            }}></div>
                                            Options
                                        </div>
                                    </div>
                                    <OptionsPanel
                                        length={length} setLength={setLength}
                                        mode={mode}     setMode={setMode}
                                    />
                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    style={{ marginTop: "16px", height: "48px", fontSize: "14px" }}
                                    onClick={handleSummarize}
                                    disabled={loading}
                                >
                                    {loading ? "Generating..." : "⚡ Generate Summary"}
                                </button>
                            </div>

                            <div className="summarize-right">
                                <ResultPanel
                                    summary={summary}
                                    bullets={bullets}
                                    keywords={keywords}
                                    importantSentences={importantSentences}
                                    originalWords={originalWords}
                                    summaryWords={summaryWords}
                                    onDownload={downloadPDF}
                                    onToast={showToast}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* PAGE: UPLOAD */}
                {activePage === "upload" && (
                    <div className="page-content">
                        <div className="upload-layout">
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">
                                        <div className="card-title-dot"></div>
                                        Upload Document
                                    </div>
                                </div>
                                <div
                                    className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                                    onClick={() => document.getElementById("file-input").click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                                    onDrop={(e) => {
                                        e.preventDefault(); setDragOver(false);
                                        const dropped = e.dataTransfer.files[0];
                                        if (!dropped) return;
                                        const allowed = [".txt", ".pdf", ".docx"];
                                        const ext = "." + dropped.name.split(".").pop().toLowerCase();
                                        if (!allowed.includes(ext)) {
                                            showToast("Unsupported file type. Use .txt, .pdf, or .docx", "error");
                                            return;
                                        }
                                        if (dropped.size > 10 * 1024 * 1024) {
                                            showToast("File too large. Maximum size is 10MB", "error");
                                            return;
                                        }
                                        setFile(dropped);
                                        showToast(`${dropped.name} selected!`);
                                    }}
                                >
                                    <div className="upload-zone-icon">
                                        {dragOver ? "📥" : file ? "📄" : "📂"}
                                    </div>
                                    <div className="upload-zone-text">
                                        {dragOver
                                            ? "Drop it here!"
                                            : file
                                            ? file.name
                                            : "Click or drag & drop a file here"}
                                    </div>
                                    <div className="upload-zone-hint">
                                        Supports .txt, .pdf, .docx — Max 10MB
                                    </div>
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".txt,.pdf,.docx"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const picked = e.target.files[0];
                                            if (picked) {
                                                setFile(picked);
                                                showToast(`${picked.name} selected!`);
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ marginTop: "20px" }}>
                                    <OptionsPanel
                                        length={length} setLength={setLength}
                                        mode={mode}     setMode={setMode}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary btn-full"
                                    style={{ marginTop: "20px", height: "46px", fontSize: "14px" }}
                                    onClick={handleFileUpload}
                                    disabled={loading || !file}
                                >
                                    {loading ? "Processing..." : "⚡ Upload & Summarize"}
                                </button>
                                {loading && (
                                    <div className="loading-bar" style={{ marginTop: "14px" }}>
                                        <div className="spinner"></div>
                                        Processing your document...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* PAGE: HISTORY */}
                {activePage === "history" && (
                    <div className="page-content">
                        <div className="search-wrap">
                            <span className="search-icon">🔍</span>
                            <input
                                className="search-input"
                                placeholder="Search your summaries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🕐</div>
                                <div className="empty-state-text">
                                    {searchTerm ? "No results found" : "No history yet — generate a summary first"}
                                </div>
                            </div>
                        ) : (
                            filteredHistory.map((item) => (
                                <div key={item.id} className="history-card">
                                    <div className="history-card-header">
                                        <div className="history-card-badges">
                                            <span className="tag tag-green">{item.mode}</span>
                                            <span className="tag tag-blue">{item.length}</span>
                                            {item.favorite === 1 && (
                                                <span className="tag" style={{
                                                    background: "var(--warning-light)",
                                                    color: "var(--warning)"
                                                }}>★ Favorite</span>
                                            )}
                                        </div>
                                        <span className="history-card-meta">
                                            {item.created_at?.slice(0, 16).replace("T", " ")}
                                        </span>
                                    </div>
                                    <div className="history-card-text">{item.summary}</div>
                                    <div className="history-card-actions">
                                        <button className="btn btn-secondary"
                                            onClick={() => viewHistoryItem(item)}>View</button>
                                        <button className="btn btn-ghost"
                                            onClick={() => toggleFavorite(item.id)}>
                                            {item.favorite === 1 ? "★ Unfavorite" : "☆ Favorite"}
                                        </button>
                                        <button className="btn btn-danger"
                                            onClick={() => deleteHistory(item.id)}>Delete</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>

            <Toast message={toast.message} type={toast.type} />
        </div>
    );
}

export default App;