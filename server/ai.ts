import OpenAI from "openai";
import { type InsertTerm } from "@db/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

console.log("Initializing OpenAI client...");
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY.trim()
});

function detectSpamPatterns(text: string): boolean {
  // Check for excessive repetition
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // If any word appears more than 30% of total words, likely spam
  const maxFreq = Math.max(...Array.from(wordFreq.values()));
  if (maxFreq > words.length * 0.3) {
    return true;
  }

  return false;
}

export async function moderateContent(term: InsertTerm): Promise<{
  isApproved: boolean;
  moderationNote?: string;
}> {
  try {
    console.log("Starting content moderation for term:", term.term);

    // Check for spam patterns first
    if (detectSpamPatterns(term.definition) || detectSpamPatterns(term.example)) {
      return {
        isApproved: false,
        moderationNote: "[SPAM] Detected repetitive patterns or potential spam content"
      };
    }

    // Calculate total content length
    const totalLength = term.term.length + term.definition.length + term.example.length;
    const MAX_TOTAL_LENGTH = 300; // Conservative limit to prevent API abuse

    if (totalLength > MAX_TOTAL_LENGTH) {
      return {
        isApproved: false,
        moderationNote: "[LENGTH] Content exceeds maximum allowed length. Please be more concise."
      };
    }

    // Concatenate all content for moderation
    const content = `Term: ${term.term}\nDefinition: ${term.definition}\nExample: ${term.example}`;

    console.log("Sending moderation request to OpenAI...");
    const moderation = await openai.moderations.create({ input: content });
    const result = moderation.results[0];
    console.log("Received moderation response:", result);

    // Get all flagged categories if any
    const flaggedCategories = Object.entries(result.category_scores)
      .filter(([_, score]) => score > 0.1) // Lower threshold to catch more potential issues
      .map(([category, score]) => `${category} (${Math.round(score * 100)}% confidence)`)
      .join(", ");

    // If OpenAI flags anything, send for manual review
    if (result.flagged || flaggedCategories) {
      return {
        isApproved: false,
        moderationNote: `[AI] Content was flagged for: ${flaggedCategories}`
      };
    }

    // Check for potential profanity using chat completion
    try {
      const profanityCheck = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a profanity detector. Respond with JSON indicating if the input contains any profanity, slurs, or offensive language. Format: { \"containsProfanity\": boolean, \"reason\": string }"
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" }
      });

      const profanityResult = JSON.parse(profanityCheck.choices[0].message.content);

      if (profanityResult.containsProfanity) {
        return {
          isApproved: false,
          moderationNote: `[PROFANITY] ${profanityResult.reason}`
        };
      }
    } catch (error) {
      console.error("Error during profanity check:", error);
      // If profanity check fails, err on the side of caution
      return {
        isApproved: false,
        moderationNote: "[ERROR] Manual review required - unable to complete profanity check",
      };
    }

    // Only approve if it passes both OpenAI moderation and profanity check
    return {
      isApproved: true
    };
  } catch (error) {
    console.error("AI moderation error:", error);
    // If AI moderation fails, we'll need manual review
    return {
      isApproved: false,
      moderationNote: "[ERROR] Requires manual review due to AI service error",
    };
  }
}