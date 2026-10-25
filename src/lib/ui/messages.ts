// Exact user-facing wording from DESIGN.md ("הודעות למשתמש").
import type { JokeErrorCode } from "@/lib/domain/errors";

export const RESULT_PLACEHOLDER = "כאן תופיע הבדיחה שלכם";
export const LOADING_MESSAGE = "רגע, הבדיחה בדרך...";

const SERVICE_ERROR = "משהו השתבש אצלנו. נסו שוב בעוד רגע.";

export const ERROR_MESSAGES: Record<JokeErrorCode, string> = {
  INVALID_REQUEST: "משהו השתבש. רעננו את הדף ונסו שוב.",
  TOPIC_TOO_LONG: "הנושא ארוך מדי. נסו עד 50 תווים.",
  UNSAFE_TOPIC: "על הנושא הזה לא נוכל לכתוב בדיחה. נסו נושא אחר.",
  UNSAFE_OUTPUT: "לא הצלחנו ליצור בדיחה מתאימה הפעם.",
  AI_RATE_LIMITED: SERVICE_ERROR,
  INVALID_AI_RESPONSE: SERVICE_ERROR,
  AI_UNAVAILABLE: SERVICE_ERROR,
  INTERNAL_ERROR: SERVICE_ERROR,
  NETWORK_ERROR: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.",
};
