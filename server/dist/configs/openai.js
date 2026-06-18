"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
const baseURL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
if (!apiKey) {
    throw new Error('Missing Groq API key. Please set GROQ_API_KEY or AI_API_KEY in your environment.');
}
const openai = new openai_1.default({
    apiKey,
    baseURL,
});
exports.default = openai;
