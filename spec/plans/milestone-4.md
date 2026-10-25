# תוכנית Milestone 4 - PWA, נגישות ואיכות חוצת דפדפנים

## מטרה

להפוך את האפליקציה הקיימת ל-Release Candidate מקומי: ניתנת להתקנה ברמת Metadata, נגישה לפי WCAG 2.2 AA, רספונסיבית ב-Mobile, ‏Tablet ו-Desktop, תואמת ל-Mockup, ומכוסה ב-CI מלא. **אין שינוי בפיצ'רים, בחוזה ה-API או בנוסחי ההודעות.**

## החלטה שהתקבלה בתכנון

- **התקנה בטלפונים עוברת ל-Milestone 5.** טלפונים מאפשרים התקנת PWA רק מכתובת HTTPS, והיא קיימת רק לאחר הפריסה ל-Vercel. באישור המשתמש עודכן `MILESTONES.md`: ב-Milestone 4 נבדקות דרישות ההתקנה ברמת Metadata באופן אוטומטי, וב-Milestone 5 המשתמש מתקין ב-iPhone וב-Android.

## מצב קיים (נקודת פתיחה)

- `src/app/layout.tsx`: ‏`lang="he"`, ‏`dir="rtl"`, ‏Rubik, ‏`metadata` עם `title` ו-`description` בלבד. אין Manifest, אין אייקונים, אין `viewport`/`themeColor`.
- `public/` מכיל רק `raccoon.webp`.
- `aria-live="polite"` קיים בכרטיס התוצאה (טעינה, בדיחה, שגיאה). הודעת שגיאת הקלט מתחת לשדה (`#topic-error`) **אינה** באזור Live, ולכן קורא מסך לא מכריז עליה.
- לאחר לחיצה על "נסו שוב" הכפתור נעלם מה-DOM וה-Focus נופל ל-`body`.
- Playwright: פרויקטים `desktop` ו-`mobile` (Pixel 7), קובץ `e2e/errors.spec.ts` בלבד.
- אין `.github/workflows`.

## 1. PWA

### 1.1 סמלי האפליקציה

- סקריפט חד-פעמי `scripts/generate-icons.mjs` שמשתמש ב-`sharp` (כבר מותקן כתלות של Next.js; לא מוסיפים חבילה):
  - חיתוך הראש בלבד מתוך `spec/raccoon.png` (אוזניים עד סנטר, כולל השפם והכף שליד הלחי; בלי הגוף, הזנב והרגליים). אם הכף המורמת בצד ימין נכנסת חלקית לריבוע — היא נשארת רק אם החיתוך נראה טבעי; ההחלטה הסופית בבדיקה החזותית.
  - הצבת הראש ממורכז על רקע מלא Soft Blush (`#FAD9E5`), כשהוא תופס כ-70% מהסמל.
  - פלטים:
    - `public/icons/icon-192.png` (192x192)
    - `public/icons/icon-512.png` (512x512)
    - `src/app/apple-icon.png` (180x180) — Next.js מוסיף אוטומטית `<link rel="apple-touch-icon">`.
    - `src/app/favicon.ico` (32x32 ו-16x16) — מחליף/מוסיף favicon. ‏`sharp` אינו כותב ICO, ולכן הסקריפט עוטף את קובצי ה-PNG בכותרת ICO בעצמו (כמה שורות).
- הקבצים שנוצרו נשמרים ב-Repository; הסקריפט נשמר לשחזור, ואינו רץ ב-Build. מוסיפים Script ‏`"icons": "node scripts/generate-icons.mjs"` ב-`package.json`.
- אייקון 512 מוגדר ב-Manifest גם כ-`maskable` (הרקע מלא והפרצוף בתוך אזור הבטיחות של 80%).

### 1.2 Manifest

קובץ חדש `src/app/manifest.ts` (`MetadataRoute.Manifest`):

| שדה | ערך |
|---|---|
| `name` | `רגע של צחוק` |
| `short_name` | `רגע של צחוק` |
| `description` | זהה ל-`description` שב-`layout.tsx` |
| `lang` / `dir` | `he` / `rtl` |
| `start_url` | `/` |
| `scope` | `/` |
| `display` | `standalone` |
| `theme_color` | `#F47FA8` (Laugh Pink) |
| `background_color` | `#FFFDFB` (Warm White) |
| `icons` | 192 ו-512 (`purpose: "any"`), ו-512 נוסף עם `purpose: "maskable"` |

### 1.3 Metadata ב-`layout.tsx`

