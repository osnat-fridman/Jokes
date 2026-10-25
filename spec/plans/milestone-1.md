# תוכנית Milestone 1 - בסיס הפרויקט והממשק המאושר

מקורות: `MILESTONES.md` (Milestone 1), `ARCHITECTURE.md` (סעיפים 1, 2.2–2.4, 4, 5.4), `DESIGN.md` (כל המסמך), `wireframes.png`, `mockups.png`, `style-guide.png`, `raccoon.png`.

מצב נוכחי: אין עדיין קוד בפרויקט. בשורש יש רק `CLAUDE.md`, `.gitignore`, `spec/` ו-`.obsidian/`. מותקנים Node.js 24.22.1 ו-npm 11.19.1. הגרסה העדכנית של Next.js 16 היא 16.4.3.

## 1. מטרה וגבולות

**בתוך הטווח:**
- פרויקט Next.js 16 (App Router) + React 19 + TypeScript 5.x שרץ מקומית.
- המסך היחיד, מעוצב לפי ה-Mockup וה-Style Guide, בעברית וב-RTL.
- שדה נושא עם מונה תווים חי וחסימה ב-50 תווים (Grapheme Clusters) — כדי שהרכיבים "יפעלו ברמת UI בסיסית".
- שלד מינימלי לשכבות: Domain, ‏Backend Route ו-OpenAI Adapter (קבצי Stub בלבד, ללא לוגיקה).
- Scripts ל-Lint, ‏Type Check, ‏Tests ו-Build, וכמה בדיקות בסיסיות.
- `.env.example` ועותק `.env`.

**מחוץ לטווח (ייבנה ב-Milestones הבאים):**
- קריאה ל-OpenAI, ‏Zod, ‏Moderation, מצבי loading/success/error אמיתיים (Milestone 2).
- הודעות שגיאה, "נסו שוב", Security Headers, בדיקת Origin, ‏Playwright (Milestone 3).
- Manifest, אייקוני PWA, ‏`aria-live` מלא, ‏GitHub Actions (Milestone 4).
- Vercel ופריסה (Milestone 5).

לחיצה על "צרו לי בדיחה" ב-Milestone זה לא שולחת בקשה ולא משנה את המסך (מונעת רענון דף בלבד).

## 2. הקמת הפרויקט

`create-next-app` מסרב לרוץ בתיקייה שכבר יש בה קבצים (`CLAUDE.md`, `spec/`), ולכן:

1. מריצים בתיקיית ה-scratchpad:
   `npx create-next-app@16.4.3 jokes --ts --eslint --app --src-dir --no-tailwind --import-alias "@/*" --use-npm --turbopack`
   (אם דגל כלשהו השתנה בגרסה — מתאימים לפי `--help`, באותה כוונה: TypeScript, ‏ESLint, ‏App Router, ‏`src/`, בלי Tailwind.)
2. מעתיקים לשורש הפרויקט את: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `src/`.
3. **לא** מעתיקים את ה-`.gitignore` של התבנית ולא את ה-`README.md`. מוסיפים ל-`.gitignore` הקיים רק מה שחסר בו: `next-env.d.ts`.
4. מוחקים מתוכן התבנית את קובצי הדוגמה (לוגו Next, ‏`page.module.css` הדיפולטי, SVGs ב-`public/`) ומחליפים בקוד שלנו.
5. מריצים `npm install` בשורש כדי ש-`package-lock.json` יתאים, ואז מוודאים ש-`npm ci` עובר.

### Node ו-npm
- `.nvmrc` עם `24`.
- ב-`package.json`: `"engines": { "node": "24.x" }`.

### תלויות נוספות (devDependencies)
- `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@types/jest`.
- הגדרת Jest דרך `next/jest` (`jest.config.ts`) + `jest.setup.ts` שמייבא את `@testing-library/jest-dom`.
- `sharp` — רק לסקריפט חד-פעמי להקטנת הדביבון (ראו סעיף 5). אם כבר זמין דרך Next, לא מוסיפים.

לא מוסיפים: Zod, ‏openai, ‏Playwright (ייכנסו כשיידרשו), ספריות UI, אייקונים או Tailwind.

### Scripts ב-`package.json`
| Script | פקודה |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `jest` |

## 3. מבנה קבצים

