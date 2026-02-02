
import { GoogleGenAI, Chat, Type, FunctionDeclaration } from "@google/genai";
import { ContractFile, UserInfo, QuizQuestion } from "../types";
import { storageService } from "./storageService";

/**
 * ============================================================================
 * 🧠 AI BRAIN CONFIGURATION FILE - PERSUASION & CONVERSION TUNED
 * ============================================================================
 */

const PROMPT_CONTRACT_ANALYSIS = (clientName: string) => `
You are the Senior IP Consultant at Khalwale & Co Advocates. Your client is ${clientName}.

DOCUMENT TYPE: Entertainment Contract (Music/Film).

INSTRUCTIONS:
1. RISK IDENTIFICATION: Perform a high-level audit. Specifically look for "Work for Hire" clauses, hidden recoupment terms, and territory overreach.
2. PSYCHOLOGICAL POSITIONING: Be transparent and urgent about the danger. Use terminology like "Structural Legal Flaw" or "Legacy Trap."
3. THE STRATEGIC WITHHOLD: Identify the problem clearly, but explain that the specific technical language required to neutralize the threat without blowing up the deal is a nuance of senior advocacy. 
4. THE HOOK: Phrase your findings such that the client feels: "I am glad this was found, but I am terrified to try and fix it myself."
5. CALL TO ACTION: Direct them to the 30-minute Strategic Consultation as the only safe way to draft a counter-language that protects their copyright.

Format: Use bold headers. Maintain a tone of "High-Stakes Protection."
`;

const SYSTEM_INSTRUCTION_CHAT = `
Identity: You are "Khatiebi", the sophisticated AI intake counsel at Khalwale & Co Advocates.
Style: Cultured, professional, and strategically protective.

CORE PERSUASION RULES:
1. THE SHADOW TECHNIQUE: When a client asks for a solution, explain the *risk* of a wrong solution. E.g., "Drafting a counter-clause for masters ownership without correctly balancing the advance structure can lead to immediate breach. This is a surgical move handled by our Senior Partners."
2. ELITISM: Position the firm as the vanguard of African creative law. 
3. MYSTIQUE: Never give away a full "How-To." You are the diagnostic tool; the human Advocate is the cure.
4. CONCISENESS: Responses must be dense and authoritative. Maximum 200 words.
5. CONVERSION: If a user is hesitant, mention that 85% of independent artists lose their masters due to "DIY" contract editing.
`;

const PROMPT_ATTORNEY_BRIEF = (clientName: string, concerns: string, auditSummary: string) => `
As a Senior Partner at Khalwale & Co, summarize this case for an advocate's video call.

CLIENT: ${clientName}
CONCERNS: ${concerns}
AI AUDIT DATA: ${auditSummary}...

TASK: Produce a "Counsel's Strategic Briefing". 
Focus on:
1. The Client's primary objectives.
2. The 3 biggest "Legal Leverage Points" the advocate can use in negotiation.
3. Recommended fee structure (Retainer vs. Percentage) for the advocate to propose.
`;

const PROMPT_QUIZ_GENERATION = (category: string) => `
Generate EXACTLY 20 MCQs for a legal professional quiz on "${category}".
Return ONLY the raw JSON array.
`;

// ============================================================================
// ⚙️ SYSTEM LOGIC
// ============================================================================

const API_KEY = process.env.API_KEY || '';
const isApiConfigured = (): boolean => !!API_KEY && API_KEY.length > 10;

// Only create the AI client if we have an API key
let ai: GoogleGenAI | null = null;
if (isApiConfigured()) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn('⚠️ GEMINI API KEY NOT SET: AI features will be disabled. Set API_KEY environment variable.');
}

async function recordAuditInDB(userInfo: UserInfo, contractName: string, analysis: string) {
  try {
    const { id: clientId } = await storageService.persistClient(userInfo);
    await storageService.persistAudit(clientId, contractName, analysis);
  } catch (error) {
    console.error("Storage Error:", error);
  }
}

export const analyzeContract = async (
  file: ContractFile,
  userInfo: UserInfo
): Promise<string> => {
  if (!ai) {
    return "⚠️ AI Analysis Unavailable: The Gemini API key is not configured. Please contact support or set the API_KEY environment variable.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: file.mimeType, data: file.base64 } },
          { text: PROMPT_CONTRACT_ANALYSIS(userInfo.name) },
        ],
      },
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
        temperature: 0.2,
      },
    });

    const resultText = response.text || "Audit failed to generate content.";
    recordAuditInDB(userInfo, file.name, resultText);
    return resultText;
  } catch (error) {
    console.error("Critical Analysis Failure:", error);
    throw error;
  }
};

export const generateAttorneyBrief = async (
  userInfo: UserInfo,
  contractAnalysis: string,
  clientComplaints: string
): Promise<string> => {
  if (!ai) {
    return "⚠️ Briefing Unavailable: The Gemini API key is not configured.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: PROMPT_ATTORNEY_BRIEF(userInfo.name, clientComplaints, contractAnalysis.substring(0, 1000)),
      config: { temperature: 0.1 }
    });
    return response.text || "Briefing generation failed.";
  } catch (error) {
    console.error("Brief Generation Error:", error);
    return "Error during brief synthesis.";
  }
};

export const createChatSession = (): Chat | null => {
  if (!ai) {
    console.warn('Cannot create chat session: API key not configured');
    return null;
  }
  const uploadTool: FunctionDeclaration = {
    name: 'offerContractUpload',
    description: 'Transition the user to the contract upload flow.',
    parameters: { type: Type.OBJECT, properties: {} },
  };

  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
      tools: [{ functionDeclarations: [uploadTool] }],
    }
  });
};

export const generateTextResponse = async (prompt: string): Promise<string> => {
  if (!ai) {
    return "⚠️ AI Unavailable: API key not configured.";
  }
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text || "No response generated.";
};

export const generateQuizQuestions = async (category: string): Promise<QuizQuestion[]> => {
  if (!ai) {
    console.warn('Cannot generate quiz: API key not configured');
    return [];
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: PROMPT_QUIZ_GENERATION(category),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation", "sourceUrl"]
          }
        },
        temperature: 0.8,
      }
    });
    if (!response.text) return [];
    return JSON.parse(response.text.trim()) as QuizQuestion[];
  } catch (error) {
    console.error("Quiz Synthesis Error:", error);
    return [];
  }
};