- `export const viewport` עם `themeColor: "#F47FA8"` (ללא נעילת זום — אסור `maximumScale`/`userScalable: false`, נדרש להגדלה).
- הרחבת `metadata` ב-`appleWebApp: { capable: true, title: "רגע של צחוק", statusBarStyle: "default" }`, כדי שב-iPhone האפליקציה תיפתח ב-Standalone עם השם הנכון.
- `applicationName: "רגע של צחוק"`.

### 1.4 מה **לא** עושים

- אין Service Worker, אין `register()` ואין Cache Offline.
- אין רכיב "Install Prompt" או כפתור התקנה (לא מוגדר ב-PRD/DESIGN).
- לוודא שה-CSP הקיים (`default-src 'self'`, ‏`img-src 'self' data: blob:`) מאפשר טעינת Manifest ואייקונים; אם לא — להוסיף `manifest-src 'self'` בלבד.
- לוודא שה-Build עובר עם `cacheComponents` ו-`manifest.ts` (Next.js מטפל בו כ-Route סטטי).

## 2. נגישות (WCAG 2.2 AA)

### 2.1 תיקונים צפויים בקוד

1. **הכרזה על שגיאת קלט** (`JokeForm.tsx`): עטיפת אזור ההודעה בקונטיינר `aria-live="polite"` שקיים תמיד ב-DOM (גם כשאין הודעה), כדי ש-`UNSAFE_TOPIC` ו-`TOPIC_TOO_LONG` יוכרזו. ה-Focus נשאר בשדה/בכפתור.
2. **Focus אחרי "נסו שוב"** (`JokeResult.tsx` / `JokeApp.tsx`): כשהכפתור "נסו שוב" נעלם בזמן שה-Focus עליו, להעביר את ה-Focus לכותרת "הבדיחה שלכם" (`tabIndex={-1}`, ללא מסגרת Focus גלויה כשהיא לא בשימוש מקלדת). זה מונע "איבוד" Focus בלי לקפוץ למקום מפתיע — המשתמש נשאר באותו אזור, והתוצאה מוכרזת דרך ה-Live Region. מעבר Focus קורה **רק** במקרה הזה.
3. **כפתור במצב Disabled בזמן טעינה**: לבדוק שקורא מסך מקבל משוב. ה-Live Region כבר מכריז `רגע, הבדיחה בדרך...`; להוסיף `aria-busy` לכרטיס בזמן טעינה רק אם הבדיקה מראה צורך.
4. **הגדלת טקסט ומרווחי טקסט (1.4.4, 1.4.12)**: הגדלים והגבהים מוגדרים ב-`px`. לבדוק בזום 200% ועם עקיפת מרווחי טקסט (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em) שאין חיתוך או חפיפה — בעיקר בשדה (`min-height: 64px`), בכפתורים ובשורת השגיאה+מונה. לתקן רק מה שנכשל (למשל להחליף `height` קשיח ב-`min-height`).
5. **Target Size (2.5.8)**: השדה והכפתור הראשי 64px, "נסו שוב" 48px — עומדים. לאמת במדידה.
6. **ניגודיות**: לאמת בכלי אוטומטי. צפי: Deep Cocoa על Laugh Pink, ‏Cocoa Muted על Warm White/Warm Cream, ‏Berry Red על Warm Cream, וקו המתאר Warm Mauve של השדה (‏≥3:1 לרכיב) — כולם עוברים. מצב Disabled פטור מדרישת ניגודיות.
7. **אי-הסתמכות על צבע**: שגיאה כבר כוללת אייקון אזהרה וטקסט. השדה במצב שגיאה כבר מסומן `aria-invalid`. אין שינוי צפוי.
8. **`prefers-reduced-motion`**: קיים בכפתורים. לוודא שאין תנועה נוספת שלא מכוסה.
9. **Accessible Names**: לוודא ששמות הכפתורים, השדה והאזור (`section` עם `aria-labelledby`) תקינים, ושהדביבון, החיוך, הקו תחת הכותרת וה-Blobs מוסתרים מקורא מסך.

### 2.2 כלי בדיקה אוטומטי

- הוספת `@axe-core/playwright` כ-devDependency (כלי בדיקה בלבד, לא נכנס לאפליקציה). יתועד כ-ADR ב-`ARCHITECTURE.md`.
- סריקת axe עם התגים `wcag2a`, ‏`wcag2aa`, ‏`wcag21aa`, ‏`wcag22aa` בכל מצב מסך: התחלתי, טעינה, הצלחה, שגיאת קלט, שגיאה עם "נסו שוב", ‏`INVALID_REQUEST`.

