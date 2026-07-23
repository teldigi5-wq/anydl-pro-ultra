'use strict';
const https = require('https');

const PROVIDERS = {
  anthropic: {
    host: 'api.anthropic.com',
    path: '/v1/messages',
    model: 'claude-sonnet-5',
    buildHeaders: (apiKey, bodyLen) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': bodyLen
    }),
    buildBody: (model, system, userMessage, maxTokens) => JSON.stringify({
      model, max_tokens: maxTokens, system,
      messages: [{ role: 'user', content: userMessage }]
    }),
    extractText: (parsed) => (parsed.content || []).map(b => b.text || '').join('').trim(),
    extractError: (parsed, statusCode) => parsed?.error?.message || `Anthropic API error (HTTP ${statusCode})`
  },
  groq: {
    // Groq's free tier (no credit card required) via its OpenAI-compatible endpoint.
    // Sign up at https://console.groq.com to get a free key.
    host: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    buildHeaders: (apiKey, bodyLen) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': bodyLen
    }),
    buildBody: (model, system, userMessage, maxTokens) => JSON.stringify({
      model, max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }]
    }),
    extractText: (parsed) => (parsed.choices?.[0]?.message?.content || '').trim(),
    extractError: (parsed, statusCode) => parsed?.error?.message || `Groq API error (HTTP ${statusCode})`
  },
  openrouter: {
    // OpenRouter's free-tier models rotate over time (providers add/retire
    // them without notice — this is what caused the "model unavailable"
    // error). Rather than hardcode one slug that can go stale again, use
    // OpenRouter's own free auto-router, which always resolves to whichever
    // free model is currently actually available.
    host: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    model: 'openrouter/free',
    buildHeaders: (apiKey, bodyLen) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/anydl-pro-ultra',
      'X-Title': 'AnyDL Pro Ultra',
      'Content-Length': bodyLen
    }),
    buildBody: (model, system, userMessage, maxTokens) => JSON.stringify({
      model, max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }]
    }),
    extractText: (parsed) => (parsed.choices?.[0]?.message?.content || '').trim(),
    extractError: (parsed, statusCode) => parsed?.error?.message || `OpenRouter API error (HTTP ${statusCode})`
  }
};

function callLLM(providerId, apiKey, system, userMessage, maxTokens = 500) {
  const provider = PROVIDERS[providerId] || PROVIDERS.anthropic;
  return new Promise((resolve, reject) => {
    const body = provider.buildBody(provider.model, system, userMessage, maxTokens);
    const req = https.request({
      hostname: provider.host,
      path: provider.path,
      method: 'POST',
      headers: provider.buildHeaders(apiKey, Buffer.byteLength(body)),
      timeout: 20000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            return reject(new Error(provider.extractError(parsed, res.statusCode)));
          }
          resolve(provider.extractText(parsed));
        } catch (e) {
          reject(new Error('Could not parse AI API response'));
        }
      });
    });
    req.on('error', (e) => reject(new Error('Network error reaching AI API: ' + e.message)));
    req.on('timeout', () => { req.destroy(); reject(new Error('AI API request timed out')); });
    req.write(body);
    req.end();
  });
}

