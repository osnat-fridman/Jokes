import JokeForm from "@/components/JokeForm";
import JokeResult from "@/components/JokeResult";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={`${styles.blob} ${styles.blobTop}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blobBottom}`} aria-hidden="true" />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>רגע של צחוק</h1>
          <svg
            className={styles.underline}
            viewBox="0 0 176 16"
            width="176"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 5c26 7 54 9 84 9s58-2 84-9"
              fill="none"
              stroke="var(--laugh-pink)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </header>

        <JokeForm />

        <div className={styles.result}>
          <JokeResult />
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized static WebP */}
        <img
          className={styles.raccoon}
          src="/raccoon.webp"
          alt=""
          width={320}
          height={289}
        />
      </main>
    </div>
  );
}
