"use client";

import {
  MAX_TOPIC_LENGTH,
  clampToMaxGraphemes,
  countGraphemes,
} from "@/lib/domain/topic";
import WarningIcon from "./WarningIcon";
import styles from "./JokeForm.module.css";

type Props = {
  topic: string;
  onTopicChange: (topic: string) => void;
  onSubmit: () => void;
  loading: boolean;
  errorMessage?: string;
};

export default function JokeForm({
  topic,
  onTopicChange,
  onSubmit,
  loading,
  errorMessage,
}: Props) {
  const describedBy = errorMessage ? "topic-error topic-counter" : "topic-counter";

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="topic" className={styles.label}>
        נושא לבדיחה
      </label>
      <input
        id="topic"
        name="topic"
        type="text"
        className={`${styles.input} ${errorMessage ? styles.inputError : ""}`}
        placeholder="למשל: חתולים, ים, יום שני"
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={errorMessage ? true : undefined}
        value={topic}
        // Not using maxLength: it counts UTF-16 units, so emoji would count as two.
        onChange={(event) => onTopicChange(clampToMaxGraphemes(event.target.value))}
      />
      <div className={styles.meta}>
        {errorMessage && (
          <p id="topic-error" className={styles.error}>
            <WarningIcon className={styles.errorIcon} />
            <span>{errorMessage}</span>
          </p>
        )}
        <p id="topic-counter" className={styles.counter} dir="ltr">
          {countGraphemes(topic)}/{MAX_TOPIC_LENGTH}
        </p>
      </div>
      <button type="submit" className={styles.button} disabled={loading}>
        צרו לי בדיחה
      </button>
    </form>
  );
}
