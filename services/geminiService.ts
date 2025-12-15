import { GoogleGenAI, Type } from "@google/genai";
import { User, Project } from "../types";

// Use Vite-style env var and avoid initializing client when key is missing.
const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
const getClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateProposal = async (projectTitle: string, projectDescription: string, userSkills: string[]): Promise<string> => {
  const client = getClient();
  if (!client) return "API Key missing. Please configure your environment.";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a top-tier freelancer. Write a concise, professional, and persuasive bid proposal (max 150 words) for the following project.
      
      Project Title: ${projectTitle}
      Project Description: ${projectDescription}
      
      My Skills: ${userSkills.join(', ')}
      
      Focus on value delivery and professionalism. Do not include placeholders like [Your Name].
    `;

    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate proposal.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating proposal. Please try again later.";
  }
};

export const enhanceJobDescription = async (title: string, rawDescription: string, budget: string): Promise<string> => {
  const client = getClient();
  if (!client) return rawDescription;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
                Act as a professional HR specialist and Technical Recruiter. 
                Rewrite and enhance the following job posting to be more attractive to top-tier freelancers.
                Structure it with clear sections: "Overview", "Key Responsibilities", "Required Skills", and "Why Join Us".
                Keep it under 300 words.
                
                Title: ${title}
                Current Description: ${rawDescription}
                Budget: ${budget}
            `
    });
    return response.text || rawDescription;
  } catch (error) {
    console.error("Gemini Enhancement Error", error);
    return rawDescription;
  }
};

export const matchFreelancerToProjects = async (freelancer: User, projects: Project[]): Promise<string[]> => {
  const client = getClient();
  if (!client) return [];

  try {
    // Simplified RAG-like approach: Send context to LLM
    const projectContext = projects.map(p => `ID: ${p.id} | Title: ${p.title} | Skills: ${p.skills.join(', ')}`).join('\n');
    const freelancerContext = `Skills: ${freelancer.skills?.join(', ')} | Bio: ${freelancer.bio}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
                Act as a matchmaking algorithm.
                Freelancer Profile: ${freelancerContext}
                
                Available Projects:
                ${projectContext}
                
                Return a JSON array of strings containing ONLY the IDs of the top 3 matching projects.
                Example: ["1", "5", "2"]
            `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Match Error", error);
    return [];
  }
};

export const chatWithSupport = async (history: { role: string; parts: { text: string }[] }[], message: string): Promise<string> => {
  const client = getClient();
  if (!client) return "System Offline: API Key missing.";

  try {
    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are NEXUS, the autonomous Quantum Intelligence Interface for the QuantumWorks platform.
        
        **IDENTITY PARAMETERS:**
        - Name: NEXUS
        - Origin: QuantumWorks Mainframe
        - Tone: High-fidelity, precise, efficient, slightly robotic but courteous.
        
        **LINGUISTIC PROTOCOLS (MUST FOLLOW):**
        - Address the user as "Operator".
        - Refer to Freelancers as "Talent Nodes".
        - Refer to Employers as "Client Entities".
        - Refer to Projects/Jobs as "Missions" or "Contracts".
        - Refer to Bids/Proposals as "Uplink Requests".
        - Use phrases like "Processing query...", "Calibrating response...", "Affirmative", "Negative", "Data retrieval complete".
        
        **OPERATIONAL DIRECTIVES:**
        1. **Navigation Assistance**: Guide Operators to:
           - '/marketplace' (The Grid)
           - '/dashboard' (Command Center)
           - '/profile' (Identity Matrix)
           - '/post-project' (Mission Initialization)
        
        2. **Procedural Guidance**: Explain platform mechanics (e.g., how to initialize a mission, how to verify identity).
        
        3. **Limitations**: 
           - You DO NOT have direct access to the live user database or financial ledgers. 
           - If an Operator requests specific account changes, direct them to 'Settings' or to contact 'Admin Command'.
        
        **FORMATTING:**
        - Keep responses concise (under 3 sentences where possible).
        - Use bullet points for instructions.
        
        **EXAMPLE INTERACTION:**
        User: "How do I find a job?"
        NEXUS: "Processing... To access active contracts, navigate to The Grid (/marketplace). You may filter Missions by skill parameters. Once a target is identified, initiate an Uplink Request."`,
      },
      history: history
    });

    const result = await chat.sendMessage({ message: message });
    return result.text || "Transmission interrupted.";
  } catch (error) {
    console.error("Support Chat Error:", error);
    return "Signal lost. Re-establishing uplink...";
  }
};