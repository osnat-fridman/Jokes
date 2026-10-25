# תוכנית Milestone 5 - Production והשקה מבוקרת

## מטרה

לפרוס את ה-Release Candidate של Milestone 4 ל-Vercel דרך GitHub, כך שכל Push מאושר ל-`main` יפרוס אוטומטית ל-Production, עם המפתח מוגדר רק ב-Production, Rate Limit, ‏DDoS Protection, תקרת הוצאות ב-OpenAI ודרך Rollback שנבדקה. **אין שינוי בפיצ'רים, בחוזה ה-API, בעיצוב או בנוסחי ההודעות.**

## מצב קיים (נקודת פתיחה)

- Repository מחובר ל-`https://github.com/osnat-fridman/Jokes.git`, ענף `main` נקי, Milestone 4 נדחף.
- `.github/workflows/ci.yml` מריץ בכל Push ל-`main`: ‏Lint, ‏Type Check, ‏Jest, ‏Build ו-Playwright, עם `.nvmrc` = `24` וללא מפתח OpenAI.
- `package.json` כולל `"engines": { "node": "24.x" }` — Vercel קוראת את זה ובוחרת Node.js 24.
- `src/app/api/jokes/route.ts` כולל `maxDuration = 30` (ADR-2), ללא `runtime` וללא `vercel.json`.
- Security Headers ו-`no-store` מוגדרים בקוד (Milestone 3).
- `requestJoke.ts` כבר ממפה 429, ו-403 שאינו בפורמט האפליקציה, ל-`AI_RATE_LIMITED` (סעיף 3.2) — אין צורך בשינוי קוד עבור תשובות ה-Firewall.
- `log.ts` כותב רק `code`, ‏`durationMs` ו-`openaiRequestId`.
- אין חבילות Analytics או Speed Insights ב-`package.json`.
- `gh` מותקן ומחובר לחשבון `osnat-fridman` — אפשר לבדוק את מצב ה-CI בלי לפתוח את GitHub. ‏Vercel CLI אינו מותקן ולא נתקין אותו: כל ההגדרות ב-Vercel נעשות על ידי המשתמש בלוח הבקרה.

**מסקנה:** צפוי שלא יידרש שינוי קוד. העבודה היא הגדרות בחשבונות (על ידי המשתמש, בהדרכה), בדיקות ב-Production ותיעוד.

## החלטות לתכנון

- **אזור (Region) ה-Function — Frankfurt (`fra1`), מוגדר בלוח הבקרה של Vercel** (Settings ← Functions ← Function Region) ולא ב-`vercel.json`. כך נשמרת ההחלטה ב-ADR-2 שאין צורך ב-`vercel.json`. ההחלטה תתועד כ-ADR-10.
- **תקרת הוצאות ב-OpenAI — לא מוגדרת.** בשלב הבנייה המשתמש החליט לא להגביל סכום; המסמכים עודכנו ונוסף ADR-8.
- **שני Push-ים במהלך ה-Milestone:**
  1. **Push בדיקה** — במהלך הבנייה, כדי לאמת שה-Push מפעיל Deployment אוטומטי ושיש שתי גרסאות Production לתרגול Rollback. לפי `CLAUDE.md` — עוצרים ומבקשים את אישור המשתמש לפני ה-Push הזה. התוכן שלו: קובץ התוכנית, ADR-8 עד ADR-10 ועדכון `CLAUDE.md` (ראו סעיף 6).
  2. **Push האישור** — בסוף, כשהמשתמש מבקש "דחוף שינויים לגיטהאב" (מסמן ✅ ב-`MILESTONES.md`).
- **אין מסד נתונים** — אין Migrations ואין צורך בתיאום Production DB לפני Push.

## 1. בדיקה מקומית לפני הפריסה

לפני שהמשתמש מתחיל בהגדרות, מריצים מקומית ומוודאים שהכול ירוק:

- `npm ci`, ‏`npm run lint`, ‏`npm run typecheck`, ‏`npm test`, ‏`npm run build`, ‏`npm run test:e2e`.
- `gh run list --limit 1` — ה-CI של ה-Push של Milestone 4 עבר.
- בדיקת מחירי `gpt-5.6-terra` מול דף המודל של OpenAI (סעיף 1.3 דורש לבדוק שוב לפני ההשקה). אם השתנו — מדווחים למשתמש; לא משנים את המסמך בלי אישור.

