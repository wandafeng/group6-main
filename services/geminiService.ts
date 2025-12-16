import { GoogleGenAI } from "@google/genai";
import { IngredientType } from "../types";
import { INGREDIENTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRecipeDescription = async (recipe: IngredientType[]) => {
  try {
    const ingredientNames = recipe.map(r => INGREDIENTS[r].name).join(', ');
    const model = 'gemini-2.5-flash';
    const prompt = `I am making a sandwich with these ingredients in order: ${ingredientNames}. 
    Give me a short, fancy, creative name for this sandwich and a one-sentence enthusiastic description like a master chef. 
    Format: "Name: [Name] | Description: [Description]"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The Mystery Stack | A random assortment of deliciousness!";
  }
};

export const generateGameOverMessage = async (score: number, maxScore: number, win: boolean) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = win 
      ? `Congratulate the player for completing the sandwich challenge with a score of ${score}. Be extremely praised.`
      : `Roast the player gently for failing the sandwich game with a score of ${score}. Be funny but encouraging.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    return win ? "Great job Chef!" : "Better luck next time, rookie!";
  }
};
