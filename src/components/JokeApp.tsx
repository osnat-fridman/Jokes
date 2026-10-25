"use client";

import { useRef, useState } from "react";
import { requestJoke } from "@/lib/client/requestJoke";
import type { JokeErrorCode } from "@/lib/domain/errors";
import { ERROR_MESSAGES } from "@/lib/ui/messages";
import JokeForm from "./JokeForm";
import JokeResult, { type ResultView } from "./JokeResult";

// Errors about the topic are shown under the field; the rest go in the result card.
const INPUT_ERRORS: JokeErrorCode[] = ["TOPIC_TOO_LONG", "UNSAFE_TOPIC"];

// Until Milestone 3 maps every code, all other card errors share the service message.
const CARD_ERROR_MESSAGE = ERROR_MESSAGES.INTERNAL_ERROR;

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
      setView({ kind: "error", message: CARD_ERROR_MESSAGE });
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
      <JokeResult view={view} />
    </>
  );
}