## 2. 👤 הגדרות OpenAI (המשתמש, בהדרכה צעד אחר צעד)

ההדרכה תינתן בשפה פשוטה, צעד אחר צעד, ובסוף כל צעד מחכים לאישור המשתמש:

1. כניסה ל-OpenAI Platform ← Project של האפליקציה (נוצר ב-Milestone 2).
2. ~~תקרה והתראות~~ — בוטל לבחירת המשתמש (ADR-8).
3. בדיקה שה-Project מוגבל למודלים הנדרשים בלבד (`gpt-5.6-terra` ו-`omni-moderation-latest`), אם הדבר טרם נעשה.

המפתח הקיים ב-`.env` משמש גם ל-Production (סעיף 3.1). Claude אינו קורא את `.env` ואינו רואה את המפתח — המשתמש מעתיק אותו בעצמו ל-Vercel.

## 3. 👤 חיבור ל-Vercel (המשתמש, בהדרכה צעד אחר צעד)

1. יצירת חשבון Vercel בתוכנית **Hobby** (או כניסה לחשבון קיים), עם התחברות דרך GitHub.
2. Add New ← Project ← Import של ה-Repository ‏`osnat-fridman/Jokes`, ומתן הרשאה ל-Vercel GitHub App רק ל-Repository הזה.
3. במסך ה-Import:
   - Framework Preset: ‏Next.js (מזוהה אוטומטית). פקודות Build ו-Install — ברירת מחדל.
   - Project Name — קובע את הכתובת `<project>.vercel.app`. המשתמש בוחר את השם.
   - Environment Variables: ‏`OPENAI_API_KEY` (הערך מה-`.env`) ו-`OPENAI_MODEL` = `gpt-5.6-terra`, **מסומנים ל-Production בלבד** (לא Preview ולא Development).
4. Deploy — ה-Deployment הראשון נבנה מה-`main` הנוכחי (Milestone 4).
5. לאחר ה-Deployment, ב-Settings:
   - **Functions ← Function Region:** ‏Frankfurt (`fra1`).
   - **General ← Node.js Version:** ‏24.x (צפוי להיות כבר כך בגלל `engines`).
   - **Git:** ענף ה-Production הוא `main`.
   - **Analytics** ו-**Speed Insights:** לא מופעלים (לא לוחצים Enable).
   - **Deployment Protection:** משאירים ברירת מחדל (Production ציבורי).
6. Redeploy אחד כדי שהאזור החדש ייכנס לתוקף.

## 4. 👤 Firewall: ‏Rate Limit ו-DDoS (המשתמש, בהדרכה)

> **עדכון בבנייה:** לבחירת המשתמש, כלל ה-Rate Limit בוטל (ADR-9). נשאר רק DDoS Protection.

1. Project ← Firewall: מוודאים ש-DDoS Mitigation פעיל (ברירת מחדל, לא מכבים).
2. Add Rule — כלל Rate Limit אחד:
   - Name: ‏`jokes-api-rate-limit`.
   - If: ‏Request Path **equals** `/api/jokes` **וגם** Method **equals** `POST`.
   - Then: ‏Rate Limit, ‏Fixed Window, ‏60 שניות, ‏20 בקשות, מפתח: IP.
   - Action: ‏**429 Too Many Requests**. אם אינו זמין ב-Hobby — Deny (403), כפי שמאפשר סעיף 3.2.
3. Save ← Review Changes ← Publish.
4. לא מפעילים Bot Protection במצב Challenge על `/api/jokes`.

## 5. בדיקות ב-Production (Claude מריץ, אלא אם מסומן 👤)

הכתובת: `https://<project>.vercel.app`. התוכן שנוצר בבדיקות אינו נשמר בשום קובץ או לוג; מדווחים רק עבר/נכשל.

### 5.1 בדיקות ללא עלות (curl)

