# MILESTONES - רגע של צחוק

מסמך זה מחלק את פיתוח המוצר ל-Milestones עוקבים וניתנים לבדיקה. החלוקה מבוססת על `PRD.md`, ‏`ARCHITECTURE.md` ו-`DESIGN.md`, ומעדיפה Vertical Slices שמסתיימים ביכולת עובדת שאפשר להציג ולאשר.

## Development Execution Rules - כללי ביצוע מחייבים

הנחיות אלה מיועדות ל-AI שיבצע את הפיתוח:

1. יש לפתח את ה-Milestones לפי הסדר המוגדר במסמך. אין לדלג קדימה או להתחיל רכיבים השייכים ל-Milestone מאוחר יותר.
2. בסיום כל Milestone יש לעצור את הפיתוח.
3. לפני העצירה יש להציג למשתמש:
   - מה הושלם ומה ניתן לבדוק כעת.
   - אילו קבצים או רכיבים מרכזיים נוספו או השתנו.
   - תוצאות הבדיקות מול כל סעיף ב-Definition of Done.
   - אילו בדיקות עברו, אילו נכשלו ואילו לא הורצו, כולל הסיבה.
   - מגבלות או פערים ידועים שנשארו בתחום אותו Milestone.
4. אין להציג Milestone כהושלם אם תנאי מהותי ב-Definition of Done לא עבר. במקרה כזה יש לתקן ולהריץ מחדש את הבדיקות, או לעצור ולהסביר מה חוסם את ההשלמה.
5. אין להתחיל את ה-Milestone הבא ללא אישור מפורש של המשתמש. הצלחת הבדיקות, היעדר תגובה או אישור משתמע אינם נחשבים לאישור.
6. אין להוסיף פיצ'רים, שירותים, איסוף נתונים או שינויי עיצוב שאינם מוגדרים במסמכי הפרויקט.
7. יש לשמור לאורך כל הפיתוח על Secrets מחוץ ל-Git, על היעדר שמירת תוכן משתמש ועל הפרדה בין Development ל-Production.

## סדר אבני הדרך והתלויות

| Milestone | יכולת שנמסרת | תלוי ב- |
|---|---|---|
| 1 | בסיס הפרויקט ומסך מעוצב שניתן להרצה | אין |
| 2 | יצירת בדיחה בטוחה מקצה לקצה בסביבת Development | Milestone 1 |
| 3 | טיפול מלא בשגיאות, ניסיונות חוזרים והגנת API | Milestone 2 |
| 4 | PWA, נגישות, רספונסיביות וכיסוי בדיקות מלא | Milestone 3 |
| 5 | Preview ו-Production עם הגנות תפעוליות ופריסה אוטומטית | Milestone 4 |

## Milestone 1 - בסיס הפרויקט והממשק המאושר

### שם ומטרה

**הקמת בסיס טכני ומסך ראשי מעוצב.**

מטרת אבן הדרך היא ליצור אפליקציית Next.js שניתנת להרצה ולבדיקה מקומית, ולהציג בה את המסך היחיד בהתאם ל-`DESIGN.md` ול-Mockup המאושר, לפני חיבור לשירות AI.

### מה יש לממש

- הקמת פרויקט Next.js 16 עם App Router, ‏React 19 ו-TypeScript 5.x.
- הגדרת Node.js 24 LTS ו-npm עם `package-lock.json`.
- מבנה בסיסי ל-Frontend, ‏Backend Route, ‏Domain, ‏OpenAI Adapter ו-Tests, בלי להוסיף שכבות שאינן נחוצות.
- מסמך HTML בעברית עם `lang="he"` ו-`dir="rtl"`.
- מימוש המסך הראשי כעמודה יחידה, כולל:
  - הכותרת "רגע של צחוק".
  - התווית "נושא לבדיחה".
  - שדה טקסט ומונה תווים.
  - הכפתור "צרו לי בדיחה".
  - אזור "הבדיחה שלכם" וכרטיס התוצאה.
  - אייקון החיוך ודמות הדביבון כאלמנטים דקורטיביים.
- מימוש השפה החזותית מתוך `DESIGN.md`: ‏Rubik, צבעים, Spacing, פינות, קווי מתאר וצללים.
- פריסה רספונסיבית בסיסית החל מרוחב 320px ועד Desktop.
- HTML סמנטי, Label מפורש, סדר Focus בסיסי ו-Focus נראה.
- הכנת `.gitignore` ו-`.env.example` ללא ערכי Secrets.
- הקמת Git Repository וחיבור ל-GitHub. כל שינוי עתידי יבוצע בענף נפרד וב-Pull Request.
- הגדרת Scripts עבור Lint, ‏Type Check, ‏Tests ו-Build. בשלב זה מותר שכיסוי הבדיקות יהיה בסיסי.