```text
.nvmrc
.env.example                     # OPENAI_API_KEY= / OPENAI_MODEL=  (ללא ערכים)
.env                             # עותק חד-פעמי של .env.example; המשתמש ממלא
jest.config.ts
jest.setup.ts
public/
  raccoon.webp                   # גרסה מוקטנת ודחוסה של spec/raccoon.png
src/
  app/
    layout.tsx                   # <html lang="he" dir="rtl">, גופן Rubik, metadata בסיסי
    globals.css                  # משתני צבע, reset, רקע Warm White, focus כללי
    page.tsx                     # המסך היחיד (Server Component שמרכיב את הרכיבים)
    page.module.css              # עמודה, רווחים, blobs דקורטיביים, מיקום הדביבון
    api/jokes/route.ts           # Stub: POST מחזיר 501, ייבנה ב-Milestone 2
  components/
    JokeForm.tsx                 # 'use client' — תווית, שדה, מונה, כפתור
    JokeForm.module.css
    JokeResult.tsx               # כותרת "הבדיחה שלכם" + כרטיס + אייקון חיוך
    JokeResult.module.css
    SmileIcon.tsx                # SVG דקורטיבי (aria-hidden)
  lib/
    domain/topic.ts              # MAX_TOPIC_LENGTH = 50, countGraphemes, clampToMaxGraphemes
    openai/adapter.ts            # Stub: חתימת generateJoke שזורקת "not implemented"
  __tests__/ (או לצד הקבצים)
    topic.test.ts
    JokeForm.test.tsx
    page.test.tsx
```

`StatusMessage` (מהחלוקה ב-ARCHITECTURE 2.3) לא נוצר עדיין — אין בו שימוש לפני Milestone 2–3.

## 4. מימוש המסך

### 4.1 Layout (`layout.tsx`, ‏`globals.css`)
- `<html lang="he" dir="rtl">`.
- Rubik דרך `next/font/google`, ‏`subsets: ['hebrew', 'latin']`, ‏`weight: ['400','600','800']`, ‏`display: 'swap'`, מוחל על `body`.
- `metadata`: ‏`title: "רגע של צחוק"`, ‏`description` קצר בעברית. בלי Manifest ואייקונים (Milestone 4).
- משתני CSS ב-`:root` לפי ה-Color Palette:
  `--laugh-pink #F47FA8`, ‏`--warm-mauve #987D84`, ‏`--deep-cocoa #3A3034`, ‏`--warm-cream #F8EEE8`, ‏`--soft-blush #FAD9E5`, ‏`--warm-white #FFFDFB`, ‏`--berry-red #B3264B`, ‏`--cocoa-muted #6E5A60`.
- `body`: רקע Warm White, טקסט Deep Cocoa, ‏`margin: 0`, ‏`overflow-x: hidden` לא משמש כפתרון — הפריסה עצמה לא תגלוש.
- אין Dark Mode, אין גרדיאנטים.
- Focus כללי: `:focus-visible { outline: 3px solid var(--deep-cocoa); outline-offset: 2px; }`.

### 4.2 עמודה ומבנה (`page.tsx`, ‏`page.module.css`)
- `<main>` כעמודה יחידה: `max-width: 480px`, ממורכזת (`margin-inline: auto`), ‏padding צדדי `16px` במובייל ו-`24px` מרוחב 400px ומעלה; ‏padding עליון `32px`.
- סדר: `<h1>` → `JokeForm` → `JokeResult` → הדביבון.
- רווחים לפי Grid של 8px: ‏`32px` בין הכותרת לטופס, `24px` בין השדה לכפתור, `32px`–`48px` בין הכפתור לאזור התוצאה (כמו ב-Mockup).
- **כותרת:** `<h1>` "רגע של צחוק", ‏40/48, משקל 800, ממורכזת. מתחתיה קו ורוד מעוגל בצורת חיוך עדין — SVG קטן (`aria-hidden`) בצבע Laugh Pink, בעובי ~4px עם `stroke-linecap: round`, ברוחב ~170px.
- **צורות רקע:** 2 Blobs רכים בצבע Soft Blush (פינה עליונה-שמאלית, ומאחורי הדביבון בפינה התחתונה), כ-`::before`/`::after` או `<div aria-hidden>` עם `position: absolute`, ‏`pointer-events: none` ו-`z-index` מתחת לתוכן. חייבות להיות חתוכות בתוך גבולות המסך (`overflow: hidden` על המעטפת) כדי לא ליצור גלישה אופקית. ה-Blobs שמחוץ למסגרת הטלפון ב-Mockup הם חלק מהמצגת ולא ממומשים.

### 4.3 `JokeForm` (Client Component)
- `<form>` עם `onSubmit` שמבצע `preventDefault()` בלבד (Milestone 2 יחבר את השליחה).
- `<label htmlFor="topic">` "נושא לבדיחה" — 14/20, משקל 600, יישור לימין.
- `<input id="topic" type="text">`:
  - `placeholder="למשל: חתולים, ים, יום שני"` בצבע Cocoa Muted.
  - שורה אחת, גובה מינימלי 56px (Target Size נוח), פינות ‎16px, מסגרת ‎2px Warm Mauve, רקע Warm White, טקסט 16px.
  - `autoComplete="off"`.
  - **ללא** `maxLength` של HTML (ARCHITECTURE 2.2). במקום זה, ב-`onChange` מעבירים את הערך דרך `clampToMaxGraphemes(value, 50)` — זה מכסה גם הקלדה וגם הדבקה (טקסט ארוך נחתך ל-50 הראשונים).
  - `aria-describedby` שמצביע על המונה.