| בדיקה | איך | תוצאה צפויה |
|---|---|---|
| HTTPS ועברית | `curl -sI https://<project>.vercel.app` ובדיקת ה-HTML | ‏200, ‏`lang="he"`, ‏`dir="rtl"` |
| Security Headers | `curl -sI` על `/` | CSP (ללא `unsafe-eval`), ‏`nosniff`, ‏Referrer-Policy, ‏Permissions-Policy |
| Manifest ואייקונים | `curl` ל-`/manifest.webmanifest`, ‏`/icons/icon-192.png`, ‏`/icons/icon-512.png`, ‏`/apple-icon.png`, ‏`/favicon.ico` | ‏200 וסוגי תוכן תקינים |
| Origin זר | `POST` עם `Origin: https://evil.example` | ‏`400 INVALID_REQUEST`, ללא כותרות CORS |
| Content-Type שגוי | `POST` עם `text/plain` | ‏`400 INVALID_REQUEST` |
| נושא ארוך | `POST` עם נושא של 51 תווים | ‏`400 TOPIC_TOO_LONG`, ללא פנייה ל-OpenAI |
| `no-store` | בכל התשובות של `/api/jokes` לעיל | ‏`Cache-Control: no-store` |
| Rate Limit | 21 בקשות `POST` עם נושא ארוך מדי, תוך פחות מדקה | ‏20 הראשונות `400`, ה-21 מקבלת `429` (או `403` אם נבחר Deny). הבקשות נחסמות לפני OpenAI ולכן ללא עלות |
| מפתח לא נחשף | חיפוש `sk-` ו-`OPENAI` בקובצי ה-JS שהדף טוען | אין התאמות |

### 5.2 בדיקות בדפדפן (Claude, בדפדפן המובנה)

- יצירת בדיחה עם נושא תקין (למשל "חתולים").
- יצירת בדיחה עם שדה ריק.
- נושא חסום (מתחומי ה-PRD) — מוצגת הודעת `UNSAFE_TOPIC` ללא "נסו שוב".
- שגיאה ניתנת לניסיון חוזר: מיד אחרי בדיקת ה-Rate Limit (בתוך אותה דקה) לוחצים "צרו לי בדיחה" ← מוצגת הודעת השירות הכללית עם "נסו שוב"; אחרי שהדקה עוברת, "נסו שוב" מצליח.
- מניעת שליחה כפולה: לחיצות מהירות בזמן טעינה שולחות בקשה אחת (בדיקה ב-Network).
- אין בקשות לשירותי Analytics או לדומיינים חיצוניים, ואין Cookies.
- כמה בקשות בסך הכול — הבדיקות מול OpenAI מסתכמות בכ-5–6 בקשות.

### 5.3 👤 בדיקות המשתמש

- **לוגים:** Vercel ← Project ← Logs: המשתמש מוודא (לפי הדרכה) שאין שם נושא, בדיחה או גוף בקשה — רק נתיב, סטטוס, ולכל היותר שורת `joke_failed` עם קוד ומשך.
- **התקנת PWA:** לפי רשימת צעדים שתוכן:
  - iPhone, ‏Safari: שיתוף ← "הוספה למסך הבית" ← פתיחה מהאייקון ← נפתח בלי שורת הכתובת, עם הדביבון והשם "רגע של צחוק".
  - Android, ‏Chrome: תפריט ← "התקנת אפליקציה" ← פתיחה ← Standalone.

## 6. Push בדיקה, Deployment אוטומטי ו-CI

1. הכנת השינויים ל-Push הבדיקה: קובץ התוכנית, ADR-8 עד ADR-10 ב-`ARCHITECTURE.md`, ועדכון `CLAUDE.md` תחת "פקודות הרצה" עם הכתובת הציבורית.
2. **עצירה ובקשת אישור מהמשתמש ל-Push** (חובה לפי `CLAUDE.md`).
3. לאחר האישור: commit + push ל-`main`.
4. מעקב: `gh run watch` — ה-CI עובר; ב-Vercel ← Deployments — נוצר Production Deployment חדש אוטומטית, בלי פעולה ידנית (המשתמש מאשר במסך או Claude בודק שהגרסה בכתובת התעדכנה).
5. חזרה מהירה על בדיקות 5.1 העיקריות מול הגרסה החדשה.

## 7. תרגול Rollback (👤 המשתמש, בהדרכה)

לאחר ה-Push יש שתי גרסאות Production, ואפשר לתרגל:

