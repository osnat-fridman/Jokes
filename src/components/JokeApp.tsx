"use client";

import { useRef, useState } from "react";
import { requestJoke } from "@/lib/client/requestJoke";
import { ERRORS, type JokeErrorCode } from "@/lib/domain/errors";
import { ERROR_MESSAGES } from "@/lib/ui/messages";
import JokeForm from "./JokeForm";
import JokeResult, { type ResultView } from "./JokeResult";

// Errors about the topic are shown under the field; the rest go in the result card.
const INPUT_ERRORS: JokeErrorCode[] = ["TOPIC_TOO_LONG", "UNSAFE_TOPIC"];

// All state lives in memory only and is gone on refresh.
export default function JokeApp() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ResultView>({ kind: "placeholder" });
  const [inputError, setInputError] = useState<string>();
  const inFlight = useRef(false);

  function handleTopicChange(next: string) {
    setTopic(next);
    setInputError(undefined);
  }

  async function handleSubmit() {
    if (inFlight.current) return;
    inFlight.current = true;

    // Kept so an input error can restore what the card showed before.
    const previousView = view;
    setLoading(true);
    setInputError(undefined);
    setView({ kind: "loading" });

    const result = await requestJoke(topic);

    if (result.ok) {
      setView({ kind: "joke", joke: result.joke });
    } else if (INPUT_ERRORS.includes(result.code)) {
      setInputError(ERROR_MESSAGES[result.code]);
      setView(previousView);
    } else {
      setView({
        kind: "error",
        message: ERROR_MESSAGES[result.code],
        retryable: ERRORS[result.code].retryable,
      });
    }

    setLoading(false);
    inFlight.current = false;
  }

  return (
    <>
      <JokeForm
        topic={topic}
        onTopicChange={handleTopicChange}
        onSubmit={handleSubmit}
        loading={loading}
        errorMessage={inputError}
      />
      {/* Retry sends whatever is in the field at that moment (DESIGN.md). */}
      <JokeResult view={view} onRetry={handleSubmit} />
    </>
  );
}
