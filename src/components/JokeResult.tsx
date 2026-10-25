"use client";

import { useRef } from "react";
import { LOADING_MESSAGE, RESULT_PLACEHOLDER } from "@/lib/ui/messages";
import SmileIcon from "./SmileIcon";
import WarningIcon from "./WarningIcon";
import styles from "./JokeResult.module.css";

export type ResultView =
  | { kind: "placeholder" }
  | { kind: "loading" }
  | { kind: "joke"; joke: string }
  | { kind: "error"; message: string; retryable: boolean };

type Props = {
  view: ResultView;
  onRetry: () => void;
};

export default function JokeResult({ view, onRetry }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  function handleRetry() {
    // The retry button disappears while loading; keep focus in this section
    // instead of letting it fall back to the top of the page.
    titleRef.current?.focus();
    onRetry();
  }

  return (
    <section className={styles.section} aria-labelledby="result-title">
      <h2 id="result-title" className={styles.title} ref={titleRef} tabIndex={-1}>
        הבדיחה שלכם
      </h2>
      <div className={styles.card}>
        <SmileIcon className={styles.icon} />
        <div aria-live="polite">
          {view.kind === "joke" && <p className={styles.joke}>{view.joke}</p>}
          {view.kind === "loading" && (
            <p className={styles.placeholder}>{LOADING_MESSAGE}</p>
          )}
          {view.kind === "placeholder" && (
            <p className={styles.placeholder}>{RESULT_PLACEHOLDER}</p>
          )}
          {view.kind === "error" && (
            <p className={styles.error}>
              <WarningIcon className={styles.errorIcon} />
              <span>{view.message}</span>
            </p>
          )}
        </div>
        {/* Outside the live region so only the message is announced. */}
        {view.kind === "error" && view.retryable && (
          <button type="button" className={styles.retry} onClick={handleRetry}>
            נסו שוב
          </button>
        )}
      </div>
    </section>
  );
}