- מונה: `<p id="topic-counter">` בפורמט `{count}/50`, ‏14/20 משקל 600 (Label), צבע Cocoa Muted, מתחת לשדה בצד **שמאל** (`text-align: left`), עם `dir="ltr"` כדי שיוצג `6/50`. הספירה ב-`countGraphemes` של הערך הנוכחי (כולל רווחים).
- `<button type="submit">` "צרו לי בדיחה": רוחב מלא, גובה מינימלי 56px, רקע Laugh Pink, טקסט Deep Cocoa מודגש (600–800) וממורכז, מסגרת ‎2px Deep Cocoa, רדיוס ‎18px, צל רך (כמו ב-Mockup). מצבי Hover/Active עדינים באותה שפה (למשל הכהיה קלה / הזזה של 1px), Focus לפי הכלל הכללי. סגנון Disabled (שקיפות 60%) מוגדר כבר ב-CSS אבל לא בשימוש עדיין.

### 4.4 `JokeResult`
- `<section aria-labelledby="result-title">`.
- `<h2 id="result-title">` "הבדיחה שלכם" — 24/32, משקל 600, יישור לימין.
- כרטיס: רקע Warm Cream, מסגרת ‎2px Warm Mauve, רדיוס ‎20px, צל מינימלי ורך, padding ‎24px, ‏`min-height` מתון (~160px) ללא גובה קשיח — גדל עם התוכן.
- בתוך הכרטיס: `<p>` עם `כאן תופיע הבדיחה שלכם` בצבע Cocoa Muted, Body ‏16/26, יישור לימין.
- `SmileIcon`: עיגול Laugh Pink עם קו מתאר Deep Cocoa ופרצוף חיוך בקו (כמו ב-Mockup וב-Style Guide), ‎~44px, בפינה השמאלית-עליונה של הכרטיס (`position: absolute; inset-inline-end`), ‏`aria-hidden="true"`, ‏`focusable="false"`. יש להשאיר מרווח פנימי כדי שהטקסט לא ייכנס מתחת לאייקון.
- הרכיב מקבל כבר עכשיו Prop פשוט לטקסט (`joke?: string`) — אם אין, מוצג טקסט ההמתנה. כך Milestone 2 רק יעביר ערך.

> **החלטה לאישורך:** טבלת "מצבי מסך" ב-DESIGN מזכירה את אייקון החיוך רק במצב הצלחה, אבל ה-Mockup (המראה הסופי) וה-Milestone הזה דורשים להציג אותו. בתוכנית הוא מוצג גם במצב ההתחלתי. אם עדיף שיופיע רק אחרי שיש בדיחה — תגידי ואשנה.

### 4.5 הדביבון
- `<img src="/raccoon.webp" alt="" width height>` (או `next/image` עם `unoptimized`) — דקורטיבי, ‏`alt=""`.
- ממוקם מתחת לכרטיס, בצד הימני-מרכזי כמו ב-Mockup, ברוחב תצוגה ~160px (במובייל צר ~140px), עם Blob של Soft Blush מאחוריו. נוגע בתחתית הכרטיס בלי לכסות את הטקסט שבו.
- `loading="lazy"` לא נדרש (מעל ה-fold בדסקטופ); מגדירים `width`/`height` למניעת קפיצת פריסה.

## 5. הכנת תמונת הדביבון

- המקור `spec/raccoon.png` הוא 1321×1191 (~1MB).
- סקריפט חד-פעמי (מורץ מה-scratchpad, לא נשמר בפרויקט) עם `sharp`: הקטנה לרוחב 320px (פי 2 מגודל התצוגה), המרה ל-WebP באיכות ~80 עם שמירת השקיפות, שמירה ל-`public/raccoon.webp`.
- יעד: קובץ של עשרות KB בודדות. מוודאים בעין שהשקיפות נשמרה.
- `spec/raccoon.png` נשאר ללא שינוי.

## 6. Stubs לשכבות העתידיות

- `src/lib/domain/topic.ts` — **קוד אמיתי** (משמש כבר עכשיו את המונה):
  - `MAX_TOPIC_LENGTH = 50`.
  - `countGraphemes(text)` עם `Intl.Segmenter(undefined, { granularity: 'grapheme' })`.
  - `clampToMaxGraphemes(text, max)` — מחזיר את `max` ה-Graphemes הראשונים.
  - הקובץ לא תלוי ב-React, כדי שהשרת ישתמש באותה ספירה ב-Milestone 2.
