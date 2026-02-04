export const config = {
  runtime: 'edge'
};

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...');
}

function extractArticle(html) {
  if (!html) return { title: '', byline: '', textContent: '' };

  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : '';

  const bylineMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i);
  const byline = bylineMatch ? decodeHtml(bylineMatch[1].trim()) : '';

  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<input[^>]*\/?>/gi, '')
    .replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '')
    .replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, '');

  let mainContent = '';
  const articleMatch = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    mainContent = articleMatch[1];
  } else {
    const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      mainContent = mainMatch[1];
    } else {
      const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      mainContent = bodyMatch ? bodyMatch[1] : cleanHtml;
    }
  }

  const paragraphs = mainContent.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  let text = paragraphs
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .filter(p => p.length > 20)
    .join('\n\n');

  if (text.length < 100) {
    text = mainContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  text = decodeHtml(text);
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return { title, byline, textContent: text };
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let url;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!url || !isValidUrl(url)) {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch URL',
        message: `HTTP ${response.status}: ${response.statusText}`
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const html = await response.text();
    const { title, byline, textContent } = extractArticle(html);

    if (!textContent || textContent.length < 10) {
      return new Response(JSON.stringify({
        error: 'Could not extract article',
        message: 'The page may not contain readable text'
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const MAX_CHARS = 10000;
    const content = textContent.slice(0, MAX_CHARS);

    return new Response(JSON.stringify({
      title: title || 'Untitled',
      content: content,
      byline: byline,
      originalLength: textContent.length,
      wasTruncated: textContent.length > MAX_CHARS
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to extract article',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
