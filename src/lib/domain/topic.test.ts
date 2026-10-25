import {
  MAX_TOPIC_LENGTH,
  clampToMaxGraphemes,
  countGraphemes,
} from "./topic";

describe("countGraphemes", () => {
  it("counts Hebrew letters", () => {
    expect(countGraphemes("חתולים")).toBe(6);
  });

  it("counts spaces", () => {
    expect(countGraphemes("יום שני")).toBe(7);
  });

  it("counts an emoji as one character, including combined emoji", () => {
    expect(countGraphemes("😀")).toBe(1);
    expect(countGraphemes("👨‍👩‍👧")).toBe(1);
    expect(countGraphemes("ים 🌊")).toBe(4);
  });

  it("returns 0 for an empty string", () => {
    expect(countGraphemes("")).toBe(0);
  });
});

describe("clampToMaxGraphemes", () => {
  it("keeps text that is within the limit unchanged", () => {
    expect(clampToMaxGraphemes("חתולים")).toBe("חתולים");
  });

  it("cuts text to the first 50 characters", () => {
    const long = "א".repeat(60);
    expect(clampToMaxGraphemes(long)).toBe("א".repeat(MAX_TOPIC_LENGTH));
  });

  it("never splits an emoji", () => {
    const text = "א".repeat(49) + "👨‍👩‍👧👨‍👩‍👧";
    const clamped = clampToMaxGraphemes(text);
    expect(clamped).toBe("א".repeat(49) + "👨‍👩‍👧");
    expect(countGraphemes(clamped)).toBe(50);
  });
});