### תוצר מצופה

אפליקציה מקומית שנפתחת ומציגה את המסך הראשי בעיצוב המאושר בעברית וב-RTL. הרכיבים מוצגים ופועלים ברמת UI בסיסית, אך הכפתור עדיין אינו יוצר בדיחה אמיתית.

### Definition of Done

- `npm ci`, ‏Lint, ‏Type Check ו-Production Build מסתיימים בהצלחה.
- המסך כולל את כל הרכיבים שמופיעים ב-Wireframe וב-Mockup, ללא מסכים או פעולות נוספות.
- המראה תואם ל-`DESIGN.md`, כולל Color Palette, ‏Typography, מבנה RTL ודמות הדביבון.
- המסך נבדק ידנית ברוחב 320px, בתצוגת Mobile מייצגת וב-Desktop, ללא גלישה אופקית או הסתרת תוכן.
- אפשר להגיע לשדה ולכפתור באמצעות מקלדת, ולכל רכיב אינטראקטיבי יש Accessible Name ברור.
- אין Analytics, ‏Authentication, ‏Database, ‏Local Storage או Cookies.
- אין Secret ב-Repository, ו-`.env.local` מוחרג מ-Git.
- קיים Commit או Pull Request שניתן לבחון, וכל הבדיקות שהוגדרו בשלב זה מדווחות למשתמש.

**שער אישור:** יש לעצור ולהציג למשתמש את המסך המקומי ואת תוצאות ה-Definition of Done. אין להתחיל את Milestone 2 ללא אישור מפורש.

## Milestone 2 - יצירת בדיחה בטוחה מקצה לקצה

### שם ומטרה

**מימוש היכולת המרכזית בסביבת Development.**

מטרת אבן הדרך היא לאפשר למשתמש להזין נושא או להשאיר את השדה ריק, ללחוץ על "צרו לי בדיחה" ולקבל בדיחה אחת בעברית, לאחר בדיקות בטיחות לפני ואחרי היצירה.

### מה יש לממש

- הדרכה צעד אחר צעד למשתמש ליצירת OpenAI Project נפרד ל-Development ולהפקת Development API Key.
- שמירת `OPENAI_API_KEY` ב-`.env.local` בלבד והגדרת `OPENAI_MODEL` ללא חשיפתם ל-Frontend.
- מימוש `POST /api/jokes` כ-Next.js Route Handler ב-Node.js Runtime.
- הגדרת `JokeRequest`, ‏`JokeSuccessResponse` ו-`JokeErrorResponse` באמצעות Zod.
- Normalization, ‏Trim וספירת עד 50 Grapheme Clusters, כולל רווחים, עברית ו-Emoji.
- תמיכה בנושא ריק כבקשה תקינה לבדיחה כללית.
- מימוש OpenAI Adapter באמצעות ה-SDK הרשמי:
  - Responses API.
  - Model ID מתוך `OPENAI_MODEL`.
  - `store: false`.
  - Structured Output עם שדה `joke` יחיד.
  - ללא Tools או Conversation State.
- מימוש Safety Policy והגנה מפני התייחסות לנושא כהוראות.
- Input Moderation לנושא שאינו ריק ו-Output Moderation לכל בדיחה באמצעות `omni-moderation-latest`.
- מימוש מצבי UI: ‏`idle`, ‏`loading` ו-`success`.
- הצגת מונה תווים עדכני, מניעת שליחה כפולה בזמן טעינה והצגת הבדיחה בכרטיס התוצאה.
- אפשרות לשנות את הנושא לאחר התוצאה וליצור בדיחה חדשה.
- הוספת Unit Tests, ‏Component Tests ו-API Integration Tests עם OpenAI Mock עבור הזרימות המרכזיות.

### תוצר מצופה

Vertical Slice עובד בסביבת Development: המשתמש יכול ליצור בדיחה בנושא שהוזן או בדיחה כללית, והמערכת מחזירה רק פלט שעבר Validation ו-Moderation ומציגה אותו באותו מסך.

### Definition of Done

