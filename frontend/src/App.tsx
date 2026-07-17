import { FormEvent, useEffect, useState } from "react";
import "./styles.css";

type HealthResponse = {
  status: string;
  service: string;
};

type WritingSuggestion = {
  category: string;
  original: string;
  replacement: string;
  explanation: string;
};

type WritingKeyPhrase = {
  phrase: string;
  meaning: string;
  example: string;
};

type WritingWordMeaning = {
  part_of_speech: string;
  meaning: string;
  example: string;
};

type WritingWordDetails = {
  word: string;
  pronunciation: string;
  meanings: WritingWordMeaning[];
};

type WritingFeedback = {
  overall_feedback: string;
  corrected_text: string;
  natural_version: string;
  suggestions: WritingSuggestion[];
  key_phrases: WritingKeyPhrase[];
  word_details: WritingWordDetails | null;
};

type ApiErrorResponse = {
  detail?: Array<{ msg?: string }>;
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const MAX_TEXT_LENGTH = 5000;
const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the Writing Coach service. Please make sure the backend is running and try again.";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [text, setText] = useState("");
  const [goal, setGoal] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkBackendHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);

        if (!response.ok) {
          return;
        }

        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch {
        setHealth(null);
      }
    }

    checkBackendHealth();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setError("Please enter some writing before asking for feedback.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      let response: Response;

      try {
        response = await fetch(`${API_BASE_URL}/api/writing/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            goal: goal.trim() || undefined,
          }),
        });
      } catch {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }

      if (!response.ok) {
        const apiError = (await response
          .json()
          .catch(() => null)) as ApiErrorResponse | null;
        const message =
          apiError?.detail?.[0]?.msg ??
          apiError?.message ??
          "The writing coach could not process your request.";

        throw new Error(message);
      }

      const data: WritingFeedback = await response.json();
      setFeedback(data);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not connect to the writing coach.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="TalkPath AI home">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>TalkPath AI</span>
        </a>

        <div className={`backend-status ${health ? "online" : "offline"}`}>
          <span className="status-dot" aria-hidden="true" />
          {health ? "Coach online" : "Coach unavailable"}
        </div>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow">Writing Coach</p>
        <h1>Write clearly. Sound more natural.</h1>
        <p className="tagline">
          Practise everyday English and get simple, useful feedback you can
          apply right away.
        </p>
      </section>

      <section className="coach-workspace" aria-label="Writing coach workspace">
        <form className="writing-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <p className="step-label">Step 1</p>
              <h2>Share your writing</h2>
            </div>
            <span className="character-count">
              {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
            </span>
          </div>

          <label className="field-label" htmlFor="writing-text">
            Your text
          </label>
          <textarea
            id="writing-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="For example: I go supermarket yesterday to buy some fruit."
            rows={10}
            required
          />

          <label className="field-label" htmlFor="writing-goal">
            Your goal <span>Optional</span>
          </label>
          <input
            id="writing-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="For example: Improve my grammar"
            type="text"
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting || !text.trim()}>
            {isSubmitting ? "Reviewing your writing…" : "Get feedback"}
          </button>
          <p className="form-note">No account needed. Your work is not saved.</p>
        </form>

        <section className="feedback-panel" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="step-label">Step 2</p>
              <h2>Your feedback</h2>
            </div>
          </div>

          {!feedback && (
            <div className="empty-feedback">
              <span className="empty-number" aria-hidden="true">
                01
              </span>
              <h3>Ready when you are</h3>
              <p>
                Add your writing and choose “Get feedback”. Your corrected
                text, natural version, and suggestions will appear here.
              </p>
            </div>
          )}

          {feedback && (
            <div className="feedback-content">
              <div className="feedback-summary">
                <p className="result-label">Overall feedback</p>
                <p>{feedback.overall_feedback}</p>
              </div>

              {feedback.word_details && (
                <section className="dictionary-card" aria-label="Word details">
                  <p className="result-label">Dictionary</p>
                  <div className="dictionary-heading">
                    <h3>{feedback.word_details.word}</h3>
                    <span>{feedback.word_details.pronunciation}</span>
                  </div>

                  <ol className="word-meaning-list">
                    {feedback.word_details.meanings.map((wordMeaning, index) => (
                      <li key={`${wordMeaning.part_of_speech}-${index}`}>
                        <p className="part-of-speech">
                          {wordMeaning.part_of_speech}
                        </p>
                        <p>{wordMeaning.meaning}</p>
                        <p className="phrase-example">
                          Example: {wordMeaning.example}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className="corrected-card">
                <p className="result-label">Corrected text</p>
                <p>{feedback.corrected_text}</p>
              </div>

              <div className="natural-card">
                <p className="result-label">More natural version</p>
                <p>{feedback.natural_version}</p>
              </div>

              <div className="suggestions-section">
                <div className="suggestions-heading">
                  <p className="result-label">Suggestions</p>
                  <span>{feedback.suggestions.length}</span>
                </div>

                {feedback.suggestions.length === 0 ? (
                  <p className="empty-result">No corrections needed.</p>
                ) : (
                  <ol className="suggestion-list">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li
                        className="suggestion-card"
                        key={`${suggestion.category}-${index}`}
                      >
                        <div className="suggestion-meta">
                          <span>{suggestion.category}</span>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </div>
                        <p className="word-change">
                          <del>{suggestion.original}</del>
                          <span aria-hidden="true">→</span>
                          <ins>{suggestion.replacement}</ins>
                        </p>
                        <p className="explanation">{suggestion.explanation}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="key-phrases-section">
                <div className="suggestions-heading">
                  <p className="result-label">Key phrases</p>
                  <span>{feedback.key_phrases.length}</span>
                </div>

                {feedback.key_phrases.length === 0 ? (
                  <p className="empty-result">No key phrases for this text.</p>
                ) : (
                  <ul className="key-phrase-list">
                    {feedback.key_phrases.map((keyPhrase, index) => (
                      <li
                        className="key-phrase-card"
                        key={`${keyPhrase.phrase}-${index}`}
                      >
                        <p className="key-phrase">{keyPhrase.phrase}</p>
                        <p className="phrase-meaning">{keyPhrase.meaning}</p>
                        <p className="phrase-example">
                          Example: {keyPhrase.example}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
