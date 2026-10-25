# Milestone 3 - שגיאות, ניסיון חוזר והגנת API

תוכנית בנייה ל-Milestone 3 לפי `MILESTONES.md`. מבוססת על `PRD.md`, ‏`ARCHITECTURE.md` (סעיפים 2.5, 2.7, 3.2, 3.3, 5.4, 6), ‏`DESIGN.md` (טבלאות "הודעות למשתמש" ו"מצבי מסך") ועל הקוד הקיים אחרי Milestone 2.

## החלטות שהתקבלו בתכנון

- **"נסו שוב" שולח את מה שכתוב בשדה ברגע הלחיצה** (לפי `DESIGN.md`). המשתמש אישר זאת בתכנון. אם הנושא לא שונה, זו בדיוק אותה בקשה. הנושא נשמר רק ב-State של React, כמו היום.
- **Origin זר, Origin חסר ו-Content-Type שגוי → `400 INVALID_REQUEST`.** טבלת השגיאות ב-2.5 לא כוללת קוד נפרד לכך, ו-`INVALID_REQUEST` הוא "מבנה בקשה שגוי". כך כל קוד נשאר בסטטוס שנקבע לו. יתועד כ-ADR.
- **Retry אוטומטי ב-Backend רק לשלב יצירת הבדיחה**, פעם אחת, רק על שגיאת חיבור (לא Timeout) או 5xx, ורק אם נשארו לפחות 12 שניות מתקציב 30 השניות. לא על Moderation, ‏429, Validation או Timeout. ממשיך את ADR-1 (שם נקבע שה-Retry ייבנה כאן).
- **CSP עם `'unsafe-inline'` לסקריפטים ולסגנונות.** Next.js מזריק סקריפטים Inline; האלטרנטיבה (Nonce) מחייבת רינדור דינמי של כל דף ו-Proxy, וזה מסבך יתר על המידה לאתר בלי תוכן משתמש ב-HTML. `'unsafe-eval'` רק ב-Development (נדרש ל-Hot Reload). יתועד כ-ADR.
- **Playwright עם API מדומה** דרך `page.route` — הבדיקות לא פונות ל-OpenAI ולא צריכות מפתח.

## קבצים לשינוי / יצירה

### Backend

#### `src/app/api/jokes/route.ts` (שינוי)
- בדיקות לפני קריאת ה-Body, לפי הסדר:
  1. `Content-Type` — רק `application/json` (מותר `; charset=utf-8`). אחרת `INVALID_REQUEST`.
  2. Same Origin — ה-Host של כותרת `Origin` חייב להיות זהה ל-Host של `request.url`. Origin חסר או לא ניתן לפענוח → `INVALID_REQUEST`. ללא כותרות CORS בתשובה.
- `export const maxDuration = 30`. אם ה-Build נכשל בגלל `cacheComponents` (כמו `runtime` ב-ADR-2) — להגדיר במקום זה ב-`vercel.json` (`functions["src/app/api/jokes/route.ts"].maxDuration = 30`), ולעדכן את ADR-2 בתוצאה.
- יצירת Deadline לבקשה (`Date.now() + 30_000`) והעברתו ל-`generateJoke`.
- לוג תפעולי אחד לכל בקשה שנכשלה (ראה "לוגים").
- כל התשובות נשארות עם `Cache-Control: no-store` (קיים).

#### `src/lib/jokes/generateJoke.ts` (שינוי)
- מקבל `deadline` ומעביר לכל שלב Timeout שהוא המינימום בין תקציב השלב לזמן שנשאר:
  - Input Moderation: ‏5 שניות.
  - יצירה: ‏10 שניות לכל ניסיון.
  - Output Moderation: ‏5 שניות.
- אם לא נשאר זמן לשלב → `AI_UNAVAILABLE` בלי לקרוא ל-OpenAI.
- Retry יחיד ליצירה לפי התנאים בהחלטות למעלה. השגיאה שמאפשרת Retry מסומנת ע"י ה-Adapter (למשל שדה `retriable` פנימי ב-`JokeError`, או סוג שגיאה פנימי) — לא נחשף לדפדפן.

