import { GoogleGenAI } from "@google/genai";
import { Trade } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  if (!apiKey) {
    console.warn("API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeTrades = async (trades: Trade[], customFocus?: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare a summarized version of trades to save tokens and focus context
    const tradeSummary = trades.map(t => ({
      symbol: t.symbol,
      setup: t.setup,
      pnl: t.pnl,
      mistakes: t.mistakes,
      entryTime: t.entryDate.split(' ')[1], // Extract time
      type: t.type,
      status: t.status
    }));

    const focusInstruction = customFocus 
      ? `\nIMPORTANT: The user has explicitly asked you to focus your analysis on: "${customFocus}". Prioritize this aspect above all else.`
      : `\n3. Give me one actionable piece of advice to improve my Profit Factor for next week.`;

    const prompt = `
      You are an elite Trading Coach and Risk Manager. I am providing you with my recent trade log in JSON format.
      
      Your goal is to:
      1. Identify my biggest weakness or recurring mistake.
      2. Highlight my most profitable setup.
      ${focusInstruction}
      
      Here is the data:
      ${JSON.stringify(tradeSummary)}

      Keep the tone professional, direct, and slightly strict, like a hedge fund manager reviewing a junior trader. Format with Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Coach. Please check your API key.";
  }
};