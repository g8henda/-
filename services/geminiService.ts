import { GoogleGenAI } from "@google/genai";
import { GameState, Rank, Suit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPokerAdvice = async (gameState: GameState): Promise<string> => {
  try {
    const player = gameState.players.find(p => !p.isHuman === false); // Find human
    if (!player) return "Player not found.";

    const handStr = player.hand.map(c => `${c.rank}${c.suit}`).join(', ');
    const commStr = gameState.communityCards.map(c => `${c.rank}${c.suit}`).join(', ');
    const pot = gameState.pot;
    const costToCall = gameState.currentBet - player.currentBet;
    const stage = gameState.phase;

    const prompt = `
      You are a professional poker coach. The user is playing Texas Hold'em.
      Current Stage: ${stage}
      User's Hand: [${handStr}]
      Community Cards: [${commStr}]
      Pot Size: ${pot} chips
      Cost to Call: ${costToCall} chips
      Opponents Active: ${gameState.players.filter(p => !p.hasFolded && p.id !== player.id).length}
      
      Provide a concise, strategic piece of advice (max 2 sentences). Should I Fold, Check, Call, or Raise? Explain briefly why based on pot odds or hand strength.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Keep a poker face.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm observing the table silently right now. (Service unavailable)";
  }
};