- יצירת בדיחה עם נושא תקין עובדת מקצה לקצה מול OpenAI Development Project.
- יצירת בדיחה עם שדה ריק עובדת ומחזירה בדיחה כללית.
- נושא ארוך מ-50 Grapheme Clusters נחסם לפני הקריאה ל-AI.
- נושא שנחסם ב-Input Moderation אינו נשלח ל-Responses API.
- בדיחה שנחסמה ב-Output Moderation אינה מוחזרת ל-Frontend ואינה מוצגת.
- Structured Output חסר, ריק או לא תקין נדחה.
- בזמן בקשה פעילה מוצג משוב ברור ולא נשלחת בקשה כפולה.
- לאחר הצלחה אפשר לשנות נושא וליצור בדיחה נוספת.
- `OPENAI_API_KEY` אינו מופיע ב-Bundle, ב-Repository, בתשובת API או בלוגים.
- לא נשמרים נושא או בדיחה ב-Local Storage, ‏Session Storage, ‏Cookies, ‏Cache או Database.
- תשובת API מוצלחת כוללת `Cache-Control: no-store`.
- Unit, ‏Component ו-API Integration Tests של הזרימות לעיל עוברים.
- בוצעו Smoke Tests ידניים מצומצמים מול OpenAI Development, ללא שמירת התוכן בלוגים או ב-Test Artifacts.

**שער אישור:** יש לעצור ולהדגים יצירה עם נושא, יצירה ללא נושא וחסימת תוכן. אין להתחיל את Milestone 3 ללא אישור מפורש.

## Milestone 3 - שגיאות, ניסיון חוזר והגנת API

### שם ומטרה

**השלמת התנהגות המוצר במצבים חריגים והקשחת ה-Endpoint.**

מטרת אבן הדרך היא להפוך את היכולת המרכזית לעמידה וברורה גם כאשר הקלט אינו תקין, אין אינטרנט, שירות ה-AI נכשל או מתקבלת תשובה לא בטוחה.

### מה יש לממש

- מימוש מצב UI מסוג `error` ומיפוי Error Codes למיקרו-קופי בטוח וקצר בעברית.
- הצגת "נסו שוב" רק כאשר `retryable: true`.
- ניסיון חוזר ידני עם אותה בקשה, ללא Retry אינסופי ב-Frontend.
- אם ממומש Retry אוטומטי ב-Backend, הוא יוגבל לניסיון יחיד ורק עבור שגיאת רשת או שגיאת 5xx זמנית, בהתאם ל-Architecture.
- Timeout קצר ומפורש לקריאת AI.
- טיפול מלא בקודים:
  - `INVALID_REQUEST`.
  - `TOPIC_TOO_LONG`.
  - `UNSAFE_TOPIC`.
  - `UNSAFE_OUTPUT`.
  - `AI_RATE_LIMITED`.
  - `INVALID_AI_RESPONSE`.
  - `AI_UNAVAILABLE`.
  - `INTERNAL_ERROR`.
- קבלת `application/json` בלבד ובדיקת Same Origin.
- דחיית Origin זר ללא CORS ציבורי.
- החזרת טקסט בטוח בלבד, ללא HTML, ‏Stack Trace או הודעות פנימיות של OpenAI.
- הוספת Security Headers המוגדרים ב-Architecture.
- לוגים תפעוליים מינימליים ללא Request Body, ‏Response Body, נושא, בדיחה או פרטים אישיים.
- הרחבת Tests לכל תרחישי השגיאה והאבטחה.

### תוצר מצופה

האפליקציה נשארת שימושית וברורה בכל המצבים שהוגדרו ב-PRD: המשתמש מקבל הודעה מתאימה באותו מסך, יכול לנסות שוב כאשר הדבר אפשרי ואינו נחשף למידע פנימי.

### Definition of Done

- כל Error Code מוחזר ב-HTTP Status ובמבנה שנקבעו ב-`ARCHITECTURE.md`.
- נושא ארוך או חסום מציג הודעה ללא כפתור ניסיון חוזר אוטומטי.
- שגיאה זמנית, Timeout, ‏Output חסום או תשובת AI לא תקינה מציגים את הפעולה "נסו שוב".
- לחיצה על "נסו שוב" שולחת בקשה אחת בלבד ומשמרת את הנושא הרלוונטי בזיכרון ה-UI בלבד.
- מצב Offline מוצג כשגיאה ברורה והאפליקציה אינה מבטיחה יצירה ללא אינטרנט.
- Origin זר ו-Content-Type שגוי נדחים בבדיקות API.
- כל תשובות `/api/jokes` מסומנות `no-store` ואינן נשמרות ב-Cache.
- Security Headers קיימים ונבדקים.
- אין דליפה של Secrets, תוכן משתמש, פרטי ספק או Stack Traces בתשובות ובלוגים.
- Unit, ‏Component ו-API Integration Tests לכל תרחישי השגיאה עוברים.
- Playwright מאמת לפחות: ניסיון חוזר לאחר תקלה, דחיית נושא ארוך והיעדר שליחה כפולה.