## 3. רספונסיביות והתאמה ל-Mockup

- בדיקה ב-320px, ‏375px, ‏390px, ‏768px (Tablet) ו-1280px (Desktop): ללא גלישה אופקית (`scrollWidth <= clientWidth`), העמודה ממורכזת ומוגבלת ל-480px.
- **בדיחה ארוכה**: כרטיס גדל לפי התוכן, הדף נגלל אנכית, ואין גלישה אופקית גם עם מילה ארוכה ללא רווחים (כבר יש `overflow-wrap: anywhere` — לאמת).
- **השוואה חזותית ל-`spec/mockups.png`** בצילומי מסך ב-390px וב-Desktop, לפי סדר הקדימות של `DESIGN.md`. נקודות לבדיקה מיוחדת:
  - רקע השדה (ב-Mockup נראה בהיר מעט שונה מרקע הדף).
  - מיקום הדביבון ביחס לכרטיס, והצל/Blob הרך שמתחתיו.
  - מיקום אייקון החיוך בכרטיס, רדיוסים, עוביי קווים וצללים.
  - יחסי ה-Spacing בין הכותרת, השדה, הכפתור ואזור התוצאה.
- כל סטייה מתוקנת ב-CSS Modules הקיימים בלבד. סטייה שנובעת מסתירה בין המסמך לתמונה — עוצרים ושואלים.

## 4. בדיקות

### 4.1 Playwright

- `playwright.config.ts`: הוספת פרויקט `tablet` (Chromium בגודל 768x1024, `isMobile` + `hasTouch`). Chromium בלבד בכל הפרויקטים.
- קבצים חדשים:
  - `e2e/flows.spec.ts` — יצירה בנושא, יצירה כללית (שדה ריק), שינוי נושא אחרי תוצאה ויצירה נוספת, `UNSAFE_TOPIC` מתחת לשדה ונמחק בשינוי הנושא. (API מדומה דרך `page.route`.)
  - `e2e/pwa.spec.ts` — ה-Manifest נטען מ-`/manifest.webmanifest` עם כל השדות שבסעיף 1.2; כל אייקון מחזיר 200 בגודל הנכון; קיימים `<link rel="manifest">`, ‏`<meta name="theme-color">`, ‏`apple-touch-icon` ו-favicon; אין Service Worker רשום (`navigator.serviceWorker.getRegistrations()` ריק); `<html lang="he" dir="rtl">`.
  - `e2e/a11y.spec.ts` — סריקות axe בכל המצבים (סעיף 2.2); זרימה מלאה במקלדת בלבד (Tab לשדה, הקלדה, Enter, Tab ל-"נסו שוב", Enter); סדר Focus הגיוני; Focus לא זז בהצלחה/שגיאה ועובר לכותרת רק אחרי "נסו שוב"; בדיקת `aria-live` לכל הודעה; Target Size ≥ 24px לכל רכיב אינטראקטיבי.
  - `e2e/layout.spec.ts` — ללא גלישה אופקית ב-320/768/1280, רוחב עמודה ≤ 480px, בדיחה ארוכה, עקיפת מרווחי טקסט, ותצוגת `reducedMotion: "reduce"`.
- `e2e/errors.spec.ts` הקיים נשאר (Offline, ניסיון חוזר, 50 תווים, שליחה כפולה). להוסיף בו בדיקה שתשובת `/api/jokes` אינה מגיעה מ-Cache (שתי בקשות זהות מגיעות שתיהן לשרת המדומה).

### 4.2 Jest

- `JokeForm.test.tsx`: הודעת שגיאה נמצאת בתוך אזור `aria-live` קיים.
- `JokeApp.test.tsx`: אחרי "נסו שוב" ה-Focus עובר לכותרת "הבדיחה שלכם"; בהצלחה ובשגיאה רגילה ה-Focus לא זז.

## 5. CI - GitHub Actions

קובץ חדש `.github/workflows/ci.yml`, רץ על כל Push ל-`main` (לפי `ARCHITECTURE.md` 5.2):

1. `actions/checkout`
2. `actions/setup-node` עם `node-version-file: .nvmrc` ו-Cache של npm
3. `npm ci`
4. `npm run lint`
5. `npm run typecheck`
6. `npm test`
7. `npm run build`
8. `npx playwright install --with-deps chromium`
9. `npm run test:e2e`

