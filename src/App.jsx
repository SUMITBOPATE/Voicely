

import { useState } from "react";

function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/extract");
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: "Failed to reach backend" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Backend Test</h1>

      <button onClick={testBackend} disabled={loading}>
        {loading ? "Testing..." : "Test Backend"}
      </button>

      <pre style={{ marginTop: "20px" }}>
        {response && JSON.stringify(response, null, 2)}
      </pre>
    </div>
  );
}

export default App;