**שער אישור:** יש לעצור ולהציג למשתמש הדגמה של מצבי השגיאה והניסיון החוזר ואת תוצאות בדיקות האבטחה. אין להתחיל את Milestone 4 ללא אישור מפורש.

## Milestone 4 - PWA, נגישות ואיכות חוצת דפדפנים

### שם ומטרה

**השלמת חוויית השימוש והכנת Release Candidate.**

מטרת אבן הדרך היא לוודא שהאפליקציה המעוצבת, הזרימות וה-PWA עובדים באופן נגיש ורספונסיבי במכשירים ובדפדפנים שהוגדרו, ללא שינוי בפיצ'רים.

### מה יש לממש

- Web App Manifest עם שם בעברית, `start_url`, ‏`display: standalone`, ‏Theme Color ו-Background Color מתוך ה-Style Guide.
- אייקוני PWA תקינים, כולל 192x192 ו-512x512.
- Metadata נדרש להתקנה ולתצוגה תקינה בדפדפן.
- ללא Service Worker מותאם אישית וללא תמיכת Offline ביצירת בדיחות.
- השלמת התאמה ל-WCAG 2.2 AA:
  - HTML סמנטי ו-Label מפורש.
  - ניווט מלא במקלדת וסדר Focus הגיוני.
  - Focus נראה.
  - ניגודיות, Target Size, הגדלת טקסט ו-Reflow.
  - `aria-live` לטעינה, לתוצאה ולהודעות שגיאה.
  - אי-הסתמכות על צבע בלבד.
  - תמיכה ב-`prefers-reduced-motion` אם קיימת תנועה.
- התאמה חזותית מלאה ל-Mockup ול-`DESIGN.md` במובייל, Tablet ו-Desktop.
- שמירת תוכן ארוך בכרטיס גמיש וגלילה אנכית תקינה.
- השלמת GitHub Actions עבור Lint, ‏Type Check, ‏Unit, ‏Component, ‏API Integration, ‏E2E ו-Production Build.
- הרצת Playwright ב-Chromium, ‏WebKit ו-Firefox, כולל תצוגות Mobile ו-Desktop.
- בדיקות ידניות עם VoiceOver ב-Safari ועם קורא מסך בדפדפן Chromium.
- בדיקה ידנית של התקנה ופתיחה ב-Standalone על iPhone ועל Android.

### תוצר מצופה

Release Candidate מקומי שעונה על דרישות העיצוב, הנגישות, הרספונסיביות וה-PWA וניתן לבדיקה מלאה לפני חיבור Production.

### Definition of Done

- ה-Manifest תקין וכולל את השדות והאייקונים שנקבעו ב-Architecture.
- האפליקציה ניתנת להתקנה ונפתחת ב-Standalone ב-iPhone וב-Android שנבדקו ידנית.
- יצירת בדיחה ללא חיבור אינה פועלת ומציגה את מצב השגיאה שהוגדר, ללא Cache של בדיחות או תשובות API.
- כל הזרימות ניתנות להפעלה באמצעות מקלדת בלבד.
- `aria-live` מודיע על טעינה, תוצאה ושגיאה בלי להעביר Focus באופן מפתיע.
- בדיקות ניגודיות, Reflow, הגדלת טקסט ו-Target Size עומדות ב-WCAG 2.2 AA.
- אין גלישה אופקית החל מרוחב 320px, והפריסה תקינה ב-Mobile, ‏Tablet ו-Desktop.
- התצוגה תואמת ל-Mockup המאושר: מבנה, צבעים, Typography, Spacing, כרטיס התוצאה ודמות הדביבון.
- כל בדיקות CI עוברות ללא שימוש ב-OpenAI API Key אמיתי.
- Playwright עובר ב-Chromium, ‏WebKit ו-Firefox עבור כל הזרימות המרכזיות.
- תוצאות הבדיקות הידניות עם קוראי מסך ועם מכשירי Mobile מתועדות ומוצגות למשתמש.

**שער אישור:** יש לעצור ולהציג את ה-Release Candidate ואת תוצאות הנגישות, הדפדפנים וההתקנה. אין להתחיל את Milestone 5 ללא אישור מפורש.

## Milestone 5 - Preview, ‏Production והשקה מבוקרת

### שם ומטרה

**פריסה אוטומטית, הפרדת סביבות והגנות תפעוליות.**

