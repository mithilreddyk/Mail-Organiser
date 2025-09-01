import { GoogleGenAI, Type } from "@google/genai";
import type { OrganizedEmailGroup } from '../types';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    if (!process.env.API_KEY) {
        throw new Error("AI Service Error: The API_KEY environment variable is missing. Please ensure it's configured to enable AI features.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
};

const schema = {
    type: Type.ARRAY,
    description: "A list of email groups, where each group belongs to a unique sender.",
    items: {
      type: Type.OBJECT,
      properties: {
        senderName: {
          type: Type.STRING,
          description: "The name of the sender (e.g., 'John Doe').",
        },
        senderEmail: {
          type: Type.STRING,
          description: "The email address of the sender (e.g., 'john.doe@example.com').",
        },
        emails: {
          type: Type.ARRAY,
          description: "A list of emails from this sender.",
          items: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: "The subject line of the email.",
              },
              date: {
                type: Type.STRING,
                description: "The date the email was sent, in ISO 8601 format (e.g., '2024-07-30T10:00:00Z').",
              },
              summary: {
                type: Type.STRING,
                description: "A concise, one-paragraph summary of the email body.",
              },
            },
            required: ["subject", "date", "summary"],
          },
        },
      },
      required: ["senderName", "senderEmail", "emails"],
    },
};


export const organizeEmails = async (emailContent: string): Promise<OrganizedEmailGroup[]> => {
    const prompt = `
        You are an expert email organization assistant.
        Analyze the following block of text which contains one or more emails.
        Extract the sender's name, sender's email address, subject, date, and a concise summary of the email body for each email.
        The date for each email must be in the ISO 8601 format (e.g., '2024-07-30T10:00:00Z').
        Group the results by the sender's email address.
        Provide the output in the structured JSON format defined by the provided schema.
        If you cannot find a piece of information, represent it as an empty string.

        Email Content:
        ---
        ${emailContent}
        ---
    `;

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        // Basic validation
        if (!Array.isArray(parsedJson)) {
            throw new Error("AI returned data in an unexpected format.");
        }

        return parsedJson as OrganizedEmailGroup[];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            // Preserve our specific configuration error message
            if (error.message.startsWith("AI Service Error:")) {
                throw error;
            }
        }
        throw new Error("Failed to organize emails. The AI model might be unable to process the input. Please try again with clearer email content.");
    }
};
