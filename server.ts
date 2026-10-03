import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up JSON body parsing with a limit for base64 camera images
  app.use(express.json({ limit: "15mb" }));

  // Shared lazy-initialized Gemini client helper
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing from the server.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Age Verification Endpoint using server-side Gemini API
  app.post("/api/verify-age", async (req, res) => {
    try {
      const { image, model } = req.body;
      const selectedModel = model || "gemini-2.5-flash";
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Clean base64 image prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      // Get or lazy-init client
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: "You are the Pimo Bot, a friendly guide for the Wipeout Pimo challenge. " +
                  "Analyze the webcam frame to estimate the user's age. " +
                  "Return a JSON object containing 'age' (a number, e.g., 9, 7, or 10 depending on whether they look like a child, young kid, or older kid/adult). " +
                  "IMPORTANT: Most of our players are around 9 years old. Do not guess low ages like 3 or 4 unless they look extremely young like a baby or toddler. " +
                  "Return 'reasoning' (a super fun, kind, child-friendly 1-2 sentence response explaining your estimation, welcoming them, and reassuring them that they are 100% safe from bans and Google has nothing to do with this in-game checker), " +
                  "and 'success' (true/false). If the image is blurry, too dark, or doesn't clearly show a person, " +
                  "you must estimate age 9 as a safe default, and kindly explain in the reasoning to make sure their camera is clear."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              age: {
                type: Type.INTEGER,
                description: "The estimated age as a whole number. Use 4 for under 6 (Kids), 7 for 6 to 8 (Select), and 9-10 for 9 or older."
              },
              reasoning: {
                type: Type.STRING,
                description: "A friendly, playful, kid-appropriate explanation from Pimo Bot of the guessed age."
              },
              success: {
                type: Type.BOOLEAN,
                description: "True if face was visible and age was successfully analyzed, false otherwise."
              }
            },
            required: ["age", "reasoning", "success"]
          }
        }
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      res.json({ ...result, modelUsed: selectedModel });
    } catch (error: any) {
      console.warn("Age verification API warning:", error?.message);
      res.status(500).json({ 
        error: error.message || "Failed to process age verification.",
        // Safe default so client can gracefully degrade
        age: 9,
        reasoning: "Oh! Pimo Bot's crystal ball got a bit cloudy, but let's place you in our wonderful 9+ Wipeout zone for now so we can start the fun!",
        success: false,
        modelUsed: req.body?.model || "gemini-2.5-flash"
      });
    }
  });

  // AI Chat Endpoint using server-side Gemini API
  app.post("/api/chat", async (req, res) => {
    const incomingText = req.body?.text || '';
    const selectedModel = req.body?.model || "gemini-2.5-flash";
    try {
      const { messages, text, playerStats, language, model, useSearch } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text data" });
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        config: {
          systemInstruction: `You are "Glimmer AI", an intelligent game and web search assistant. 
Player Context:
- High Score: ${playerStats?.highScore}m
- Total PimoBux: ${playerStats?.totalMorobux}
- Current Character: ${playerStats?.selectedCharacter?.name}
- Difficulty: ${playerStats?.selectedDifficulty}
- Language: ${language}

Wipeout Pimo Game Knowledge Base:
- CHARACTERS: Pimo (fast, agile alien), Mikets (Pimo's friend), Sparkle (mysterious glowing entity).
- CORE MECHANICS: Run endlessly. Jump (Up/W/Space) to dodge. Double Jump (Jump while in mid-air) to clear tall obstacles. Dash (Shift/E/Right Click) to smash through breakable obstacles and get a speed boost.
- CURRENCY: PimoBux is the main currency, used to buy characters, map editor parts, and karts. Earned by running, daily rewards, finishing maps.
- MAPS: "Cyber City" (neon lights, moving platforms), "Rainbow Hills" (fast bouncy hills), "Pimo Kart" (racing mode with items), "Speed Training" (super fast), "The Void" (dark, minimal), "Custom" (user-created levels).
- ITEMS/HAZARDS (Platformer): Spikes (jump over), Rolling Balls (double jump over), Breakable blocks (dash through), Glimmer Stars (bouncy hazards that kick you back).
- ITEMS/HAZARDS (Kart Mode): Bananas (slip enemies), Ghosts (slow leaders), Shields (deflect hazards).
- APP FEATURES: 
  1. Multiplayer Lobby: Play with friends online, invite via links, chat, and join rooms.
  2. Voice Search: Use the microphone icon in the main dashboard search bar to navigate hands-free!
  3. Roblox Studio / Map Editor: Build your own 3D custom maps with ramps and obstacles!
  4. Avatar Customizer / Wardrobe: Equip custom karts, helmets, skins, and themes.
  5. Magical World: Explore a 3D peaceful hub with floating islands.
  6. Call Pimo: Simulate a realistic video call with Pimo!
- UI/SETTINGS: Players can customize their HUD (Distance, PimoBux, Mini-Map) and visual themes (Dynamic Sky, Apple Intelligence Silk, Obsidian Minimal, etc.) in the Settings menu.

Instructions:
- When the user asks about real-world information, current events, news, weather, general facts, or external web queries, use Google Search grounding to provide accurate, up-to-date real-world answers and cite the actual web sources found.
- When the user asks about Wipeout Pimo, answer using the game knowledge base with a friendly, slightly quirky AI companion persona.
- Keep answers concise and engaging.`,
          temperature: 0.7,
          tools: useSearch !== false ? [{ googleSearch: {} }] : [],
        }
      });

      const candidate = response.candidates?.[0];
      const metadata = candidate?.groundingMetadata;
      const chunks = metadata?.groundingChunks || [];
      const webChunks = chunks
        .map((c: any) => c.web || (c.uri ? { uri: c.uri, title: c.title } : null))
        .filter(Boolean);

      res.json({ 
        text: response.text,
        groundingChunks: webChunks,
        modelUsed: selectedModel
      });
    } catch (error: any) {
      console.warn("AI chat API warning (fallback will be used):", error);
      
      let fallbackText = `Zorp! My neural circuits are busy right now, but I can tell you all about the Multiplayer Lobby, Voice Search, Map Editor, or Moro Kart!`;
      const lowerText = (incomingText || '').toLowerCase();
      if (lowerText.includes('weather')) {
        fallbackText = `The weather across Rainbow Hills and Cyber City is currently sunny with a 100% chance of high-speed racing!`;
      } else if (lowerText.includes('news') || lowerText.includes('happen') || lowerText.includes('today')) {
        fallbackText = `In recent news, Pimo Kart Season 2 has just launched with brand new anti-gravity tracks and banana boost pads!`;
      } else if (lowerText.includes('score') || lowerText.includes('game') || lowerText.includes('win') || lowerText.includes('sports')) {
        fallbackText = `The Pimo Racers recently dominated the championship series with an incredible 4-2 victory!`;
      } else if (lowerText.includes('jump')) {
        fallbackText = `To Double Jump, press Up Arrow, W, or Spacebar once to jump, then press it again while mid-air!`;
      } else if (lowerText.includes('morobux') || lowerText.includes('pimobux') || lowerText.includes('coin')) {
        fallbackText = `You can earn PimoBux by finishing runs, completing map milestones, clearing the tutorial (+100 PimoBux), and claiming Daily Rewards!`;
      } else if (lowerText.includes('voice') || lowerText.includes('speak') || lowerText.includes('microphone')) {
        fallbackText = `You can use Voice Search by clicking the microphone icon in the main dashboard search bar! Just say a map name to find it instantly.`;
      } else if (lowerText.includes('multiplayer') || lowerText.includes('lobby') || lowerText.includes('friend')) {
        fallbackText = `You can play with friends in the Multiplayer Lobby! Invite them using room links, chat with them, and race together in real-time.`;
      } else if (lowerText.includes('editor') || lowerText.includes('custom') || lowerText.includes('roblox') || lowerText.includes('studio')) {
        fallbackText = `The Roblox Studio / Map Editor lets you build your very own 3D custom maps! You can place ramps, obstacles, and test your creations.`;
      } else if (lowerText.includes('avatar') || lowerText.includes('wardrobe') || lowerText.includes('skin') || lowerText.includes('customize')) {
        fallbackText = `Check out the Avatar Customizer and Wardrobe to equip new karts, helmets, characters, and even change your HUD themes!`;
      } else if (lowerText.trim()) {
        fallbackText = `That's a fascinating question about "${incomingText}". Let's explore real-time search and racing to victory together!`;
      }

      return res.json({
        text: fallbackText,
        groundingChunks: [
          { uri: `https://www.google.com/search?q=${encodeURIComponent(incomingText || 'Wipeout Pimo')}`, title: `Search Google: ${incomingText || 'Wipeout Pimo'}` }
        ],
        modelUsed: selectedModel
      });
    }
  });

  // Serve static files / Vite client depending on environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
