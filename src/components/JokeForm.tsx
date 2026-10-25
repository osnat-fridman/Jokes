"use client";

import { useState } from "react";
import {
  MAX_TOPIC_LENGTH,
  clampToMaxGraphemes,
  countGraphemes,
} from "@/lib/domain/topic";
import styles from "./JokeForm.module.css";

export default function JokeForm() {
  const [topic, setTopic] = useState("");

  return (
    <form
      className={styles.form}
      // Joke generation is wired up in Milestone 2.
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="topic" className={styles.label}>
        נושא לבדיחה
      </label>
      <input
        id="topic"
        name="topic"
        type="text"
        className={styles.input}
        placeholder="למשל: חתולים, ים, יום שני"
        autoComplete="off"
        aria-describedby="topic-counter"
        value={topic}
        // Not using maxLength: it counts UTF-16 units, so emoji would count as two.
        onChange={(event) => setTopic(clampToMaxGraphemes(event.target.value))}
      />
      <p id="topic-counter" className={styles.counter} dir="ltr">
        {countGraphemes(topic)}/{MAX_TOPIC_LENGTH}
      </p>
      <button type="submit" className={styles.button}>
        צרו לי בדיחה
      </button>
    </form>
  );
}