#### `src/lib/openai/adapter.ts` (שינוי)
- `isFlagged` ו-`requestJoke` מקבלים `timeoutMs` ומעבירים ל-SDK כ-Request Option (`{ timeout }`).
- מיפוי שגיאות:
  - `APIConnectionTimeoutError` → `AI_UNAVAILABLE` (לא ניתן ל-Retry אוטומטי).
  - `APIConnectionError` → `AI_UNAVAILABLE` (ניתן ל-Retry אוטומטי).
  - `APIError` 5xx → `AI_UNAVAILABLE` (ניתן ל-Retry אוטומטי).
  - `APIError` 429 (כולל `project_spend_limit_exceeded`) → `AI_RATE_LIMITED`.
  - כל השאר → `INTERNAL_ERROR`.
- החזרת OpenAI Request ID (מ-`error.requestID` / `response._request_id`) לצורך הלוג בלבד.

#### `src/lib/domain/errors.ts` (שינוי קל)
- הוספת שדה פנימי אופציונלי ל-`JokeError`: האם מותר Retry אוטומטי בשרת, ו-Request ID של OpenAI. לא משפיע על חוזה ה-API.

#### לוגים — `src/lib/log.ts` (חדש, קטן)
- פונקציה אחת `logJokeFailure({ code, durationMs, openaiRequestId? })` שכותבת שורת JSON אחת ל-`console.error`.
- אסור: Body, נושא, בדיחה, IP, Headers, הודעות שגיאה של OpenAI, Stack Trace.
- החלפת ה-`console.error` הקיים ב-route.

#### `next.config.ts` (שינוי)
- `headers()` לכל הנתיבים (`/:path*`):
  - `Content-Security-Policy`: ‏`default-src 'self'; script-src 'self' 'unsafe-inline'` (+`'unsafe-eval'` ב-Development בלבד)`; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`.
- לוודא בהרצה שהדף, הגופן Rubik ותמונת הדביבון נטענים בלי שגיאות CSP בקונסול.

### Frontend

#### `src/lib/client/requestJoke.ts` (שינוי)
- אם `navigator.onLine === false` → `NETWORK_ERROR` בלי לשלוח.
- `AbortController` עם Timeout של 32 שניות → `AI_UNAVAILABLE`.
- `fetch` שנכשל (לא בגלל ה-Timeout) → `NETWORK_ERROR`.
- תשובה שאינה בפורמט האפליקציה:
  - `429` → `AI_RATE_LIMITED`.
  - `403` → `AI_RATE_LIMITED` (תשובת Firewall, לפי 3.2).
  - כל השאר → `INTERNAL_ERROR`.
- מחזיר גם `retryable` — לפי טבלת `ERRORS` בדפדפן (ה-Frontend מחליט לפי `code`, לא לפי השרת).

#### `src/components/JokeApp.tsx` (שינוי)
- הסרת `CARD_ERROR_MESSAGE`; כל קוד מקבל את ההודעה שלו מ-`ERROR_MESSAGES`.
- `TOPIC_TOO_LONG` ו-`UNSAFE_TOPIC` — מתחת לשדה, הכרטיס חוזר למה שהיה (קיים).
- כל שאר הקודים — בכרטיס, עם `retryable` מ-`ERRORS[code]`.
- `handleRetry` = אותה פונקציית שליחה, עם הנושא שבשדה כרגע. ההגנה מפני שליחה כפולה (`inFlight`) חלה גם עליו.

#### `src/components/JokeResult.tsx` + `JokeResult.module.css` (שינוי)
- `ResultView` מסוג `error` מקבל `retryable` ו-`onRetry`.
- כשהוא `true` — כפתור `נסו שוב` מתחת להודעה, בסגנון משני לפי `DESIGN.md`: רקע בהיר (Warm White), קו מתאר Deep Cocoa ‏2px, רדיוס 18px, Label מודגש, Focus ‏3px Deep Cocoa במרחק 2px, גודל מגע מספק.
- ה-`aria-live` הקיים מודיע על ההודעה; ה-Focus לא זז אוטומטית.
- `INVALID_REQUEST` — הודעה בלי כפתור.

### בדיקות

