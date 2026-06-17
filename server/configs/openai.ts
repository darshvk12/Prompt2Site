import OpenAI from 'openai';

const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
const baseURL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';

if (!apiKey) {
  throw new Error('Missing Groq API key. Please set GROQ_API_KEY or AI_API_KEY in your environment.');
}

const openai = new OpenAI({
  apiKey,
  baseURL,
});

export default openai;