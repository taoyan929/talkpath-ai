import { FormEvent, useEffect, useRef, useState } from "react";
import "./styles.css";
import { detectInputMode, QUICK_GOALS, type InputMode } from "./writingCoach";

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

type SubmittedRequest = {
  text: string;
  goal?: string;
  mode: InputMode;
};

type FeedbackResult = {
  data: WritingFeedback;
  request: SubmittedRequest;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const MAX_TEXT_LENGTH = 5000;
const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the Writing Coach service. Please make sure the backend is running and try again.";
const INVALID_RESPONSE_MESSAGE =
  "The Writing Coach returned an unexpected response. Please try again.";

function getModeLabel(mode: InputMode): string {
  return mode === "dictionary" ? "Dictionary mode" : "Writing feedback mode";
}

function getLoadingLabel(mode: InputMode): string {
  return mode === "dictionary"
    ? "Looking up this word…"
    : "Reviewing your writing…";
}

async function readApiError(response: Response): Promise<string> {
  const apiError = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null;

  return (
    apiError?.detail?.[0]?.msg ??
    apiError?.message ??
    "The Writing Coach could not process your request. Please try again."
  );
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [text, setText] = useState("");
  const [goal, setGoal] = useState("");
  const [feedbackResult, setFeedbackResult] =
    useState<FeedbackResult | null>(null);
  const [submittedRequest, setSubmittedRequest] =
    useState<SubmittedRequest | null>(null);
  const [failedRequest, setFailedRequest] =
    useState<SubmittedRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [keyPhrasesExpanded, setKeyPhrasesExpanded] = useState(true);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestInFlightRef = useRef(false);

  const currentMode = detectInputMode(text);

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

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  async function submitWriting(request: SubmittedRequest) {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setCopyError(null);
    setFeedbackResult(null);
    setFailedRequest(null);
    setSubmittedRequest(request);

    try {
      let response: Response;

      try {
        response = await fetch(`${API_BASE_URL}/api/writing/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: request.text,
            goal: request.goal,
          }),
        });
      } catch {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response
        .json()
        .catch(() => null)) as WritingFeedback | null;

      if (!data) {
        throw new Error(INVALID_RESPONSE_MESSAGE);
      }

      setFeedbackResult({ data, request });
      setSuggestionsExpanded(true);
      setKeyPhrasesExpanded(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The Writing Coach could not process your request. Please try again.";

      setError(message);
      setFailedRequest(request);
    } finally {
      requestInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setError("Please enter some writing before asking for feedback.");
      setFailedRequest(null);
      return;
    }

    void submitWriting({
      text,
      goal: goal.trim() || undefined,
      mode: currentMode,
    });
  }

  function handleRetry() {
    if (failedRequest) {
      void submitWriting(failedRequest);
    }
  }

  function handleStartOver() {
    setText("");
    setGoal("");
    setFeedbackResult(null);
    setSubmittedRequest(null);
    setFailedRequest(null);
    setError(null);
    setCopyError(null);
    setCopiedKey(null);
    setSuggestionsExpanded(true);
    setKeyPhrasesExpanded(true);
    textAreaRef.current?.focus();
  }

  function handleUseNaturalVersion() {
    if (!feedbackResult?.data.natural_version) {
      return;
    }

    setText(feedbackResult.data.natural_version);
    setFeedbackResult(null);
    setSubmittedRequest(null);
    setFailedRequest(null);
    setError(null);
    setCopyError(null);
    textAreaRef.current?.focus();
  }

  async function handleCopy(value: string, key: string) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(value);
      setCopyError(null);
      setCopiedKey(key);

      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }

      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      setCopiedKey(null);
      setCopyError("Could not copy. Please copy the text manually.");
    }
  }

  const loadingMode = submittedRequest?.mode ?? currentMode;
  const feedback = feedbackResult?.data;
  const resultMode = feedbackResult?.request.mode;
  const showCorrectedText =
    resultMode === "writing" ||
    (feedbackResult !== null &&
      feedback?.corrected_text.trim() !== feedbackResult.request.text.trim());
  const showNaturalVersion =
    resultMode === "writing" ||
    (feedbackResult !== null &&
      feedback?.natural_version.trim() !== feedbackResult.request.text.trim());

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

          <div className={`mode-indicator ${currentMode}`} aria-live="polite">
            <span aria-hidden="true" />
            {getModeLabel(currentMode)}
          </div>

          <label className="field-label" htmlFor="writing-text">
            Your text
          </label>
          <textarea
            id="writing-text"
            ref={textAreaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Enter one word, a sentence, or a short message."
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

          <fieldset className="goal-options">
            <legend>Quick goals</legend>
            <div>
              {QUICK_GOALS.map((quickGoal) => (
                <button
                  className="goal-option"
                  type="button"
                  key={quickGoal}
                  aria-pressed={goal === quickGoal}
                  onClick={() => setGoal(quickGoal)}
                >
                  {quickGoal}
                </button>
              ))}
            </div>
          </fieldset>

          {error && !failedRequest && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-action"
            type="submit"
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting ? getLoadingLabel(loadingMode) : "Get feedback"}
          </button>

          <button
            className="text-action start-over-action"
            type="button"
            onClick={handleStartOver}
            disabled={isSubmitting}
          >
            Start over
          </button>
          <p className="form-note">No account needed. Your work is not saved.</p>
        </form>

        <section className="feedback-panel" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="step-label">Step 2</p>
              <h2>Your feedback</h2>
            </div>
            {resultMode && (
              <span className="result-mode">{getModeLabel(resultMode)}</span>
            )}
          </div>

          {isSubmitting && (
            <div className="loading-feedback" role="status">
              <p>{getLoadingLabel(loadingMode)}</p>
              <div className="loading-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {!isSubmitting && error && failedRequest && (
            <div className="request-error" role="alert">
              <span className="empty-number" aria-hidden="true">
                !
              </span>
              <h3>We couldn’t get feedback</h3>
              <p>{error}</p>
              <button
                className="secondary-action"
                type="button"
                onClick={handleRetry}
              >
                Retry
              </button>
            </div>
          )}

          {!isSubmitting && !error && !feedbackResult && (
            <div className="empty-feedback">
              <span className="empty-number" aria-hidden="true">
                01
              </span>
              <h3>Ready when you are</h3>
              <p>
                Enter one word for a dictionary-style explanation, or write a
                sentence or message for complete feedback.
              </p>
            </div>
          )}

          {!isSubmitting && feedbackResult && feedback && (
            <div className="feedback-content">
              {copyError && (
                <p className="copy-error" role="alert">
                  {copyError}
                </p>
              )}

              <div className="feedback-summary">
                <p className="result-label">Overall feedback</p>
                <p>{feedback.overall_feedback}</p>
              </div>

              {resultMode === "dictionary" && feedback.word_details && (
                <section className="dictionary-card" aria-label="Word details">
                  <p className="result-label">Dictionary</p>
                  <div className="dictionary-heading">
                    <h3>{feedback.word_details.word}</h3>
                    <span>{feedback.word_details.pronunciation}</span>
                  </div>

                  <ol className="word-meaning-list">
                    {feedback.word_details.meanings.map((wordMeaning, index) => {
                      const copyKey = `dictionary-example-${index}`;

                      return (
                        <li key={`${wordMeaning.part_of_speech}-${index}`}>
                          <p className="part-of-speech">
                            {wordMeaning.part_of_speech}
                          </p>
                          <p>{wordMeaning.meaning}</p>
                          <p className="phrase-example">
                            Example: {wordMeaning.example}
                          </p>
                          <button
                            className="copy-action"
                            type="button"
                            onClick={() =>
                              void handleCopy(wordMeaning.example, copyKey)
                            }
                          >
                            {copiedKey === copyKey ? "Copied" : "Copy example"}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              {showCorrectedText && (
                <div className="corrected-card">
                  <div className="result-card-heading">
                    <p className="result-label">Corrected text</p>
                    <button
                      className="copy-action"
                      type="button"
                      onClick={() =>
                        void handleCopy(feedback.corrected_text, "corrected")
                      }
                    >
                      {copiedKey === "corrected" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p>{feedback.corrected_text}</p>
                </div>
              )}

              {showNaturalVersion && (
                <div className="natural-card">
                  <div className="result-card-heading">
                    <p className="result-label">More natural version</p>
                    <button
                      className="copy-action"
                      type="button"
                      onClick={() =>
                        void handleCopy(feedback.natural_version, "natural")
                      }
                    >
                      {copiedKey === "natural" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p>{feedback.natural_version}</p>
                  <button
                    className="secondary-action use-input-action"
                    type="button"
                    onClick={handleUseNaturalVersion}
                  >
                    Use as new input
                  </button>
                </div>
              )}

              {feedback.suggestions.length === 0 && resultMode === "writing" && (
                <p className="empty-result">No corrections needed.</p>
              )}

              {feedback.suggestions.length > 0 && (
                <section className="suggestions-section">
                  <div className="learning-section-heading">
                    <div>
                      <p className="result-label">Suggestions</p>
                      <span>{feedback.suggestions.length}</span>
                    </div>
                    <button
                      className="toggle-action"
                      type="button"
                      aria-expanded={suggestionsExpanded}
                      aria-controls="suggestion-list"
                      onClick={() =>
                        setSuggestionsExpanded((isExpanded) => !isExpanded)
                      }
                    >
                      {suggestionsExpanded ? "Hide" : "Show"}
                    </button>
                  </div>

                  {suggestionsExpanded && (
                    <ol className="suggestion-list" id="suggestion-list">
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
                </section>
              )}

              {feedback.key_phrases.length > 0 && (
                <section className="key-phrases-section">
                  <div className="learning-section-heading">
                    <div>
                      <p className="result-label">Key phrases</p>
                      <span>{feedback.key_phrases.length}</span>
                    </div>
                    <button
                      className="toggle-action"
                      type="button"
                      aria-expanded={keyPhrasesExpanded}
                      aria-controls="key-phrase-list"
                      onClick={() =>
                        setKeyPhrasesExpanded((isExpanded) => !isExpanded)
                      }
                    >
                      {keyPhrasesExpanded ? "Hide" : "Show"}
                    </button>
                  </div>

                  {keyPhrasesExpanded && (
                    <ul className="key-phrase-list" id="key-phrase-list">
                      {feedback.key_phrases.map((keyPhrase, index) => {
                        const copyKey = `key-phrase-example-${index}`;

                        return (
                          <li
                            className="key-phrase-card"
                            key={`${keyPhrase.phrase}-${index}`}
                          >
                            <p className="key-phrase">{keyPhrase.phrase}</p>
                            <p className="phrase-meaning">{keyPhrase.meaning}</p>
                            <p className="phrase-example">
                              Example: {keyPhrase.example}
                            </p>
                            <button
                              className="copy-action"
                              type="button"
                              onClick={() =>
                                void handleCopy(keyPhrase.example, copyKey)
                              }
                            >
                              {copiedKey === copyKey
                                ? "Copied"
                                : "Copy example"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
