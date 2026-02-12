// // Local dev server with TTS support
// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import dotenv from 'dotenv';

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // eslint-disable-next-line no-undef
// console.log('API Key loaded:', process.env.UNREAL_SPEECH_API_KEY ? 'YES' : 'NO');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const UNREAL_SPEECH_API_URL = 'https://api.unrealspeech.com/synthesize';

// // TTS API endpoint
// app.post('/api/speak', async (req, res) => {
//   const { text } = req.body;

//   if (!text || !text.trim()) {
//     return res.status(400).json({ error: 'Invalid text' });
//   }

//   const apiKey = process.env.UNREAL_SPEECH_API_KEY;
//   console.log('API Key present:', !!apiKey);
//   if (!apiKey) {
//     return res.status(503).json({ error: 'TTS service not configured', message: 'API key not set' });
//   }

//   try {
//     const response = await fetch(UNREAL_SPEECH_API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${apiKey}`
//       },
//       body: JSON.stringify({
//         Text: text.slice(0, 5000),
//         VoiceId: 'Will',
//         Speed: 0.9,
//         Pitch: 0,
//         OutputFormat: 'mp3'
//       })
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return res.status(502).json({
//         error: 'TTS synthesis failed',
//         message: errorData.message || `HTTP ${response.status}: ${response.statusText}`
//       });
//     }

//     const audioBuffer = await response.arrayBuffer();
//     const base64Audio = Buffer.from(audioBuffer).toString('base64');
//     const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

//     res.json({ audioUrl, originalTextLength: text.length });
//   } catch (error) {
//     res.status(500).json({ error: 'TTS synthesis failed', message: error.message });
//   }
// });

// // Serve static files from dist
// app.use(express.static(path.join(__dirname, 'dist')));

// const PORT = process.env.PORT || 5173;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
//   // 

import { SarvamAIClient } from "sarvamai";



const client = new SarvamAIClient({
  
    apiSubscriptionKey: "SARVAM_API_KEY"
});

const response = await client.textToSpeech.convert({
    text: "hi its me ",


    target_language_code: "hi-IN",
    speaker: "shubh",
    pace: 1.1,
    speech_sample_rate: 22050,
    enable_preprocessing: true,
    model: "bulbul:v3",
    temperature: 0.6
});

console.log(response);