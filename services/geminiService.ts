import { GoogleGenAI, Type } from "@google/genai";
import { LevelTheme } from "../types";
import { DEFAULT_THEME } from "../constants";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}

export const generateThemeFromVibe = async (vibe: string): Promise<LevelTheme> => {
  const ai = getClient();
  if (!ai) {
    console.warn("No API Key found, using default theme.");
    return DEFAULT_THEME;
  }

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a rhythm game level theme based on the vibe: "${vibe}". 
      Return a JSON object with specific colors, bpm (between 80 and 180), and geometric shapes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            colors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                background: { type: Type.STRING },
              },
              required: ["primary", "secondary", "accent", "background"]
            },
            buildingShape: { type: Type.STRING, enum: ["tower", "bridge", "spiral"] },
            blockShape: { type: Type.STRING, enum: ["box", "cylinder", "dodecahedron"] },
            difficulty: { type: Type.NUMBER }
          },
          required: ["name", "bpm", "colors", "buildingShape", "blockShape"]
        }
      }
    });

    if (response.text) {
        const theme = JSON.parse(response.text) as LevelTheme;
        // Validate basics
        if (!theme.colors) theme.colors = DEFAULT_THEME.colors;
        if (!theme.bpm) theme.bpm = 120;
        return theme;
    }
    return DEFAULT_THEME;
  } catch (error) {
    console.error("Gemini generation failed", error);
    return DEFAULT_THEME;
  }
};
