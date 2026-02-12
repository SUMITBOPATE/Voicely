import { useState, useRef } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  const extractArticle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setArticle(null);
    setAudioUrl(null);
    setAudioError(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract article');
      }

      const { title, content, originalLength, wasTruncated } = data;

      if (!content || content.length < 10) {
        throw new Error('Could not extract article content');
      }

      setArticle({
        title,
        content,
        originalLength,
        wasTruncated
      });
    } catch (err) {
      setError(err.message || 'Failed to extract article');
    } finally {
      setLoading(false);
    }
  };

  const speakArticle = async () => {
  if (!article || !article.content) return;

  setAudioLoading(true);
  setAudioError(null);
  setIsPlaying(false);

  try {
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: article.content })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to generate audio');
    }

    if (!data.audioUrl) {
      throw new Error('No audio received from server');
    }

    setAudioUrl(data.audioUrl);

    // wait for React to update audio src
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;

        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setAudioError('Click play to listen');
          });
      }
    }, 100);

  } catch (err) {
    setAudioError(err.message || 'Failed to generate audio');
  } finally {
    setAudioLoading(false);
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
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '24px' }}>{article.title}</h2>
          </div>

          <div style={{ padding: '20px', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap' }}>
            {article.content}
          </div>

          <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {article.originalLength} chars {article.wasTruncated && '(truncated)'}
            </span>

            {!audioUrl && !audioLoading && !audioError && (
              <button
                onClick={speakArticle}
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
            )}

            {audioLoading && (
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Generating audio...
              </span>
            )}

            {audioError && (
              <span style={{ color: '#dc2626', fontSize: '14px' }}>
                {audioError}
              </span>
            )}

            {audioUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={togglePlayPause}
                  style={{
                    padding: '10px 20px',
                    background: isPlaying ? '#f59e0b' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={speakArticle}
                  style={{
                    padding: '10px 16px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Regenerate
                </button>
              </div>
            )}
          </div>

          <audio
            ref={audioRef}
            onEnded={handleAudioEnded}
            onError={handleAudioError}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
