// Topic rules shared by the client and the server.
// Length is measured in grapheme clusters, so an emoji counts as one character.

export const MAX_TOPIC_LENGTH = 50;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

export function countGraphemes(text: string): number {
  return graphemes(text).length;
}

export function clampToMaxGraphemes(
  text: string,
  max: number = MAX_TOPIC_LENGTH,
): string {
  const parts = graphemes(text);
  return parts.length <= max ? text : parts.slice(0, max).join("");
}

export function normalizeTopic(raw: string): string {
  return raw.normalize("NFC").trim();
}

export function isTopicTooLong(topic: string): boolean {
  return countGraphemes(topic) > MAX_TOPIC_LENGTH;
}
