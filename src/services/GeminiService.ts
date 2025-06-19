import axios, { AxiosError, AxiosResponse } from 'axios';

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
}

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
}

const GEMINI_API_KEY = 'AIzaSyA04Gxt87yv77Q85rZwai75D3yZKNDCdUg'; // Remplace par ta clé API
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const geminiClient = axios.create({
  baseURL: GEMINI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateText = async (prompt: string): Promise<string> => {
  try {
    const requestData: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const response: AxiosResponse<GeminiResponse> = await geminiClient.post('', requestData);
    const candidate = response.data.candidates[0];
    return candidate?.content.parts[0].text || 'Aucune réponse générée.';
  } catch (error) {
    const err = error as AxiosError;
    console.error('Erreur Gemini API:', err.response ? err.response.data : err.message);
    throw err;
  }
};