#### Jest — הרחבה
- `src/app/api/jokes/route.test.ts`:
  - כל קוד מוחזר עם הסטטוס וה-`retryable` מהטבלה ב-2.5.
  - Origin זר, Origin חסר, ו-Content-Type שגוי (`text/plain`, חסר) → ‏400 `INVALID_REQUEST`, בלי קריאה ל-OpenAI.
  - אין כותרת `Access-Control-Allow-Origin` בתשובה.
  - Timeout בכל שלב → ‏503 `AI_UNAVAILABLE`.
  - Retry: שגיאת חיבור / 500 ביצירה → ניסיון שני מצליח; כשל כפול → `AI_UNAVAILABLE`; ‏429 ו-Timeout → בלי Retry; Moderation → בלי Retry; פחות מ-12 שניות שנותרו → בלי Retry (עם Fake Timers / Deadline מוזרק).
  - `429` עם `project_spend_limit_exceeded` → `AI_RATE_LIMITED`.
  - הלוג לא כולל נושא, בדיחה, מפתח או הודעת ספק (Spy על `console`).
  - התשובות לא כוללות HTML או Stack Trace.
- `src/lib/client/requestJoke.test.ts` (חדש): Offline, ‏Timeout של 32 שניות, ‏fetch שנכשל, ‏429/403 שאינם בפורמט, JSON לא תקין.
- `src/components/JokeApp.test.tsx`:
  - לכל קוד — ההודעה המדויקת מ-`DESIGN.md` ובמקום הנכון.
  - כפתור `נסו שוב` מופיע רק כש-`retryable`; לחיצה שולחת בקשה אחת עם הנושא שבשדה; לחיצה כפולה מהירה שולחת אחת.
  - `INVALID_REQUEST` בלי כפתור.
- בדיקת Security Headers: בדיקת Unit לפונקציית ה-`headers()` של `next.config.ts`, ובנוסף בדיקה ידנית בהרצה (`curl -I`).

#### Playwright — חדש
- התקנת `@playwright/test` ודפדפן Chromium (הורדה חד-פעמית בזמן הבנייה).
- `playwright.config.ts`: ‏Chromium בלבד, `webServer` שמריץ `npm run dev` על פורט נפרד (למשל 3100) כדי לא להתנגש בהרצה שלך.
- `e2e/errors.spec.ts`, עם `page.route("/api/jokes")` מדומה:
  1. ניסיון חוזר לאחר תקלה: תשובה ראשונה `503 AI_UNAVAILABLE` → הודעה + `נסו שוב` → לחיצה → בדיחה מוצגת.
  2. חסימת הקלדה והדבקה מעבר ל-50 תווים (כולל אימוג'י), והמונה מציג `50/50`.
  3. היעדר שליחה כפולה: תשובה מושהית, כמה לחיצות על "צרו לי בדיחה" → בקשה אחת בלבד.
  4. Offline (`context.setOffline(true)`) → הודעת "אין חיבור לאינטרנט" + `נסו שוב`.
- סקריפט חדש ב-`package.json`: ‏`"test:e2e": "playwright test"`.
- `jest.config.ts`: התעלמות מתיקיית `e2e/`.
- `.gitignore`: הוספת `/test-results/`, `/playwright-report/`, `/playwright/.cache/`.

### מסמכים
- `ARCHITECTURE.md` — ADRs חדשים: ‏ADR-3 (Origin/Content-Type → ‏400 `INVALID_REQUEST`), ‏ADR-4 (CSP עם `'unsafe-inline'`), ‏ADR-5 (היקף ה-Retry בשרת), ועדכון ADR-2 לגבי `maxDuration`.
- `CLAUDE.md` — הוספת `npm run test:e2e` לפקודות הבדיקה.
- `MILESTONES.md` — סימון 🟡 בסיום הבנייה.

## בדיקה עצמית בסיום הבנייה
1. `npm run lint`, ‏`npm run typecheck`, ‏`npm test`, ‏`npm run test:e2e`, ‏`npm run build` — כולם עוברים.
2. הרצה מקומית: הדף נטען בלי שגיאות CSP בקונסול; `curl -I` מציג את ה-Security Headers.
3. `curl` עם Origin זר ועם Content-Type שגוי → ‏400.
4. בדיקה ידנית בדפדפן: מצב Offline, ושגיאה עם "נסו שוב" (באמצעות דימוי תשובה).
5. Smoke קצר אחד מול OpenAI כדי לוודא שה-Timeouts לא שברו את הזרימה התקינה, בלי לשמור תוכן.
6. סגירת ההרצה.

## מחוץ ל-Milestone הזה
- GitHub Actions, ‏Manifest ואייקונים, השלמת WCAG — ‏Milestone 4.
- Rate Limit ב-Vercel Firewall — ‏Milestone 5 (כאן רק הטיפול בתשובות 429/403 שלו ב-Frontend).
