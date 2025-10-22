import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Wraps the ai.models.generateContent call with a retry mechanism.
 * This is useful for handling transient errors like rate limiting or quota issues.
 * @param params The parameters to pass to generateContent.
 * @param retries The number of times to retry on failure.
 * @param delay The initial delay between retries, which will be doubled on each subsequent retry.
 * @returns The response from generateContent.
 */
const generateContentWithRetry = async (
  params: any, // Using `any` as GenerateContentParameters is not easily importable/constructable.
  retries = 3,
  delay = 1000
): Promise<GenerateContentResponse> => {
  try {
    return await ai.models.generateContent(params);
  } catch (error) {
    if (retries > 0) {
      let errorString = '';
      try {
        errorString = JSON.stringify(error).toLowerCase();
      } catch {
        errorString = String(error).toLowerCase();
      }

      const isQuotaError = 
        errorString.includes('quota') || 
        errorString.includes('rate limit') || 
        errorString.includes('429') ||
        errorString.includes('resource_exhausted');

      if (isQuotaError) {
        console.warn(`API quota error detected. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(res => setTimeout(res, delay));
        return generateContentWithRetry(params, retries - 1, delay * 2); // Exponential backoff
      }
    }
    // If it's not a quota error or retries are exhausted, re-throw the original error.
    throw error;
  }
};

/**
 * Analyzes the uploaded image to determine the type of garment.
 * @param base64ImageData The base64 encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns A string indicating the garment type, e.g., 'full-body' or 'waist-up'.
 */
const analyzeGarmentType = async (
  base64ImageData: string,
  mimeType: string
): Promise<'full-body' | 'waist-up'> => {
  const model = 'gemini-2.5-flash';
  const contents = {
    parts: [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      },
      {
        text: "Analyze the clothing item in this image. Is it a full-length garment that covers the legs (like a dress, gown, or jumpsuit) or is it an upper-body garment (like a t-shirt, top, blouse, or jacket)? Respond with only the text 'full-body' or 'waist-up'.",
      },
    ],
  };

  try {
    const response = await generateContentWithRetry({ model, contents });
    const textResponse = response.text.trim().toLowerCase();
    if (textResponse.includes('full-body')) {
      return 'full-body';
    }
    return 'waist-up';
  } catch (error) {
    console.error("Error analyzing garment type, defaulting to waist-up:", error);
    // Default to a safe option if analysis fails
    return 'waist-up';
  }
};


export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string[]> => {
  const model = 'gemini-2.5-flash-image';

  // Step 1: Analyze the garment to determine framing
  const garmentType = await analyzeGarmentType(base64ImageData, mimeType);
  const framingInstruction = garmentType === 'full-body'
    ? "Capture a full-body view to showcase the entire outfit."
    : "Frame the shot from the waist-up, focusing on the garment.";

  const basePrompt = `Create an ultra-realistic, 4K resolution background for a luxury fashion brand photoshoot, inspired by editorial spreads in Vogue. The user-provided theme is: "${prompt}". The setting should exude minimalist elegance. The lighting should be cinematic and soft. 
  
  **CRITICAL INSTRUCTION**: The garment (including its fabric, color, design, and look) must remain **exactly** as it is in the uploaded image. DO NOT alter the clothing in any way. The original garment is the focus. The model should be facing the camera.`;

  const variations = [
    `Create a version with the model facing the camera with a confident, high-fashion pose. ${framingInstruction}`,
    `Generate another version with the model facing the camera with a relaxed and natural expression. ${framingInstruction}`,
    `Produce a version where the model is interacting subtly with the environment, while still facing the camera. ${framingInstruction}`
  ];

  const generateSingleImage = async (variationPrompt: string): Promise<string> => {
    const contents = {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `${basePrompt} ${variationPrompt}`,
          },
        ],
      };
      const config = {
        responseModalities: [Modality.IMAGE],
      };

    const response = await generateContentWithRetry({ model, contents, config });
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image data found in a single API response.");
  };

  try {
    const imagePromises = variations.map(variation => generateSingleImage(variation));
    const results = await Promise.all(imagePromises);
    return results;
  } catch (error) {
    console.error("Error editing image with Gemini API:", error);

    let errorString = '';
    try {
      errorString = JSON.stringify(error).toLowerCase();
    } catch {
      errorString = String(error).toLowerCase();
    }

    const isQuotaError = 
      errorString.includes('quota') || 
      errorString.includes('rate limit') || 
      errorString.includes('429') ||
      errorString.includes('resource_exhausted');

    if (isQuotaError) {
        throw new Error("The AI is currently busy due to high demand. Please try again in a few moments.");
    }
    
    if (error instanceof Error) {
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    
    throw new Error("An unknown error occurred while editing the image.");
  }
};