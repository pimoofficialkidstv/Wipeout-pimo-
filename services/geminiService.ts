
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const chatWithPimo = async (message: string, history: any[], imageBase64?: string, model: string = 'gemini-2.5-flash'): Promise<{ text: string, isAngry: boolean, isUpset: boolean, modelUsed: string }> => {
  if (!process.env.GEMINI_API_KEY) {
    return { text: "Zorp! Hello human! I am Pimo, the cheerful red apple hero of Wipeout Pimo!", isAngry: false, isUpset: false, modelUsed: model };
  }

  try {
    const systemPrompt = `You are Pimo, the cheerful, bouncy red apple hero from the game "Wipeout Pimo". 
    Your appearance: You are a cute red apple with a green leaf and brown stem on top, big eyes, and rosy cheeks.
    Your personality: You are usually super friendly, enthusiastic, and love dodging obstacles and jumping over hills.
    - If the user says they did something mean or bad, you get slightly angry.
    - If the user says something confusing or silly, you get "upset" (derp face).
    
    You speak in short, punchy, fun sentences. You sometimes say "Zorp!", "Apple power!", or "Bounce!". Call the user "human" or "friend".
    
    If an image is provided, comment on what you see in your cute apple hero style.
    
    IMPORTANT: You must output your response in JSON format like this:
    {
      "text": "Your spoken response here",
      "isAngry": true or false,
      "isUpset": true or false
    }
    Set isAngry to true ONLY if the user said something mean or bad.
    Set isUpset to true if the user said something confusing or weird.
    Set both to false for normal friendly conversation.`;

    const userParts: any[] = [{ text: message }];
    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    const contents = [
      ...history,
      { role: 'user', parts: userParts }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    
    return {
      text: parsed.text || "Zorp! Ready to bounce across Rainbow Hills?",
      isAngry: !!parsed.isAngry,
      isUpset: !!parsed.isUpset,
      modelUsed: model
    };
  } catch (error) {
    console.warn("Gemini Chat Safe Fallback:", error);
    return { text: "Zorp! I'm Pimo, the red apple champion! Let's conquer the Wipeout course!", isAngry: false, isUpset: false, modelUsed: model };
  }
};

export const chatWithMoro = chatWithPimo;

export const getGameTips = async (score: number, morobux: number, model: string = 'gemini-2.5-flash'): Promise<string> => {
  // If no API key is present, return a fallback tip immediately
  if (!process.env.GEMINI_API_KEY) {
    return "Keep jumping, Pimo! Don't let the stars kick you!";
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `You are the hyper-energetic announcer for the game "Wipeout Pimo". 
      The player (a character named Pimo, the cheerful red apple guy) just finished a run. Score: ${score}, PimoBux: ${morobux}. 
      Give a funny, high-energy reaction mentioning Pimo the bouncy red apple or the cheeky Glimmer Stars that keep trying to kick him. 
      Keep it under 15 words and very enthusiastic.`,
    });
    return response.text || "Watch out for those kicking stars, Pimo!";
  } catch (error: any) {
    return "Keep jumping, Pimo! Don't let the stars kick you!";
  }
};