- `src/app/api/jokes/route.ts` — `export async function POST()` שמחזיר `501` עם `Cache-Control: no-store`. הערה: נבנה ב-Milestone 2. ה-UI לא קורא לו.
- `src/lib/openai/adapter.ts` — חתימת `generateJoke(topic: string): Promise<string>` שזורקת `Error('Not implemented')`. בלי ייבוא של `openai`.

## 7. משתני סביבה ו-Git

- `.env.example`:
  ```text
  OPENAI_API_KEY=
  OPENAI_MODEL=
  ```
- העתקה חד-פעמית ל-`.env` (`cp .env.example .env`). **לא** קוראים את `.env` אחר כך. הערכים ימולאו על ידך ב-Milestone 2.
- `.gitignore`: מוסיפים `next-env.d.ts`. לא מסירים כלום. `.env` כבר מוחרג; מוודאים עם `git check-ignore .env`.
- אין commit.

## 8. בדיקות אוטומטיות (בסיסיות)

- `topic.test.ts`:
  - ספירת מחרוזת עברית ("חתולים" = 6).
  - אימוג'י נספר כתו אחד (כולל אימוג'י מורכב כמו 👨‍👩‍👧).
  - רווחים נספרים.
  - `clampToMaxGraphemes` חותך ל-50 בלי לשבור אימוג'י.
- `JokeForm.test.tsx`:
  - לשדה יש Accessible Name "נושא לבדיחה"; לכפתור "צרו לי בדיחה".
  - הקלדה מעדכנת את המונה (`6/50`).
  - הדבקה של 60 תווים משאירה 50 והמונה מציג `50/50`.
  - לחיצה על הכפתור לא זורקת שגיאה ולא משנה את המסך.
- `page.test.tsx` (או בדיקת רכיב מקבילה):
  - מוצגים: הכותרת (`h1`), התווית, הכפתור, הכותרת "הבדיחה שלכם" והטקסט `כאן תופיע הבדיחה שלכם`.
  - הדביבון והחיוך מוסתרים מקורא מסך (`alt=""` / `aria-hidden`).
  - סדר Tab: שדה ← כפתור.

## 9. בדיקה עצמית בסיום הבנייה

1. `npm ci`, ‏`npm run lint`, ‏`npm run typecheck`, ‏`npm test`, ‏`npm run build` — כולם עוברים.
2. מריצים `npm run dev` ובודקים בדפדפן המובנה:
   - רוחב 320px, ‏375px (Mobile), 768px ו-1280px (Desktop): צילום מסך, השוואה ל-Mockup, ובדיקה עם JavaScript ש-`document.documentElement.scrollWidth <= clientWidth` (אין גלישה אופקית) ושאף רכיב לא נחתך.
   - Tab מהמקלדת מגיע לשדה ואז לכפתור, וה-Focus נראה.
   - הקלדה והדבקה של טקסט ארוך — נעצר ב-50, המונה מתעדכן.
   - ב-DevTools / JS: אין Cookies, ‏`localStorage` ו-`sessionStorage` ריקים, אין בקשות רשת לשרתי Google Fonts או לשירותי Analytics.
3. בודקים שאין Secret בקבצים שנוספו (`git status`, חיפוש `sk-`).
4. עוצרים את השרת.
5. מעדכנים ב-`CLAUDE.md` את "פקודות הרצה": dev = `npm run dev`, test = `npm test`.
6. מסמנים 🟡 ליד כותרת Milestone 1 ב-`MILESTONES.md`.
7. ADR ב-`ARCHITECTURE.md` — רק אם התקבלה החלטה טכנית משמעותית שלא כתובה ב-spec (למשל אם `create-next-app` כפה מבנה אחר מהמתוכנן).

## 10. מיפוי ל-Definition of Done

| תנאי | איך מתקיים / נבדק |
|---|---|
| `npm ci`, ‏Lint, ‏Type Check ו-Build עוברים | סעיף 9.1 |
| כל רכיבי ה-Wireframe/Mockup, בלי מסכים או פעולות נוספות | סעיף 4; עמוד יחיד, בלי ניווט |
| המראה תואם ל-DESIGN (צבעים, Typography, RTL, דביבון) | סעיפים 4–5; השוואת צילומי מסך ל-Mockup |
| נבדק ב-320px, ‏Mobile ו-Desktop, בלי גלישה אופקית | סעיף 9.2 |
| שדה וכפתור נגישים במקלדת עם Accessible Name | סעיפים 4.3, 8, 9.2 |
| אין Analytics, ‏Auth, ‏Database, ‏Local Storage או Cookies | אין תלויות כאלה; בדיקה בסעיף 9.2 |
| אין Secret ב-Repository, ו-`.env` מוחרג | סעיף 7, 9.3 |
| כל הבדיקות מדווחות למשתמש | בדיווח הסיום |
