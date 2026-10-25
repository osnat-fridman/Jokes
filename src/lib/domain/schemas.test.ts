import { AiJokeOutputSchema, JokeRequestSchema } from "./schemas";

describe("JokeRequestSchema", () => {
  it("accepts a topic, an empty topic and a missing topic", () => {
    expect(JokeRequestSchema.safeParse({ topic: "חתולים" }).success).toBe(true);
    expect(JokeRequestSchema.safeParse({ topic: "" }).success).toBe(true);
    expect(JokeRequestSchema.safeParse({}).success).toBe(true);
  });

  it("rejects unknown fields and wrong types", () => {
    expect(JokeRequestSchema.safeParse({ topic: "ים", extra: 1 }).success).toBe(false);
    expect(JokeRequestSchema.safeParse({ topic: 5 }).success).toBe(false);
    expect(JokeRequestSchema.safeParse("ים").success).toBe(false);
  });
});

describe("AiJokeOutputSchema", () => {
  it("accepts both statuses", () => {
    expect(AiJokeOutputSchema.safeParse({ status: "ok", joke: "בדיחה" }).success).toBe(true);
    expect(AiJokeOutputSchema.safeParse({ status: "unsuitable", joke: "" }).success).toBe(true);
  });

  it("rejects a missing field or an unknown status", () => {
    expect(AiJokeOutputSchema.safeParse({ status: "ok" }).success).toBe(false);
    expect(AiJokeOutputSchema.safeParse({ status: "maybe", joke: "x" }).success).toBe(false);
    expect(AiJokeOutputSchema.safeParse(null).success).toBe(false);
  });
});
