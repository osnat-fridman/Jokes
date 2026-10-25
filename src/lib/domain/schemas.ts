import { z } from "zod";
import { ERROR_CODES } from "./errors";

export const JokeRequestSchema = z.strictObject({
  topic: z.string().optional(),
});

export const JokeSuccessResponseSchema = z.object({
  joke: z.string().trim().min(1),
});

export const JokeErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    retryable: z.boolean(),
  }),
});

// Structured Output the model must return.
export const AiJokeOutputSchema = z.object({
  status: z.enum(["ok", "unsuitable"]),
  joke: z.string(),
});

export type JokeRequest = z.infer<typeof JokeRequestSchema>;
export type JokeSuccessResponse = z.infer<typeof JokeSuccessResponseSchema>;
export type JokeErrorResponse = z.infer<typeof JokeErrorResponseSchema>;
export type AiJokeOutput = z.infer<typeof AiJokeOutputSchema>;