1. Vercel ← Deployments ← הגרסה הקודמת ← **Instant Rollback**.
2. Claude מוודא שהכתובת עדיין עובדת (טעינת הדף ובדיקת curl אחת).
3. חזרה לגרסה העדכנית: **Undo Rollback** (או Promote to Production לגרסה העדכנית). חשוב: אחרי Rollback, ‏Vercel מפסיקה לשייך Push-ים חדשים ל-Production עד שמבטלים אותו — לכן השלב הזה חובה.
4. Claude מוודא שוב שהגרסה העדכנית מוגשת.

אם Instant Rollback אינו זמין בתוכנית — מתעדים את הדרך החלופית (Promote לגרסה קודמת) ומדווחים.

## 8. תיעוד

- **ADR-10: אזור ה-Function מוגדר בלוח הבקרה של Vercel** — הקשר (סעיף 5.4 ממליץ על Frankfurt; ADR-2 קבע שאין `vercel.json`), החלטה (`fra1` דרך Settings ← Functions), השלכות (ההגדרה אינה ב-Git; אם יוקם פרויקט Vercel חדש יש להגדיר אותה שוב).
- אם במהלך ההגדרה יתגלה ש-429 אינו זמין ב-Hobby ונבחר Deny — ADR נוסף שמתעד זאת.
- `CLAUDE.md` ← "פקודות הרצה": הוספת שורה עם כתובת ה-Production.
- `MILESTONES.md`: סימון 🟡 בסוף הבנייה.
- לא משנים PRD, ‏DESIGN או ARCHITECTURE (מלבד ADRs).

## סיכום קבצים

| קובץ | שינוי |
|---|---|
| `spec/plans/milestone-5.md` | קובץ זה |
| `spec/ARCHITECTURE.md`, ‏`MILESTONES.md`, ‏`PRD.md` | ביטול דרישת התקרה, ADR-8 (תקרה), ADR-9 (Rate Limit), ADR-10 (אזור) |
| `CLAUDE.md` | כתובת Production תחת "פקודות הרצה" |
| `spec/MILESTONES.md` | סימון 🟡 |
| קוד האפליקציה | ללא שינוי צפוי. אם בדיקה ב-Production תיכשל — תיקון ממוקד, הרצת כל הבדיקות מקומית, ובקשת אישור ל-Push נוסף |

## בדיקה מול Definition of Done

| תנאי | איך נבדק |
|---|---|
| CI עובר לאחר Push ל-`main` | `gh run watch` אחרי Push הבדיקה (סעיף 6) |
| המפתח ב-Vercel ואינו חשוף | הגדרה ב-Production בלבד (סעיף 3); חיפוש ב-JS ובתשובות (5.1); `git grep` ב-Repository |
| Push מפעיל Deployment אוטומטי | Deployment חדש נוצר מה-Push בלי פעולה ידנית (סעיף 6) |
| ‏HTTPS, עברית ו-RTL | 5.1 |
| בדיחה בנושא ובדיחה כללית | 5.2 |
| שגיאות, "נסו שוב", Moderation, שליחה כפולה | 5.2 |
| ‏Rate Limit ו-DDoS; הבקשה ה-21 מקבלת 429 והממשק מציג הודעת שירות כללית | סעיף 4 + 5.1 + 5.2 |
| אין Analytics ו-Speed Insights | הגדרות Vercel (סעיף 3) + בדיקת Network (5.2) |
| אין תוכן משתמש בלוגים | 5.3 |
| 👤 התקנת PWA ב-iPhone וב-Android | 5.3 |
| Rollback מתועד ומאומת | סעיף 7 |
| תוצאות מוצגות למשתמש, כולל מה שלא ניתן היה להריץ | דיווח סיום |

## סיכונים ונקודות לתשומת לב

- **Rate Limit חוסם גם את המחשב שממנו בודקים** — לדקה אחת בלבד. מתוכנן כחלק מבדיקת "נסו שוב".
- **אין תקרת הוצאות** (ADR-8) — ההגנה מפני ניצול היא ה-Rate Limit ומעקב ידני.
- **גרסת Hobby** — אם תכונה (429 ב-Firewall, ‏Instant Rollback, בחירת Region) אינה זמינה בתוכנית, עוצרים, מסבירים בפשטות ושואלים לפני שבוחרים חלופה.
- **שם הפרויקט ב-Vercel** קובע את הכתובת הציבורית ואי אפשר לשנות אותה בקלות לאחר שיתוף — המשתמש בוחר אותו.
