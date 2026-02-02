
import { JSDOM } from 'jsdom';
import pkg from '@mozilla/readability';
const { Readability } = pkg;
  





  function isValidUrl (value){
      try {
          // console.log('1. Starting extraction for:', url)
            const url = new URL (value);
            return url.protocol ==="http:" || url.protocol ==="https:";

          }catch{
            return false;
        }
        }
async function fetchArticleContent (url, options = {}) {
         const headers = options.headers || {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
        const response = await fetch(url, { headers });
        const html = await response.text();
          console.log('2. Fetched HTML, length:', html.length)
     return html;
}                                                               
export default async function handler(req) {
   if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
        headers: { 'Content-Type': 'application/json' }
    })
  }


 let url
  try {
    const body = await req.json()// it is asynchronous it takes time to compleyte thats why await is used
    url=body.url;
  } catch {
    return new Response(JSON.stringify({error : 'Invalid Json'}),{
      status :400,
     headers: { 'Content-Type': 'application/json' }
    })
  }
  if (!url || !isValidUrl(url) ){
    return new Response(JSON.stringify({error : 'Invalid Url'}),{
      status:400,
     headers: { 'Content-Type': 'application/json' }
    })
  }
 

try {
  const html=await fetchArticleContent(url);
  const dom = new JSDOM (html, {url});
  console.log('3. Created JSDOM')

    const document=dom.window.document;
  const reader = new Readability(document);
  const article = reader.parse();
 console.log('4. Parsed article, title:', article.title)
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
  wasTruncated: wasTruncated}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });


    }catch (error) {
        return new Response(JSON.stringify({
       error: 'Failed to extract article',
       message: 'Could not read content from this URL'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  })
}

}

