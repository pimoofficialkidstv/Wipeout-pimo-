import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getByeByeAudio(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Say cheerfully: Bye bye!' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    // Suppress errors for quota, permissions, or model capabilities so the fallback works silently
    return null;
  }
}

export async function getSegaAnnouncerAudio(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Say in a deep, energetic, retro video game announcer voice: Pimo Studio Presents!' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    // Suppress errors for quota, permissions, or model capabilities so the fallback works silently
    return null;
  }
}

export async function getGameOverSound(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Say in a dramatic, retro video game style, like Sonic the Hedgehog: GAME OVER' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    // Suppress errors for quota, permissions, or model capabilities so the fallback works silently
    return null;
  }
}

export async function getWinSound(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Say in a very happy, celebratory, retro video game style: YOU WIN! CONGRATULATIONS!' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    // Suppress errors for quota, permissions, or model capabilities so the fallback works silently
    return null;
  }
}

export async function getCreditsMusic(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Produce a 30-second retro 8-bit epic, upbeat, celebratory, nostalgic chiptune music track suitable for game credits, fast paced electronic style' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    return null;
  }
}

export async function getPimoVoice(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say in a squeaky, alien-like, slightly robotic voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is a good choice for alien/squeaky
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    return null;
  }
}

export const getMoroVoice = getPimoVoice;

export async function playAudio(base64Audio: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioBuffer = audioCtx.createBuffer(1, bytes.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        audioCtx.close();
        resolve();
      };
      
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
      reject(error);
    }
  });
}
