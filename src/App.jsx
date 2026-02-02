import { useState } from 'react';

function TestExtract() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Response text:', text);
      setResult({ status: res.status, raw: text });
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>API Test</h3>
      <button onClick={testAPI} disabled={loading}>
        {loading ? 'Loading...' : 'Test Extract API'}
      </button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
        {result ? JSON.stringify(result, null, 2) : 'Click button to test'}
      </pre>
    </div>
  );
}

function App() {
  return (
    <>
      <div style={{ padding: '20px' }}>Voicely App</div>
      <TestExtract />
    </>
  );
}

export default App;