מטרת אבן הדרך היא לפרוס את המוצר ל-Vercel דרך GitHub, לבדוק אותו ב-Preview ולהעלות Production עם Secrets נפרדים, הגנת שימוש ועלויות ויכולת Rollback.

### מה יש לממש

- חיבור ה-GitHub Repository ל-Vercel והגדרת Deployment אוטומטי.
- הגדרת Node.js 24 LTS וסביבת ההרצה שנקבעה ב-Architecture.
- Preview Deployment אוטומטי לכל Pull Request.
- הפעלת Vercel Authentication על Preview Deployments.
- הדרכה צעד אחר צעד למשתמש להגדרת:
  - OpenAI Project ו-API Key נפרדים ל-Production.
  - `OPENAI_API_KEY` ו-`OPENAI_MODEL` ב-Vercel Production בלבד.
  - Development או Preview Key מוגבל עבור Preview, ללא שימוש ב-Production Key.
  - OpenAI Hard Spend Limit והתראות ב-50%, ‏80% ו-100%, בסכום שיאושר על ידי המשתמש.
  - Vercel Spend Management והתראות שימוש.
- הגדרת הדומיין הציבורי ו-`APP_ORIGIN` הנדרש.
- הפעלת Vercel Bot Protection על `/api/jokes` במצב Challenge ובדיקה שאינו פוגע בנגישות או בשימוש לגיטימי.
- שמירת Vercel DDoS Protection פעילה.
- הגנת ענף `main` ודרישה שכל Status Checks יעברו לפני Merge.
- Merge ל-`main` רק לאחר אישור Preview, לצורך Production Deployment אוטומטי.
- Smoke Tests מצומצמים ב-Production עבור נושא תקין, נושא ריק, שגיאה ניתנת לניסיון חוזר והתקנת PWA.
- בדיקת היעדר Analytics, ‏Speed Insights, שמירת תוכן ולוגים רגישים.
- תרגול או תיעוד ברור של Rollback ל-Deployment תקין קודם.

### תוצר מצופה

אפליקציית Production ציבורית ב-HTTPS, המתעדכנת אוטומטית לאחר Merge מאושר ל-`main`, עם Preview מוגן, Secrets מופרדים, בקרת עלויות והגנות תפעוליות.

### Definition of Done

- Pull Request יוצר Preview Deployment אוטומטי ומוגן, וכל בדיקות CI עוברות לפני Merge.
- Preview אינו מקבל את Production API Key.
- Production משתמש ב-OpenAI Project וב-Key נפרדים ואינו חושף אותם לדפדפן או ל-Repository.
- Merge מאושר ל-`main` מפעיל Production Deployment אוטומטי ללא שלב פריסה ידני.
- הדומיין הציבורי פועל ב-HTTPS והאפליקציה נטענת בעברית וב-RTL.
- יצירת בדיחה בנושא ויצירת בדיחה כללית עובדות ב-Production.
- טיפול בשגיאות, "נסו שוב", Moderation ומניעת שליחה כפולה עובדים ב-Production.
- Hard Spend Limit והתראות OpenAI הוגדרו בסכום שאושר, והתראות Vercel פעילות.
- Bot Protection ו-DDoS Protection פעילים ונבדקו ללא פגיעה מהותית בנגישות או במשתמשים לגיטימיים.
- Vercel Web Analytics ו-Speed Insights אינם פעילים.
- אין Request Body, ‏Response Body, נושא או בדיחה בלוגים.
- PWA ניתנת להתקנה מהדומיין הציבורי ונפתחת ב-Standalone.
- קיימת גרסת Production קודמת או דרך מתועדת ומאומתת לביצוע Rollback.
- תוצאות Smoke Tests והבדיקות התפעוליות מוצגות למשתמש, כולל כל בדיקה שלא ניתן היה להריץ.

**שער אישור סופי:** יש לעצור ולהציג למשתמש את כתובת Production, מצב ה-CI, תוצאות ה-Smoke Tests וההגנות שהוגדרו. הפרויקט נחשב מוכן להשקה רק לאחר אישור מפורש של המשתמש.

## מגבלות החלוקה

- אין Milestone עבור Database, ‏Migrations, ‏Authentication, ‏Analytics, אחסון קבצים או Offline Support, משום שרכיבים אלה מחוץ לטווח.
- אין Milestone לפיצ'רים כגון שיתוף, העתקה, מועדפים, דירוג או היסטוריה.
- שינוי מדיניות השימוש, הוספת Rate Limit גלוי או שינוי מודל התמחור מחייבים עדכון של מסמכי המוצר לפני פיתוחם.
