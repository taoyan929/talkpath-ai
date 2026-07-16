import { useEffect, useState } from "react";
import "./styles.css";

type HealthResponse = {
  status: string;
  service: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkBackendHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Could not connect to the backend.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    checkBackendHealth();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Full-stack connection check</p>
        <h1>TalkPath AI</h1>
        <p className="tagline">AI English Learning Coach for Real-World Communication</p>
      </section>

      <section className="status-panel" aria-live="polite">
        <div>
          <h2>Backend Health</h2>
          <p>React is calling the Express health endpoint.</p>
        </div>

        {isLoading && <p className="status loading">Checking backend...</p>}

        {!isLoading && error && (
          <p className="status error">Backend connection failed: {error}</p>
        )}

        {!isLoading && health && (
          <div className="status success">
            <span>Status: {health.status}</span>
            <span>Service: {health.service}</span>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
