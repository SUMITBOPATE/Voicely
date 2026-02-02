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
  // Extract title
  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : '';

  // Extract byline
  const bylineMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i);
  const byline = bylineMatch ? decodeHtml(bylineMatch[1].trim()) : '';

  // Remove unwanted elements
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

  // Remove common ad/sidebar class elements
  cleanHtml = cleanHtml.replace(/<div[^>]*class=["']([^"']*)[-_]?(ad|sidebar|comment|social|share|related|promo|cookie|popup)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
  cleanHtml = cleanHtml.replace(/<div[^>]*id=["']([^"']*)[-_]?(ad|sidebar|comment|social|share|related|promo|cookie|popup)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

  // Try to find main content container
  let mainContent = '';

  // Look for <article> tag
  const articleMatch = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    mainContent = articleMatch[1];
  } else {
    // Look for <main> tag
    const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      mainContent = mainMatch[1];
    } else {
      // Look for common article content class names
      const contentMatch = cleanHtml.match(/<div[^>]*class=["']([^"']*content[^"']*)["'][^>]*>([\s\S]*?)<\/div>/i);
      if (contentMatch) {
        mainContent = contentMatch[2];
      } else {
        // Fall back to body
        const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        mainContent = bodyMatch ? bodyMatch[1] : cleanHtml;
      }
    }
  }

  // Extract paragraphs - they usually contain main content
  const paragraphs = mainContent.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];

  let text = paragraphs
    .map(p => {
      // Remove any remaining tags in paragraph
      return p.replace(/<[^>]+>/g, '').trim();
    })
    .filter(p => p.length > 20) // Filter out short paragraphs (likely nav items)
    .join('\n\n');

  // If no good paragraphs found, try getting text from main content
  if (text.length < 100) {
    text = mainContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Decode HTML entities
  text = decodeHtml(text);

  // Clean up whitespace
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

    const html = await response.text();
    const article = extractArticle(html);

    const MAX_CHARS = 10000;
    let content = article.textContent;
    const wasTruncated = content.length > MAX_CHARS;
    if (wasTruncated) {
      content = content.slice(0, MAX_CHARS);
    }

    return new Response(JSON.stringify({
      title: article.title,
      content: content,
      byline: article.byline,
      originalLength: article.textContent.length,
      wasTruncated
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
