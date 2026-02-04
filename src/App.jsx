import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractArticle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setArticle(null);

    try {
      // Use Jina AI directly - no server timeout
      const cleanUrl = url.replace(/^https?:\/\//, '');
      const jinaUrl = `https://r.jina.ai/http://${cleanUrl}`;

      const response = await fetch(jinaUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const text = await response.text();

      // Parse Jina response
      let title = '';
      let content = text;

      // Extract title if present
      const titleMatch = text.match(/^(?:Title[:\s]+)([^\n]+)/im);
      if (titleMatch) {
        title = titleMatch[1].trim();
        content = text.replace(/^(?:Title[:\s]+)[^\n]+\n*/im, '').trim();
      }

      // Remove "Source:" lines
      content = content.replace(/^Source:[^\n]*\n*/gim, '').trim();

      // Clean up whitespace
      content = content.replace(/\n{3,}/g, '\n\n').trim();

      if (!content || content.length < 10) {
        throw new Error('Could not extract article content');
      }

      const MAX_CHARS = 10000;
      const truncated = content.length > MAX_CHARS;

      setArticle({
        title: title || 'Untitled',
        content: truncated ? content.slice(0, MAX_CHARS) : content,
        byline: '',
        originalLength: content.length,
        wasTruncated: truncated
      });
    } catch (err) {
      setError(err.message || 'Failed to extract article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>Voicely</h1>

      <form onSubmit={extractArticle} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter article URL..."
          required
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Extracting...' : 'Extract'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {article && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '24px' }}>{article.title}</h2>
          </div>

          <div style={{ padding: '20px', lineHeight: '1.8', color: '#374151' }}>
            {article.content}
          </div>

          <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {article.originalLength} chars {article.wasTruncated && '(truncated)'}
            </span>
            <button
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Play Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