- **ללא** `OPENAI_API_KEY` או Secret כלשהו. לוודא מקומית שה-Build וה-E2E עוברים כשהמשתנים לא מוגדרים (הרצה עם `env -u OPENAI_API_KEY -u OPENAI_MODEL`).
- ללא שלב Deployment (Vercel מטפלת בזה ב-Milestone 5).
- ה-Workflow ירוץ בפועל רק לאחר הדחיפה. לפני כן מריצים מקומית את אותם שלבים בדיוק.
- מוסיפים `test-results/` ו-`playwright-report/` — כבר קיימים ב-`.gitignore`; אין שינוי.

## 6. בדיקות משתמש (👤)

ה-AI מכין למשתמש, בסיום הבנייה, רשימת צעדים פשוטה:

- **VoiceOver ב-Safari (Mac):** הפעלה (Cmd+F5), מעבר בין הרכיבים, הקלדת נושא, יצירה, שמיעת "רגע, הבדיחה בדרך..." ואת הבדיחה, יצירת שגיאה (ניתוק Wi-Fi) ושמיעת ההודעה וכפתור "נסו שוב".
- **קורא מסך בדפדפן Chromium:** ‏VoiceOver ב-Chrome על Mac (או NVDA ב-Windows אם זמין) — אותם צעדים.
- ההתקנה בטלפונים — ב-Milestone 5.

## 7. תיעוד

- ADR חדש ב-`ARCHITECTURE.md`: הוספת `@axe-core/playwright` כ-devDependency לבדיקות נגישות אוטומטיות.
- ADR נוסף אם יתקבלה החלטה טכנית משמעותית נוספת (למשל ניהול ה-Focus אחרי "נסו שוב").
- סימון 🟡 ליד כותרת Milestone 4 ב-`MILESTONES.md` בסיום הבנייה.

## סיכום קבצים

| פעולה | קובץ |
|---|---|
| חדש | `scripts/generate-icons.mjs` |
| חדש (נוצר) | `public/icons/icon-192.png`, `public/icons/icon-512.png`, `src/app/apple-icon.png`, `src/app/favicon.ico` |
| חדש | `src/app/manifest.ts` |
| שינוי | `src/app/layout.tsx` (viewport, appleWebApp, applicationName) |
| שינוי | `src/components/JokeForm.tsx`, `JokeResult.tsx`, `JokeApp.tsx` (Live Region, Focus) |
| שינוי לפי הצורך | `*.module.css` (התאמת Mockup, הגדלת טקסט) |
| שינוי לפי הצורך | `next.config.ts` (רק אם ה-CSP חוסם Manifest) |
| שינוי | `playwright.config.ts` (פרויקט tablet) |
| חדש | `e2e/flows.spec.ts`, `e2e/pwa.spec.ts`, `e2e/a11y.spec.ts`, `e2e/layout.spec.ts` |
| שינוי | `e2e/errors.spec.ts`, `JokeForm.test.tsx`, `JokeApp.test.tsx` |
| חדש | `.github/workflows/ci.yml` |
| שינוי | `package.json` (`@axe-core/playwright`, Script `icons`) |
| שינוי | `spec/ARCHITECTURE.md` (ADR), `spec/MILESTONES.md` (🟡) |

## בדיקה מול Definition of Done

| תנאי | איך נבדק |
|---|---|
| Manifest תקין עם השדות והאייקונים | `e2e/pwa.spec.ts` |
| דרישות התקנה ברמת Metadata | `e2e/pwa.spec.ts` + בדיקה ב-DevTools ‏(Application ← Manifest) בדפדפן המובנה |
| Offline מציג שגיאה, ללא Cache | `e2e/errors.spec.ts` + אין Service Worker |
| זרימות במקלדת בלבד | `e2e/a11y.spec.ts` |
| `aria-live` בלי העברת Focus מפתיעה | `e2e/a11y.spec.ts` + Jest |
| ניגודיות, Reflow, הגדלת טקסט, Target Size | axe + `e2e/layout.spec.ts` + זום 200% ידני בדפדפן המובנה |
| אין גלישה אופקית מ-320px | `e2e/layout.spec.ts` |
| תואם Mockup | השוואת צילומי מסך מול `spec/mockups.png` |
| CI עובר ללא מפתח אמיתי | הרצה מקומית של כל שלבי ה-Workflow בלי משתני OpenAI |
| Playwright ב-Chromium לכל הזרימות | `npm run test:e2e` (desktop, mobile, tablet) |
| 👤 קוראי מסך | רשימת צעדים למשתמש |
