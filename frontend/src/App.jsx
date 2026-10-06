import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./app.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const [loading, setLoading] = useState(true);
  const [guidanceLoading, setGuidanceLoading] = useState(false);

  const [guidance, setGuidance] = useState("");
  const [error, setError] = useState("");

  const [favorites, setFavorites] = useState([]);

  // ---------------------------------------
  // FETCH GITHUB ISSUES
  // ---------------------------------------

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/issues`);

      if (!response.ok) {
        throw new Error("Failed to fetch GitHub issues");
      }

      const data = await response.json();

      console.log("API response:", data);

      /*
       * Backend may return:
       *
       * 1. An array directly:
       *    [...]
       *
       * 2. An object:
       *    { issues: [...] }
       *
       * Handle both so issues is ALWAYS an array.
       */

      let issueList = [];

      if (Array.isArray(data)) {
        issueList = data;
      } else if (Array.isArray(data.issues)) {
        issueList = data.issues;
      } else if (Array.isArray(data.data)) {
        issueList = data.data;
      }

      setIssues(issueList);

      if (issueList.length === 0) {
        console.warn("No issues found in API response:", data);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Unable to load GitHub issues.");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  // Load issues when page opens
  useEffect(() => {
    fetchIssues();
  }, []);

  // ---------------------------------------
  // REFRESH ISSUES
  // ---------------------------------------

  const handleRefresh = async () => {
    await fetchIssues();
  };

  // ---------------------------------------
  // AI GUIDANCE
  // ---------------------------------------

  const getGuidance = async (issue) => {
    try {
      setGuidanceLoading(true);
      setGuidance("");
      setError("");

      const response = await fetch(`${API_URL}/ai/guidance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description || "",
          repository: issue.repository || "",
          labels: Array.isArray(issue.labels) ? issue.labels : [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate guidance");
      }

      const data = await response.json();

      setGuidance(
        data.guidance ||
          data.response ||
          data.content ||
          ""
      );
    } catch (err) {
      console.error("AI guidance error:", err);
      setError("Unable to generate AI guidance.");
    } finally {
      setGuidanceLoading(false);
    }
  };

  // ---------------------------------------
  // OPEN ISSUE
  // ---------------------------------------

  const openIssue = (issue) => {
    setSelectedIssue(issue);
    setGuidance("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goBack = () => {
    setSelectedIssue(null);
    setGuidance("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ---------------------------------------
  // FAVORITES
  // ---------------------------------------

  const toggleFavorite = (issue) => {
    setFavorites((current) => {
      const exists = current.some(
        (item) => item.url === issue.url
      );

      if (exists) {
        return current.filter(
          (item) => item.url !== issue.url
        );
      }

      return [...current, issue];
    });
  };

  const isFavorite = (issue) => {
    return favorites.some(
      (item) => item.url === issue.url
    );
  };

  // ---------------------------------------
  // HOME / ISSUES PAGE
  // ---------------------------------------

  if (!selectedIssue) {
    return (
      <div className="app">

        {/* NAVBAR */}
        <header className="navbar">
          <div
            className="nav-logo"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <span className="logo-star">✦</span>
            OpenCollab AI
          </div>

          <nav>
            <button
              className="nav-link"
              onClick={() =>
                document
                  .getElementById("issues")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Issues
            </button>

            <button
              className="nav-link"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              About
            </button>
          </nav>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="hero-content">

            <div className="eyebrow">
              OPEN SOURCE · AI ASSISTANT
            </div>

            <h1>
              Find your first
              <br />
              <span>open-source contribution.</span>
            </h1>

            <p className="hero-description">
              Discover beginner-friendly GitHub issues and get
              step-by-step guidance from our local AI assistant.
            </p>

            <div className="hero-actions">
              <button
                className="hero-button"
                onClick={() =>
                  document
                    .getElementById("issues")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                Explore issues ↓
              </button>
            </div>

          </div>
        </section>

        {/* ISSUES */}
        <main
          className="issues-section"
          id="issues"
        >

          <div className="section-header">

            <div>
              <div className="section-label">
                GITHUB ISSUES
              </div>

              <h2>
                Beginner-friendly opportunities
              </h2>

              <p className="section-subtitle">
                Curated from GitHub's good-first-issue label.
              </p>
            </div>

            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>

          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>
                Finding beginner-friendly issues...
              </p>
            </div>
          ) : issues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ✦
              </div>

              <h3>
                No issues found
              </h3>

              <p>
                Try refreshing to search GitHub again.
              </p>
            </div>
          ) : (
            <div className="issues-grid">

              {(Array.isArray(issues) ? issues : []).map(
                (issue, index) => (
                  <article
                    className="issue-card"
                    key={issue.url || index}
                    onClick={() => openIssue(issue)}
                  >

                    <div className="issue-top">

                      <span className="issue-number">
                        #{String(index + 1).padStart(2, "0")}
                      </span>

                      <button
                        className={`heart-btn ${
                          isFavorite(issue)
                            ? "active"
                            : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(issue);
                        }}
                        aria-label="Favorite issue"
                      >
                        {isFavorite(issue)
                          ? "♥"
                          : "♡"}
                      </button>

                    </div>

                    <h3>
                      {issue.title || "Untitled issue"}
                    </h3>

                    <div className="repository">
                      {issue.repository || "Unknown repository"}
                    </div>

                    <p className="issue-description">
                      {issue.description
                        ? issue.description.length > 170
                          ? `${issue.description.substring(
                              0,
                              170
                            )}...`
                          : issue.description
                        : "No description available."}
                    </p>

                    <div className="labels">

                      {(Array.isArray(issue.labels)
                        ? issue.labels
                        : []
                      )
                        .slice(0, 4)
                        .map((label, labelIndex) => (
                          <span
                            className="label"
                            key={`${label}-${labelIndex}`}
                          >
                            {label}
                          </span>
                        ))}

                    </div>

                    <button
                      className="view-issue-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openIssue(issue);
                      }}
                    >
                      Understand issue →
                    </button>

                  </article>
                )
              )}

            </div>
          )}

        </main>

        {/* FOOTER */}
        <footer className="footer">

          <div>
            ✦ OpenCollab AI
          </div>

          <div>
            Built for first-time open-source contributors
          </div>

        </footer>

      </div>
    );
  }

  // ---------------------------------------
  // ISSUE DETAIL PAGE
  // ---------------------------------------

  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">

        <div
          className="nav-logo"
          onClick={goBack}
        >
          <span className="logo-star">
            ✦
          </span>
          OpenCollab AI
        </div>

        <nav>

          <button
            className="nav-link"
            onClick={goBack}
          >
            Issues
          </button>

          <button
            className="nav-link"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            About
          </button>

        </nav>

      </header>

      {/* DETAIL */}
      <main className="detail-page">

        <button
          className="back-btn"
          onClick={goBack}
        >
          ← Back to issues
        </button>

        <article className="detail-card">

          <div className="detail-header">

            <div>

              <div className="section-label">
                GITHUB ISSUE
              </div>

              <h1>
                {selectedIssue.title}
              </h1>

              <div className="detail-repository">
                {selectedIssue.repository}
              </div>

            </div>

            <button
              className={`heart-large ${
                isFavorite(selectedIssue)
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                toggleFavorite(selectedIssue)
              }
              aria-label="Favorite issue"
            >
              {isFavorite(selectedIssue)
                ? "♥"
                : "♡"}
            </button>

          </div>

          <div className="labels detail-labels">

            {(Array.isArray(selectedIssue.labels)
              ? selectedIssue.labels
              : []
            ).map(
              (label, index) => (
                <span
                  className="label"
                  key={`${label}-${index}`}
                >
                  {label}
                </span>
              )
            )}

          </div>

          <div className="issue-body">

            <h2>
              Issue Description
            </h2>

            <div className="body-text">
              <ReactMarkdown>
                {selectedIssue.description ||
                  "No description available."}
              </ReactMarkdown>
            </div>

          </div>

          {selectedIssue.url && (
            <a
              href={selectedIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="github-main-btn"
            >
              Open on GitHub ↗
            </a>
          )}

          {/* AI BOX */}
          <section className="ai-box">

            <div className="ai-icon">
              ✦
            </div>

            <div className="ai-label">
              OPENCOLLAB AI
            </div>

            <h2>
              Understand this issue
            </h2>

            <p>
              Get beginner-friendly guidance from our
              local AI assistant powered by Llama.
            </p>

            <button
              className="ai-button"
              onClick={() =>
                getGuidance(selectedIssue)
              }
              disabled={guidanceLoading}
            >
              {guidanceLoading
                ? "Analyzing issue..."
                : guidance
                ? "Regenerate AI Guidance"
                : "Get AI Guidance"}
            </button>

          </section>

          {/* GUIDANCE */}
          {guidance && (
            <section className="guidance-section">

              <div className="section-label">
                AI GENERATED GUIDANCE
              </div>

              <h2>
                Contribution Guide
              </h2>

              <div className="guidance-content">
                <ReactMarkdown>
                  {guidance}
                </ReactMarkdown>
              </div>

            </section>
          )}

        </article>

      </main>

      <footer className="footer">

        <div>
          ✦ OpenCollab AI
        </div>

        <div>
          Built for first-time open-source contributors
        </div>

      </footer>

    </div>
  );
}

export default App;