async function checkApiKey(providerId, apiKey) {
  if (!apiKey) return { ok: false, message: 'No API key set.' };
  try {
    await callLLM(providerId, apiKey, 'Reply with exactly: OK', 'ping', 10);
    const label = providerId === 'groq' ? 'Groq (free tier)' : providerId === 'openrouter' ? 'OpenRouter (free tier)' : 'Anthropic';
    return { ok: true, message: `Connected to ${label} API.` };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

const INTENT_SYSTEM = `You parse a user's freeform download instruction into strict JSON.
Extract exactly this shape, no prose, no markdown fences, JSON only:
{"url": string|null, "resolutionHint": "2160"|"1440"|"1080"|"720"|"480"|"360"|null, "crf": number|null, "audioOnly": boolean, "subtitleLanguages": string[], "reasoning": string}
Rules:
- url: the first real http(s) URL found in the text, else null.
- resolutionHint: the closest standard resolution to what they asked for (e.g. "4K"->"2160", "HD"->"1080"), else null if unspecified.
- crf: lower = higher quality (range 16-32). "archival"/"lossless"/"best" -> 17. "mobile"/"small"/"compressed" -> 28. Unspecified -> null.
- audioOnly: true only if they clearly want audio/music/mp3 only, not video.
- subtitleLanguages: ISO 639-1 codes they mention (e.g. ["en","es"]), else [].
- reasoning: one short plain-English sentence explaining your extraction, for the user to read.`;

async function parseIntent(providerId, apiKey, instruction) {
  const raw = await callLLM(providerId, apiKey, INTENT_SYSTEM, instruction, 400);
  const cleaned = raw.replace(/^```json\s*|```\s*$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI response was not valid JSON — try rephrasing your instruction.');
  }
}

const ERROR_SYSTEM = `You are a calm, precise troubleshooting assistant for a yt-dlp/ffmpeg-based
video downloader desktop app. The user will paste real error/log output from a failed
download. Explain in plain English (3-5 short sentences max) what actually went wrong and
one concrete thing they can try. No markdown headers, no bullet lists, just plain prose.
Do not invent details you can't see in the log.`;

async function explainError(providerId, apiKey, logText) {
  return callLLM(providerId, apiKey, ERROR_SYSTEM, logText.slice(0, 4000), 300);
}

const FILENAME_SYSTEM = `You clean up messy video titles into a tidy, filesystem-safe filename
base (no extension, no quality tag — that gets appended separately). Strip clickbait
punctuation/emoji/hashtags, keep the real meaningful title. Reply with ONLY the cleaned
title text, nothing else.`;

async function suggestFilename(providerId, apiKey, rawTitle) {
  const result = await callLLM(providerId, apiKey, FILENAME_SYSTEM, rawTitle, 60);
  return result.replace(/["*/\\?<>|:]/g, '').trim();
}

const TRANSLATE_SYSTEM = `You translate SRT subtitle files. You will receive real SRT content
(sequence numbers, timestamps, and text). Translate ONLY the spoken text lines into the target
language the user specifies — never translate or alter the sequence numbers or timestamp lines
(format 00:00:00,000 --> 00:00:00,000). Preserve the exact SRT structure and line breaks. Reply
with ONLY the translated SRT content, no commentary, no markdown fences.`;

async function translateSubtitles(providerId, apiKey, srtContent, targetLanguageName) {
  // Real safety cap: very long subtitle files could exceed a reasonable
  // single request. Truncate with an honest note rather than silently
  // dropping content or failing outright.
  const MAX_CHARS = 14000;
  let content = srtContent;
  let truncated = false;
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS);
    truncated = true;
  }
  const userMsg = `Target language: ${targetLanguageName}\n\nSRT content:\n${content}`;
  const result = await callLLM(providerId, apiKey, TRANSLATE_SYSTEM, userMsg, 4000);
  return { translated: result.trim(), truncated };
}

const SUMMARY_SYSTEM = `You summarize a video based on its real caption/subtitle text. Write a
concise 3-5 sentence plain-English summary of what the video actually covers, based only on the
provided captions. Do not invent details not present in the captions. No markdown headers, no
bullet lists, just plain prose.`;

async function summarizeVideo(providerId, apiKey, title, captionText) {
  const MAX_CHARS = 12000;
  const truncated = captionText.length > MAX_CHARS;
  const content = truncated ? captionText.slice(0, MAX_CHARS) : captionText;
  const userMsg = `Video title: ${title}\n\nCaptions:\n${content}`;
  const result = await callLLM(providerId, apiKey, SUMMARY_SYSTEM, userMsg, 300);
  return { summary: result.trim(), truncated };
}

module.exports = { checkApiKey, parseIntent, explainError, suggestFilename, translateSubtitles, summarizeVideo };
