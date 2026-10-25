import SmileIcon from "./SmileIcon";
import styles from "./JokeResult.module.css";

export default function JokeResult({ joke }: { joke?: string }) {
  return (
    <section className={styles.section} aria-labelledby="result-title">
      <h2 id="result-title" className={styles.title}>
        הבדיחה שלכם
      </h2>
      <div className={styles.card}>
        <SmileIcon className={styles.icon} />
        {joke ? (
          <p className={styles.joke}>{joke}</p>
        ) : (
          <p className={styles.placeholder}>כאן תופיע הבדיחה שלכם</p>
        )}
      </div>
    </section>
  );
}
