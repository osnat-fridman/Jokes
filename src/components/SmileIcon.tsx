// Decorative only: hidden from assistive technology and never focusable.
export default function SmileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width="44"
      height="44"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="var(--laugh-pink)"
        stroke="var(--deep-cocoa)"
        strokeWidth="2.5"
      />
      <circle cx="17" cy="20" r="2.5" fill="var(--deep-cocoa)" />
      <circle cx="31" cy="20" r="2.5" fill="var(--deep-cocoa)" />
      <path
        d="M15 28c2.5 4 5.5 6 9 6s6.5-2 9-6"
        fill="none"
        stroke="var(--deep-cocoa)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
