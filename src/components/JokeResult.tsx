import { LOADING_MESSAGE, RESULT_PLACEHOLDER } from "@/lib/ui/messages";
import SmileIcon from "./SmileIcon";
import WarningIcon from "./WarningIcon";
import styles from "./JokeResult.module.css";

export type ResultView =
  | { kind: "placeholder" }
  | { kind: "loading" }
  | { kind: "joke"; joke: string }
  | { kind: "error"; message: string };

export default function JokeResult({ view }: { view: ResultView }) {
  return (
    <section className={styles.section} aria-labelledby="result-title">
      <h2 id="result-title" className={styles.title}>
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
      </div>
    </section>
  );
}
