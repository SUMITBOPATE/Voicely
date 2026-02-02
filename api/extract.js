
import * as cheerio from 'cheerio';

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Simple article extraction using cheerio
function extractArticle($) {
  // Remove unwanted elements
  $('script, style, nav, footer, iframe, ads, sidebar').remove();

  // Try to find main content
  const article = $('article').first();
  const main = $('main').first();
  const body = $('body');

  // Use the most specific container found
  let content = article.length ? article : (main.length ? main : body);

  // Extract title
  const title = $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    $('h1').first().text();

  // Extract byline
  const byline = $('meta[name="author"]').attr('content') ||
    $('[rel="author"]').text() ||
    $('.author').text();

  // Get text content
  let text = content.text().trim();

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

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
    const $ = cheerio.load(html);

    const article = extractArticle($);

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
