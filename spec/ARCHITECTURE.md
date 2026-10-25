# ARCHITECTURE - רגע של צחוק

## מטרת המסמך

מסמך זה מתרגם את דרישות ה-PRD של "רגע של צחוק" לארכיטקטורה טכנית מעשית. התכנון מכוון למוצר קטן, ציבורי וללא הרשמה, הכולל מסך אחד ו-Backend מאובטח לצורך יצירת בדיחות באמצעות OpenAI API.

העקרונות המנחים הם:

- מינימום רכיבים ושירותים.
- שמירת ה-API Key בצד השרת בלבד.
- ללא Database, Authentication, אחסון קבצים או Analytics.
- תמיכה מלאה בעברית, RTL, מובייל, טאבלט ו-Desktop.
- תוכן בטוח ומתאים לכל הגילים.
- פריסה אוטומטית ופשוטה מ-GitHub ל-Vercel.
- עלויות ניתנות לבקרה ותחזוקה פשוטה גם בפיתוח באמצעות AI.

## 1. Technology Stack שנבחר

### 1.1 טבלת רכיבים

| תחום | טכנולוגיה שנבחרה | תפקיד במערכת |
|---|---|---|
| שפה | TypeScript 5.x | טיפוסים משותפים ל-Frontend ול-Backend, צמצום שגיאות ושיפור עבודה עם כלי AI |
| Runtime | Node.js 24 LTS | סביבת ההרצה המקומית וב-Vercel Functions |
| Full-stack Framework | Next.js 16, App Router | בניית ה-Frontend, יצירת Backend באמצעות Route Handler, ניהול Metadata ו-Web App Manifest |
| UI | React 19 | ניהול טופס, מצבי טעינה, הצלחה ושגיאה במסך היחיד |
| עיצוב | CSS Modules ו-CSS תקני | עיצוב רספונסיבי, RTL ונגיש ללא תלות ב-UI Framework נוסף |
| אימות נתונים | Zod | אימות Runtime של בקשות API ושל תשובות מובנות מהמודל |
| OpenAI SDK | חבילת `openai` הרשמית ל-JavaScript/TypeScript | תקשורת מאובטחת מה-Backend אל OpenAI API |
| מודל יצירה | `gpt-5.6-terra` | יצירת בדיחה קצרה בעברית, באיזון בין איכות לעלות |
| API ליצירה | OpenAI Responses API | יצירת פלט טקסט מובנה ו-Stateless עם `store: false` |
| בטיחות תוכן | `omni-moderation-latest` | בדיקת הנושא לפני היצירה ובדיקת הבדיחה לפני הצגתה |
| PWA | Web App Manifest מובנה של Next.js ו-HTTPS | התקנה במסך הבית ופתיחה במצב `standalone`, ללא תמיכת Offline |
| Hosting | Vercel | אירוח ה-Frontend וה-Backend באותו Project, HTTPS, CDN ו-Vercel Functions |
| Source Control | Git ו-GitHub | ניהול קוד, היסטוריה ובקרת שינויים. עבודה ישירה על ענף `main` |
| CI | GitHub Actions | הרצת Lint, בדיקת TypeScript, בדיקות אוטומטיות ו-Build בכל Push |
| בדיקות יחידה ורכיבים | Jest ו-React Testing Library | בדיקת Validation, מצבי UI והתנהגות רכיבים מנקודת מבט המשתמש |
| בדיקות End-to-End | Playwright | בדיקת הזרימות המרכזיות ב-Chromium, כולל תצוגות מובייל. Safari נבדק ידנית ב-iPhone |
| Package Manager | npm עם `package-lock.json` | התקנות עקביות, ללא כלי ניהול נוסף |

### 1.2 החלטות מרכזיות ונימוקים

#### Next.js במקום Frontend ו-Backend נפרדים

נבחר Next.js משום שהוא מאפשר להחזיק באותו Codebase את המסך היחיד ואת Endpoint השרת הנדרש ל-OpenAI. כך אין צורך בפרויקט Backend נפרד, ב-CORS בין שירותים או בשתי מערכות Deployment.

`Route Handler` של Next.js מתאים ל-API קטן המבצע Validation, Moderation וקריאה לשירות חיצוני. Vercel תומכת ב-Next.js ישירות ומבצעת Build ו-Deployment אוטומטיים מתוך GitHub.

חלופות שנבחנו:

- React עם Vite ו-Vercel Function נפרדת: פתרון תקין, אך דורש יותר Configuration וחלוקה מלאכותית לשני חלקים.
- Astro עם Server Endpoint: קל ומהיר לתוכן סטטי, אך אינו מפשט את המוצר יותר מ-Next.js ואינו מציע יתרון משמעותי למסך האינטראקטיבי ול-Backend הנדרש.

#### CSS Modules במקום UI Framework

המוצר כולל מסך אחד ומספר קטן של רכיבים. CSS Modules מספק בידוד סגנונות, תמיכה מלאה ב-RTL ורספונסיביות, ללא תלות נוספת וללא מערכת עיצוב כבדה. אין הצדקה ל-Tailwind CSS או לספריית Components בגרסה זו.

#### `gpt-5.6-terra` במקום `gpt-5`

ה-PRD המקורי הגדיר `gpt-5`. במהלך המחקר נמצא כי `gpt-5` מסומן Deprecated ומתוכנן להיסגר ב-11 בדצמבר 2026. בהסכמת המשתמש הוחלף המודל ב-`gpt-5.6-terra`.

`gpt-5.6-terra` מתאים למשימה קצרה וממוקדת, תומך ב-Structured Outputs ומאזן בין איכות לעלות. אין צורך ביכולות היקרות יותר של מודל Flagship לצורך יצירת בדיחה קצרה.

#### Responses API במצב Stateless

המערכת תשתמש ב-Responses API עם `store: false`. כל יצירה היא בקשה עצמאית, ללא Conversation, ללא `previous_response_id` וללא שמירת State.

הפלט יוגדר כ-Structured Output בעל שני שדות:

```text
{
  "status": "ok" | "unsuitable",
  "joke": "בדיחה בעברית, או מחרוזת ריקה כאשר status הוא unsuitable"
}
```

השדה `status` מאפשר למודל לסרב לנושא שנמצא ברשימת הנושאים החסומים של ה-PRD, גם כאשר Moderation לא סימן אותו. סירוב מוחזר למשתמש כשגיאת `UNSAFE_TOPIC`.

ה-Backend יאמת את התוצאה באמצעות Zod לפני החזרתה ל-Frontend.

#### Moderation בשני שלבים

Moderation יתבצע בנפרד לפני ואחרי היצירה:

1. בדיקת הנושא לפני הקריאה למודל, כדי לא ליצור תוכן בנושא שנחסם.
2. בדיקת הבדיחה שנוצרה לפני הצגתה למשתמש.

שילוב Prompt מגביל עם Moderation נותן מענה טוב יותר לדרישת התוכן לכל הגילים מאשר הסתמכות על Prompt בלבד. עם זאת, מדובר בסינון הסתברותי ולא בהבטחה מוחלטת שכל פלט יהיה מושלם.

#### Vercel ולא GitHub Pages

GitHub Pages מתאים ל-Frontend סטטי בלבד. במוצר זה נדרש Backend כדי להסתיר את ה-OpenAI API Key, ולכן GitHub Pages אינו מתאים. Vercel מאפשרת לארח את ה-Frontend ואת ה-Backend באותו Deployment ומתחברת ישירות ל-GitHub.

### 1.3 עלויות צפויות

המחירים הבאים נכונים למועד המחקר, 25 באוקטובר 2026, ואומתו שוב באותו יום מול דף המודל של OpenAI. יש לבדוק אותם שוב לפני ההשקה:

- `gpt-5.6-terra`: ‏$2 למיליון Input Tokens ו-$12 למיליון Output Tokens.
- `omni-moderation-latest`: השימוש ב-Moderation Endpoint אינו כרוך בתשלום לפי התיעוד הרשמי.
- Vercel Hobby: חינם. זו התוכנית שנבחרה.
- דומיין מותאם אישית: עלות נפרדת בהתאם לספק ולסיומת.

המוצר הוא פרויקט אישי ולא מסחרי, ולכן נבחרה תוכנית Hobby. כאשר עוברים את המכסה החינמית, Vercel עוצרת את האתר עד תחילת החודש הבא, בלי חיוב. אם המוצר יהפוך למסחרי, יש לעבור ל-Vercel Pro (‏$20 לחודש).

כתובת האתר תהיה הכתובת החינמית ש-Vercel מספקת (`<project>.vercel.app`). אין צורך בדומיין קנוי. אפשר להוסיף דומיין בהמשך.

עלות OpenAI תלויה באורך ה-Prompt, בנושא ובבדיחה. לצורך המחשה בלבד, בקשה הכוללת 500 Input Tokens ו-100 Output Tokens תעלה בקירוב $0.0022, לפני הבדלים בפועל. Moderation אינו נכלל בחישוב משום שהוא חינמי לפי המחירון הנוכחי.

### 1.4 סיכונים ומגבלות

| סיכון או מגבלה | משמעות | מענה מתוכנן |
|---|---|---|
| שירות ציבורי ללא Login וללא מגבלת שימוש למשתמש | אפשרות לניצול לרעה ולעלויות OpenAI בלתי צפויות | Rate Limit ב-Vercel Firewall (20 בקשות בדקה לכל IP), DDoS Protection, Hard Spend Limit והתראות תקציב |
| AI הוא שירות חיצוני והסתברותי | ייתכנו שגיאות, Latency או תוכן לא מתאים | Prompt קשיח, Input Moderation, Output Moderation, Timeout, טיפול בשגיאות וכפתור "נסו שוב" |
| `gpt-5.6-terra` עשוי להשתנות או לצאת משימוש בעתיד | צורך בהחלפת מודל | Model ID נשמר ב-Environment Variable ומבודד מאחורי Adapter פנימי |
| Vercel Functions הן Serverless | Cold Start ומגבלות Runtime אפשריות | פונקציה יחידה וקלה, Node.js Runtime, Timeout קצר וללא תלויות כבדות |
| אין Database | אין היסטוריה, התאמה אישית או Audit של תוכן | תואם ל-PRD. כל בקשה עצמאית וזמנית |
| `store: false` אינו מבטל בהכרח Abuse Monitoring של הספק | OpenAI עשויה לשמור Abuse Monitoring Logs עד 30 יום בחשבון רגיל | תיעוד מפורש, הימנעות ממידע אישי, ובחינת Zero Data Retention אם תהיה דרישת פרטיות מחמירה יותר |
| Rate Limit לפי IP אינו חוסם ניצול מכתובות רבות | שימוש חריג מבוזר עדיין אפשרי | Hard Spend Limit ב-OpenAI ומעקב עלויות |

## 2. ארכיטקטורת המערכת

### 2.1 מבט על

המערכת תהיה Monolith קטן של Next.js, הפרוס כ-Vercel Project יחיד:

```text
דפדפן או PWA מותקנת
        │
        │ HTTPS
        ▼
Vercel CDN
  ├─ Frontend סטטי: Next.js + React + CSS
  └─ POST /api/jokes: Vercel Function ב-Node.js
                       │
                       ├─ Validation ו-Safety Policy
                       ├─ OpenAI Moderation API
                       ├─ OpenAI Responses API
                       └─ OpenAI Moderation API
```

לא יהיו:

- Database.
- Authentication או Authorization למשתמשים.
- Object Storage או העלאת קבצים.
- Queue, Worker או Background Job.
- Analytics או Tracking.
- API Gateway נפרד.
- שירות Backend נוסף.

### 2.2 רכיבים ואחריות

#### Frontend

אחריות ה-Frontend:

- הצגת הממשק בעברית וב-RTL.
- הצגת שם המוצר "רגע של צחוק".
- קבלת נושא באורך של עד 50 תווים: השדה חוסם הקלדה והדבקה מעבר ל-50, לפי אותה ספירת Grapheme Clusters שבשרת (ולא לפי `maxLength` של HTML, שסופר אימוג'י כשני תווים).
- תמיכה בשדה ריק לצורך בדיחה כללית.
- הצגת המצבים `idle`, ‏`loading`, ‏`success` ו-`error`.
- מניעת שליחה כפולה בזמן שבקשה פעילה.
- הצגת הבדיחה או הודעת שגיאה בעברית.
- הצגת הכפתור "נסו שוב" במקרה של תקלה הניתנת לניסיון חוזר.
- אפשרות להחליף את הנושא ולשלוח בקשה חדשה.
- רישום Web App Manifest והצגת Metadata ואייקונים מתאימים.

ה-Frontend לא יתקשר ישירות עם OpenAI ולא יקבל גישה ל-API Key.

#### Backend API

ה-Backend ימומש כ-Next.js Route Handler יחיד:

```text
POST /api/jokes
```

אחריות ה-Backend:

- קבלת בקשות JSON בלבד.
- בדיקת Origin והגבלת שימוש ל-Same Origin: ה-Host שבכותרת `Origin` חייב להיות זהה ל-Host שאליו נשלחה הבקשה. כך הבדיקה עובדת בכל כתובת (Localhost, כתובת Vercel או דומיין) בלי רשימת כתובות קבועה. זו הגנה מפני שימוש מאתרים אחרים בדפדפן, ולא מפני סקריפטים, שיכולים לזייף את הכותרת.
- אימות הקלט מחדש, גם אם כבר נבדק ב-Frontend.
- Normalization, ‏Trim וספירת עד 50 תווים נראים למשתמש.
- בדיקת הנושא ב-Moderation API כאשר הוזן נושא.
- יצירת בדיחה באמצעות Responses API.
- בדיקת מבנה התשובה ותוכנה.
- בדיקת הבדיחה ב-Moderation API.
- החזרת JSON אחיד ללא פרטים פנימיים או מידע רגיש.
- סימון כל תשובה באמצעות `Cache-Control: no-store`.

#### OpenAI Adapter

שכבה לוגית מבודדת תרכז את כל התקשורת עם OpenAI:

- Model ID מתוך `OPENAI_MODEL`.
- API Key מתוך `OPENAI_API_KEY`.
- הוראות יצירת הבדיחה.
- קריאה ל-Responses API עם `store: false`.
- Structured Output ואימותו.
- Timeout ו-Retry מוגבל.
- מיפוי שגיאות OpenAI לשגיאות פנימיות יציבות.

בידוד זה מאפשר להחליף מודל בעתיד בלי לשנות את ה-UI או את חוזה ה-API.

#### Safety Policy

שכבת Safety תרכז את כללי התוכן:

- התוכן יהיה בעברית.
- התוכן יתאים לכל הגילים.
- אין ליצור תוכן מיני, אלים, מפלה, שונא או פוגעני.
- נושאים מהתחומים החסומים ב-PRD (מין; פוליטיקה ובחירות; מוות, מחלות ואסונות; אלכוהול, סמים והימורים) יקבלו `status: "unsuitable"` ולא בדיחה. Moderation לבדו אינו מזהה את רובם, ולכן ההוראות למודל הן שכבת ההגנה העיקרית עבורם.
- הנושא הוא Data בלבד ואינו רשאי לשנות את הוראות המערכת.
- אין לבצע הוראות, Code או Prompt שמופיעים בתוך הנושא.
- יש ליצור בדיחה אחת בלבד, קצרה ומתאימה להצגה במובייל.

כללים אלה יישמרו בקוד וייבדקו באמצעות Tests. אין להשתמש ב-Reusable Prompt חיצוני או ב-Prompt הנשמר בשירות חיצוני.

### 2.3 חלוקה ל-Modules ולשכבות לוגיות

```text
Presentation
  ├─ JokeForm
  ├─ JokeResult
  ├─ StatusMessage
  └─ PWA Metadata

Application
  ├─ UI State
  ├─ Submit Flow
  └─ Error Mapping למיקרו-קופי בעברית

API
  └─ POST /api/jokes

Domain
  ├─ Topic Validation
  ├─ Joke Validation
  ├─ Safety Policy
  └─ Stable Error Codes

Infrastructure
  ├─ OpenAI Responses Client
  ├─ OpenAI Moderation Client
  ├─ Runtime Configuration
  └─ Minimal Operational Logging
```

אין צורך ב-Repository Layer או ב-Data Access Layer משום שאין נתונים לשמירה.

### 2.4 Data Model

אין במערכת ישויות מתמידות ואין Database. קיימים רק מבני נתונים זמניים לאורך חיי הבקשה.

#### JokeRequest

| שדה | סוג | חובה | כללים |
|---|---|---|---|
| `topic` | `string` | לא | לאחר Trim יכול להיות ריק; עד 50 Grapheme Clusters כולל רווחים. המונה ב-Frontend סופר באותה שיטה |

#### JokeSuccessResponse

| שדה | סוג | חובה | כללים |
|---|---|---|---|
| `joke` | `string` | כן | עברית, ערך לא ריק, טקסט רגיל בלבד |

#### JokeErrorResponse

| שדה | סוג | חובה | תפקיד |
|---|---|---|---|
| `error.code` | `string` | כן | קוד יציב להתנהגות ה-Frontend |
| `error.message` | `string` | כן | הודעה בטוחה בעברית להצגה למשתמש |
| `error.retryable` | `boolean` | כן | האם להציג את הכפתור "נסו שוב" |

אין לשמור מבנים אלה ב-Local Storage, ‏Session Storage, ‏Cookies או Cache. State של ה-React Component קיים בזיכרון בלבד ונמחק ברענון או בסגירת הדף.

### 2.5 API Contract

#### Request

```http
POST /api/jokes
Content-Type: application/json
```

```json
{
  "topic": "חתולים"
}
```

או לצורך בדיחה כללית:

```json
{
  "topic": ""
}
```

#### Success

```http
200 OK
Cache-Control: no-store
```

```json
{
  "joke": "..."
}
```

#### שגיאות צפויות

| HTTP Status | `error.code` | מצב | `retryable` |
|---|---|---|---|
| 400 | `INVALID_REQUEST` | JSON לא תקין או מבנה בקשה שגוי | `false` |
| 400 | `TOPIC_TOO_LONG` | הנושא ארוך מ-50 תווים | `false` |
| 422 | `UNSAFE_TOPIC` | הנושא נחסם ב-Moderation, או שהמודל החזיר `status: "unsuitable"` | `false` |
| 422 | `UNSAFE_OUTPUT` | הבדיחה שנוצרה לא עברה בדיקת בטיחות | `true` |
| 429 | `AI_RATE_LIMITED` | OpenAI דחתה זמנית את הבקשה בגלל עומס או מכסה | `true` |
| 502 | `INVALID_AI_RESPONSE` | התקבלה תשובה חסרה או לא תקינה | `true` |
| 503 | `AI_UNAVAILABLE` | שירות ה-AI אינו זמין או שהגיע ל-Timeout | `true` |
| 500 | `INTERNAL_ERROR` | תקלה פנימית בלתי צפויה | `true` |
| — | `NETWORK_ERROR` | נקבע ב-Frontend בלבד, כשהבקשה לא הגיעה לשרת (אין אינטרנט או נפילת חיבור) | `true` |

ה-Frontend יתבסס על `error.code` ולא על טקסט השגיאה לצורך בחירת ההתנהגות. הודעות פנימיות של OpenAI, ‏Stack Traces ו-Request Details לא יוחזרו לדפדפן.

### 2.6 OpenAI Request Configuration

#### יצירת הבדיחה

הקריאה ל-Responses API תשתמש בעקרונות הבאים:

- `model`: הערך של `OPENAI_MODEL`, וב-Production ‏`gpt-5.6-terra`.
- `store: false`.
- ללא Conversation וללא שמירת State.
- `reasoning.effort: none`, משום שהמשימה קצרה ואינה דורשת Reasoning מורכב.
- `text.verbosity: low`, אם המודל תומך בו. דף המודל אינו מזכיר את הפרמטר, ולכן יש לוודא זאת בבדיקה הראשונה מול OpenAI ולהסיר אותו אם הוא נדחה.
- Structured Output עם השדות `status` ו-`joke`.
- `max_output_tokens: 300`, כדי לצמצם Latency ועלות. עברית צורכת יותר Tokens מאנגלית, והמגבלה משאירה מקום לבדיחה של כמה משפטים.
- ללא Tools, ‏Web Search, ‏File Search או Function Calling.

#### Moderation

המערכת תשתמש ב-`omni-moderation-latest`:

- נושא ריק לא דורש Input Moderation.
- נושא שאינו ריק ייבדק לפני יצירת בדיחה.
- כל בדיחה שנוצרה תיבדק לפני החזרתה ל-Frontend.
- כל תוצאה שבה `flagged: true` תיחסם.
- אין להסתמך על `category_scores` כעל Threshold קבוע, משום שהמודל עשוי להתעדכן. ההחלטה הראשית תתבסס על Flags קטגוריאליים ועל Prompt התוכן.

### 2.7 Data Flow

#### יצירה עם נושא

```text
1. המשתמש מזין נושא ולוחץ על פעולת היצירה.
2. ה-Frontend מבצע בדיקת אורך ראשונית ועובר למצב loading.
3. ה-Frontend שולח POST /api/jokes.
4. ה-Backend בודק Origin, Content-Type ומבנה JSON.
5. ה-Backend מנרמל את הנושא ובודק עד 50 תווים.
6. ה-Backend שולח את הנושא ל-Moderation API.
7. אם הנושא נחסם, מוחזרת שגיאת UNSAFE_TOPIC ללא יצירת בדיחה.
8. אם הנושא תקין, ה-Backend שולח Prompt ל-Responses API.
9. ה-Backend מאמת את ה-Structured Output. אם `status` הוא `unsuitable`, מוחזרת שגיאת UNSAFE_TOPIC.
10. ה-Backend שולח את הבדיחה ל-Moderation API.
11. אם הבדיחה נחסמת, היא נמחקת מהזיכרון ואינה מוחזרת למשתמש.
12. אם הבדיחה תקינה, מוחזר { joke } עם Cache-Control: no-store.
13. ה-Frontend מציג את הבדיחה באזור נגיש באותו מסך.
```

#### יצירה ללא נושא

הזרימה זהה, למעט דילוג על Input Moderation ושליחת בקשה ליצירת בדיחה כללית.

#### שגיאה וניסיון חוזר

במקרה של שגיאה הניתנת לניסיון חוזר, ה-Frontend יציג הודעה בעברית ואת הכפתור "נסו שוב". לחיצה עליו שולחת מחדש את אותה בקשה פעם אחת לפי פעולת המשתמש. אין Retry אינסופי ב-Frontend.

ב-Backend מותר Retry אוטומטי יחיד רק עבור שגיאת רשת או שגיאת 5xx זמנית, ורק אם נשארו לפחות 12 שניות מתקציב הזמן של הבקשה. אין לבצע Retry עבור Validation, ‏Moderation, ‏429 או שגיאת תקציב.

#### תקציב זמנים

| שלב | זמן מרבי |
|---|---|
| Input Moderation | 5 שניות |
| יצירת הבדיחה (כל ניסיון) | 10 שניות |
| Output Moderation | 5 שניות |
| כל הבקשה בשרת (`maxDuration` של הפונקציה) | 30 שניות |
| המתנה בדפדפן עד שמוצגת שגיאה | 32 שניות |

חריגה מזמן של שלב מחזירה `AI_UNAVAILABLE`. המתנה בדפדפן שעברה את המגבלה מוצגת כמו `AI_UNAVAILABLE`.

### 2.8 PWA

ה-PWA תתבסס על היכולות המובנות של Next.js:

- `manifest` עם `name` ו-`short_name` בעברית.
- `lang="he"` ו-`dir="rtl"` ברמת מסמך ה-HTML.
- `start_url: "/"`.
- `display: "standalone"`.
- `theme_color` ו-`background_color` לפי סעיף "סמל האפליקציה (PWA)" ב-`DESIGN.md`.
- אייקונים תקינים בגדלים הנדרשים, לרבות 192x192 ו-512x512.
- HTTPS המסופק אוטומטית ב-Vercel.

לא יתווסף Service Worker מותאם אישית ב-MVP. לפי תיעוד Next.js, Manifest תקין ו-HTTPS מספיקים להתקנה בדפדפנים מודרניים, וניתן להציג Install Prompt ללא Offline Support. החלטה זו מונעת Cache לא רצוי של נושאים, בדיחות או תשובות API ומתאימה לכך ש-Offline הוא Out of Scope.

אין להבטיח שהמוצר ייצור בדיחות ללא אינטרנט. כאשר אין חיבור, ה-UI יציג שגיאה ויאפשר "נסו שוב".

## 3. אבטחה ופרטיות

### 3.1 Secrets ו-Configuration

פרטי הגישה לא יישמרו ב-GitHub ולא ייחשפו ל-Frontend.

| משתנה | Development מקומי | Vercel Preview | Vercel Production |
|---|---|---|---|
| `OPENAI_API_KEY` | המפתח של OpenAI Project היחיד, בתוך `.env` | לא בשימוש (ראו 5.3) | אותו מפתח, מוגדר ב-Vercel |
| `OPENAI_MODEL` | `gpt-5.6-terra` | לא בשימוש | `gpt-5.6-terra` |

כללים:

- `.env` ייכלל ב-`.gitignore`.
- אין להשתמש בקידומת `NEXT_PUBLIC_` עבור Secret כלשהו.
- ב-Vercel המפתח יוגדר רק ב-Production Environment.
- CI יבצע Tests עם Mock ולא יקבל OpenAI API Key אמיתי.
- נעשה שימוש ב-OpenAI Project יחיד ובמפתח יחיד לפיתוח ול-Production. השימוש בפיתוח נספר באותה תקרת הוצאות. אם המפתח נחשף, מחליפים אותו גם ב-`.env` וגם ב-Vercel.
- יש לבצע Rotation מיד אם מפתח נחשף או נכלל בטעות ב-Commit.

### 3.2 הגנת ה-API

- Endpoint יחיד מסוג POST.
- קבלת `application/json` בלבד.
- בדיקת Same Origin ודחיית Origin זר.
- אין להגדיר CORS ציבורי.
- Validation בצד השרת הוא מקור האמת.
- נושא המשתמש משולב ב-Prompt כ-Data מופרד ולא כהוראות.
- תוצאת המודל מוחזרת ומוצגת כטקסט בלבד, לעולם לא כ-HTML.
- כל תשובות ה-API מסומנות `no-store`.
- יש להגדיר Security Headers: ‏Content-Security-Policy, ‏X-Content-Type-Options, ‏Referrer-Policy, ‏Permissions-Policy ו-Frame-Ancestors.
- Vercel DDoS Protection נשאר פעיל.
- יש להגדיר כלל Rate Limit ב-Vercel Firewall על `POST /api/jokes`: עד 20 בקשות בדקה לכל כתובת IP, ומעבר לכך תשובת 429. הכלל מוגדר בלוח הבקרה של Vercel, ללא קוד, וללא שמירת IP באפליקציה. יש לוודא שהכלל זמין בתוכנית Vercel שנבחרה.
- בתוכנית Hobby מותר כלל Rate Limit אחד לכל פרויקט, בשיטת Fixed Window. אם הפעולה 429 אינה זמינה בתוכנית, יש לבחור Deny (תשובת 403).
- תשובות ה-Firewall אינן בפורמט ה-JSON של האפליקציה. ה-Frontend יתייחס לכל תשובת 429, ולכל 403 שאינה בפורמט האפליקציה, כאל `AI_RATE_LIMITED`.
- אין להפעיל Bot Protection במצב Challenge על `/api/jokes`. Challenge מיועד לדפים, ועלול לחסום את הבקשות שהדף שולח ברקע.

ה-Rate Limit הוא הגנה נגד ניצול שאושרה ב-PRD, ולא מכסת שימוש גלויה. שינוי של הסף מחייב עדכון ה-PRD.

### 3.3 פרטיות ושמירת מידע

האפליקציה עצמה לא תשמור:

- נושאים שהוזנו.
- בדיחות שנוצרו.
- כתובות IP בתוך Application Logs.
- מזהים, Cookies או Fingerprints.
- Analytics, ‏Telemetry מוצרי או Session Replay.

אין להפעיל Vercel Web Analytics או Speed Insights. אין לכתוב ללוגים Request Body, ‏Response Body, נושא או בדיחה. לוג תפעולי מותר יכלול רק מידע מינימלי כגון קוד שגיאה פנימי, משך בקשה ו-OpenAI Request ID לצורך איתור תקלה, ללא תוכן המשתמש.

הבקשות ל-OpenAI יישלחו עם `store: false`, ולכן לא תישמר Application State של ה-Response. עם זאת, בחשבון OpenAI רגיל ייתכן ש-Prompts ו-Responses יישמרו ב-Abuse Monitoring Logs למשך עד 30 יום. OpenAI מציינת שנתוני API אינם משמשים לאימון המודלים אלא אם הלקוח בוחר בכך במפורש.

אם נדרשת מדיניות של אפס שמירת תוכן גם אצל ספק ה-AI, יש לקבל אישור ל-Zero Data Retention מ-OpenAI. זו אינה יכולת שמובטחת אוטומטית לכל חשבון.

### 3.4 שליטה בעלויות ושימוש חריג

מכיוון שהמוצר פתוח וללא Login או מכסה למשתמש:

- יש ליצור OpenAI Project ייעודי לאפליקציה, נפרד משימושים אחרים בחשבון.
- יש להגביל את Project לשימוש רק במודלים הנדרשים.
- יש להגדיר Monthly Hard Spend Limit בסכום עסקי שיאושר לפני ההשקה.
- יש להגדיר Alerts ב-50%, ‏80% ו-100% מהתקציב.
- בתוכנית Hobby אין חיוב על חריגה: האתר נעצר עד החודש הבא. יש לעקוב אחרי השימוש בלוח הבקרה של Vercel.
- יש לעקוב אחרי חריגות באמצעות Dashboards של הספקים, בלי להוסיף Analytics למוצר.

לפי התיעוד של OpenAI, תקרה קשיחה מוגדרת ב-Project Settings ← Limits ← Spend, ולאחר שהיא מתמלאת OpenAI מחזירה שגיאה 429 עם הקוד `project_spend_limit_exceeded`. דיווחים בקהילה מ-2026 מצביעים על כך שהאכיפה לא תמיד מיידית, ושבחלק מהחשבונות מופיעות רק התראות. לכן, בעת ההגדרה יש לוודא שהאפשרות לאכוף תקרה קשיחה קיימת בחשבון, ולא להסתמך על התקרה כגבול כספי מדויק. השגיאה הזו ממופה ל-`AI_RATE_LIMITED`.

Hard Spend Limit הוא אמצעי תשתיתי ולא מכסת משתמש. כאשר הוא מגיע לתקרה, יצירת בדיחות תיכשל באופן זמני והמשתמש יקבל הודעת שירות כללית. האכיפה עשויה להתעכב מעט ולכן העלות בפועל עלולה לחרוג במעט מהסכום שהוגדר.

## 4. נגישות ותאימות

### 4.1 יעד נגישות

יעד היישום יהיה WCAG 2.2 ברמה AA:

- HTML סמנטי ו-Label מפורש לשדה הנושא.
- כל הפעולות זמינות במקלדת.
- Focus נראה וברור.
- סדר Focus הגיוני.
- ניגודיות צבעים תקינה.
- Target Size מתאים לשימוש במגע.
- תמיכה בהגדלת טקסט וב-Reflow.
- אין להסתמך על צבע בלבד להעברת מצב.
- `aria-live` מתאים להצגת מצב טעינה, בדיחה חדשה והודעות שגיאה.
- אין להעביר Focus באופן מפתיע.
- תמיכה ב-`prefers-reduced-motion` אם יש אנימציות.
- בדיקה ידנית עם VoiceOver לפחות ב-Safari ועם קורא מסך בדפדפן Chromium.

### 4.2 דפדפנים ומכשירים

התמיכה תכוון לגרסאות עדכניות של:

- Chrome ו-Edge מבוססי Chromium.
- Safari ב-iPhone, ‏iPad ו-macOS.
- Firefox.
- תצוגות מובייל החל מרוחב 320 CSS Pixels, טאבלט ו-Desktop.

Next.js 16 תומך כברירת מחדל ב-Chrome 111+, ‏Edge 111+, ‏Firefox 111+ ו-Safari 16.4+. ספירת התווים משתמשת ב-`Intl.Segmenter`, שנתמך ב-Firefox רק מגרסה 125, ולכן גרסת המינימום של Firefox היא 125. אין צורך בגרסה ייעודית לכל פלטפורמה.

## 5. תשתיות, GitHub ו-Deployment

### 5.1 מבנה Repository

- קוד המוצר ינוהל ב-Git Repository ב-GitHub.
- ענף `main` יהיה מקור האמת ל-Production.
- העבודה מתבצעת ישירות על `main`, ללא ענפים נפרדים, Pull Requests או Branch Protection. Commit ו-Push מתבצעים רק לאחר שהמשתמש בדק ואישר את ה-Milestone, לפי הנוהל ב-`CLAUDE.md`.
- `package-lock.json` יישמר ב-Repository.
- Secrets וקובצי `.env*` מקומיים לא ייכללו ב-Repository.
- אין צורך ב-Monorepo או במספר Repositories.

### 5.2 Continuous Integration

GitHub Actions יריץ בכל Push ל-`main`:

1. Checkout של הקוד.
2. התקנת Node.js 24 LTS.
3. `npm ci`.
4. Lint.
5. Type Check.
6. Unit ו-Component Tests.
7. Production Build.
8. בדיקות E2E מרכזיות עם OpenAI API מדומה, ללא שימוש במפתח אמיתי.

CI משמש כבדיקה נוספת לאחר הדחיפה ואינו חוסם אותה. אם CI נכשל, מתקנים ודוחפים שוב. אין לבצע Deployment ידני כחלק מ-GitHub Actions. Vercel אחראית ל-Deployment דרך Git Integration.

### 5.3 Vercel Environments

#### Development

- הרצה מקומית באמצעות `npm run dev`.
- שימוש במפתח של OpenAI Project היחיד.
- Secrets נשמרים ב-`.env` שאינו נשלח ל-GitHub.

#### Preview

- לא בשימוש. מכיוון שהעבודה מתבצעת ישירות על `main` ואין ענפים נוספים, Vercel אינה יוצרת Preview Deployments.
- הבדיקה לפני פרסום מתבצעת בהרצה המקומית.
- אם בעתיד ייווצר ענף נוסף, Preview שלו לא יקבל את מפתח Production.

#### Production

- Push ל-`main` מפעיל Build ו-Production Deployment אוטומטיים.
- Production משתמש באותו OpenAI Project ובאותו מפתח, המוגדרים ב-Vercel.
- הכתובת הציבורית היא כתובת ה-`vercel.app` של הפרויקט.
- Vercel מספקת HTTPS ו-CDN לנכסים הסטטיים.
- ה-Route Handler נפרס כ-Vercel Function ב-Node.js Runtime.

### 5.4 Runtime Configuration

- Node.js 24 LTS יוגדר באופן עקבי בפיתוח, ב-CI וב-Vercel.
- הפונקציה תוגדר עם `maxDuration` של 30 שניות, לפי טבלת תקציב הזמנים בסעיף 2.7.
- ה-Frontend הסטטי יוגש דרך ה-CDN הגלובלי.
- ה-Backend יופעל באזור Vercel יחיד. ברירת המחדל המומלצת לקהל עברי היא Frankfurt, בכפוף לבדיקת Latency בפועל לפני השקה.
- אין צורך ב-Multi-region, Edge Runtime או Durable Compute.
- Responses של `/api/jokes` לא יישמרו ב-Cache של Next.js, ‏Vercel או הדפדפן.

### 5.5 Rollback

Vercel שומרת Deployments קודמים ומאפשרת Rollback מהיר. במקרה של תקלה:

1. מחזירים את Production Deployment לגרסה התקינה האחרונה דרך לוח הבקרה של Vercel.
2. מתקנים את הבעיה ובודקים בהרצה מקומית.
3. דוחפים את התיקון ל-`main` לאחר אישור המשתמש.

אין Database ולכן אין צורך בתיאום Rollback עם Migration או בשחזור נתונים.

## 6. אסטרטגיית בדיקות

### 6.1 Unit Tests

יש לבדוק לפחות:

- Trim ו-Normalization של נושא.
- ספירת 50 Grapheme Clusters, כולל עברית, Emoji ורווחים.
- נושא ריק כבקשה תקינה לבדיחה כללית.
- דחיית נושא ארוך מדי.
- מיפוי שגיאות פנימיות ל-Error Codes יציבים.
- אימות Structured Output, כולל מיפוי `status: "unsuitable"` ל-`UNSAFE_TOPIC`.
- חסימת תשובה ריקה או לא תקינה.

### 6.2 Component Tests

יש לבדוק לפחות:

- מצב התחלתי.
- שליחה עם נושא.
- שליחה ללא נושא.
- מצב Loading ומניעת שליחה כפולה.
- הצגת בדיחה.
- החלפת נושא לאחר תוצאה.
- הודעת נושא לא מתאים.
- הודעת תקלה והכפתור "נסו שוב".
- ניווט מלא במקלדת ו-Accessible Names.

### 6.3 API Integration Tests

OpenAI SDK יהיה Mocked. יש לבדוק:

- נושא בטוח, יצירה תקינה ו-Output בטוח.
- Input Moderation שחוסם נושא.
- Output Moderation שחוסם בדיחה.
- Timeout, ‏429 ו-5xx.
- תשובת AI במבנה לא תקין.
- Headers ובפרט `Cache-Control: no-store`.
- דחיית Origin זר ו-Content-Type שגוי.

### 6.4 End-to-End Tests

Playwright יריץ את הזרימות המרכזיות עם API מדומה:

- יצירת בדיחה בנושא.
- יצירת בדיחה כללית.
- ניסיון נוסף לאחר שגיאה.
- השדה אינו מקבל הקלדה או הדבקה מעבר ל-50 תווים.
- תצוגת RTL ורספונסיביות במובייל וב-Desktop.
- Chromium בלבד. Safari נבדק ידנית ב-iPhone (בדיקת משתמש).
- בדיקת Manifest ואפשרות התקנה ברמת Metadata.

בנוסף יש לבצע בדיקה ידנית במכשיר iPhone ובמכשיר Android להתקנה במסך הבית ולפתיחה במצב `standalone`.

### 6.5 בדיקות מול OpenAI אמיתי

בדיקות Smoke מצומצמות מול OpenAI יבוצעו ידנית לפני השקה ולא בכל CI Run. הן יכללו נושאים תקינים, נושא ריק, נושאים חסומים ודוגמאות עברית. אין לשמור את הפלטים בלוגים או כ-Test Artifacts.

## 7. החלטות שאינן נדרשות במוצר זה

- אין Database ולכן אין Schema, ‏ORM, ‏Migrations או Supabase.
- אין Authentication ולכן אין Sessions, ‏OAuth, ‏JWT או Authorization Roles.
- אין העלאת קבצים ולכן אין Object Storage או CDN לקבצים פרטיים.
- אין Background Processing ולכן אין Queue או Worker.
- אין Real-time Communication ולכן אין WebSocket.
- אין Analytics ולכן אין Events, ‏Cookies או Consent Banner לצורכי Analytics.
- אין Offline Support ולכן אין Cache של בדיחות או Service Worker מותאם אישית.
- אין צורך ב-Vercel AI SDK או ב-AI Gateway. שימוש ישיר ב-OpenAI SDK מפחית שכבות ותלות עבור ספק יחיד ו-Endpoint יחיד.

## 8. מקורות מרכזיים

- [OpenAI - GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [OpenAI - GPT-5 Deprecation](https://developers.openai.com/api/docs/deprecations)
- [OpenAI - Responses API ומצב `store: false`](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI - Moderation](https://developers.openai.com/api/docs/guides/moderation)
- [OpenAI - Data Controls and Retention](https://developers.openai.com/api/docs/guides/your-data)
- [OpenAI - API Authentication](https://developers.openai.com/api/reference/overview)
- [OpenAI - Project Spend Limits](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform)
- [Next.js - App Router](https://nextjs.org/docs/app)
- [Next.js - Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js - Progressive Web Apps](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js - Testing](https://nextjs.org/docs/app/guides/testing)
- [Vercel - Git Deployments](https://vercel.com/docs/git)
- [Vercel - Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel - Functions Limits](https://vercel.com/docs/functions/limitations)
- [Vercel - Pricing](https://vercel.com/pricing)
- [Vercel - Firewall and DDoS Protection](https://vercel.com/docs/vercel-firewall)
- [GitHub - Building and Testing Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [GitHub - Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Node.js - Supported Releases](https://nodejs.org/en/about/previous-releases)
- [W3C - WCAG 2.2](https://www.w3.org/TR/WCAG22/)


## החלטות מרכזיות (ADRs)

### ADR-1: ביטול ה-Retry האוטומטי של OpenAI SDK

**הקשר:** ה-SDK הרשמי של OpenAI מבצע כברירת מחדל שני ניסיונות חוזרים, גם על שגיאת 429. סעיף 2.7 קובע שאין Retry עבור 429, ושב-Backend מותר לכל היותר Retry יחיד ומבוקר לשגיאת רשת או 5xx.

**החלטה:** ה-Client נוצר עם `maxRetries: 0`. ה-Retry היחיד והמבוקר, יחד עם תקציב הזמנים, ייבנה ב-Milestone 3 בתוך ה-Adapter.

**השלכות:** עד Milestone 3 כל תקלה זמנית מוצגת מיד כשגיאה. ההתנהגות צפויה ועקבית עם ה-Architecture, ואין חיוב כפול על ניסיונות נסתרים.

### ADR-2: ללא הגדרת `runtime` ב-Route Handler

**הקשר:** הפרויקט מפעיל `cacheComponents` ב-`next.config.ts`. במצב זה Next.js 16 אוסר על הגדרת `export const runtime` ב-Route Handler, וה-Build נכשל.

**החלטה:** לא מגדירים `runtime` ב-`/api/jokes`. ה-Route רץ ב-Node.js Runtime, שהוא ברירת המחדל של Next.js.

**השלכות:** הדרישה ל-Node.js Runtime (סעיפים 2.2 ו-5.3) מתקיימת דרך ברירת המחדל. ב-Milestone 3 נבדק ש-`export const maxDuration = 30` מותר יחד עם `cacheComponents` וה-Build עובר, ולכן אין צורך ב-`vercel.json`.

### ADR-3: Origin זר ו-Content-Type שגוי מוחזרים כ-`400 INVALID_REQUEST`

**הקשר:** סעיף 3.2 דורש לדחות Origin זר ו-Content-Type שאינו JSON, אך טבלת השגיאות בסעיף 2.5 אינה כוללת קוד ייעודי לכך.

**החלטה:** Origin זר, Origin חסר או לא תקין, ו-Content-Type שאינו `application/json` מחזירים `400 INVALID_REQUEST` (`retryable: false`), לפני קריאת ה-Body ובלי פנייה ל-OpenAI. ההשוואה היא בין ה-Host שבכותרת `Origin` ל-Host של הבקשה. לא נשלחות כותרות CORS.

**השלכות:** כל קוד נשאר בסטטוס שנקבע לו, וה-Frontend אינו צריך מצב חדש. סקריפט שמזייף את הכותרות עדיין יכול לפנות ל-API; ההגנה מפניו היא ה-Rate Limit ותקרת ההוצאות.

### ADR-4: Content-Security-Policy עם `'unsafe-inline'`

**הקשר:** Next.js מזריק סקריפטים Inline לצורך Hydration. CSP מחמיר מחייב Nonce לכל בקשה, ולכן רינדור דינמי של כל דף ו-Proxy נוסף.

**החלטה:** ה-Security Headers מוגדרים ב-`next.config.ts` לכל הנתיבים. ה-CSP מתיר `'self'` ו-`'unsafe-inline'` לסקריפטים ולסגנונות, ו-`'unsafe-eval'` רק ב-Development (נדרש ל-Hot Reload). בנוסף: `frame-ancestors 'none'`, ‏`object-src 'none'`, ‏`connect-src 'self'`, ‏`X-Content-Type-Options: nosniff`, ‏`Referrer-Policy: strict-origin-when-cross-origin` ו-`Permissions-Policy` שחוסם מצלמה, מיקרופון, מיקום, תשלום ו-USB.

**השלכות:** ההגנה מפני הזרקת סקריפט חלשה יותר מ-Nonce, אך הסיכון נמוך: הבדיחה מוצגת כטקסט בלבד ואין HTML ממקור חיצוני. אם יידרש CSP מחמיר בעתיד, יש לעבור ל-Nonce.

### ADR-5: היקף ה-Retry האוטומטי בשרת

**הקשר:** סעיף 2.7 מתיר Retry יחיד לשגיאת רשת או 5xx, אם נשארו לפחות 12 שניות. ADR-1 דחה את מימושו ל-Milestone 3.

**החלטה:** ה-Retry חל רק על שלב יצירת הבדיחה, פעם אחת, על שגיאת חיבור או 5xx. אין Retry על Timeout, ‏429, Moderation או Validation. לכל שלב יש Timeout משלו (5/10/5 שניות), שלעולם אינו גדול מהזמן שנשאר מתוך 30 השניות של הבקשה. כשלא נשאר זמן, מוחזר `AI_UNAVAILABLE` בלי לפנות ל-OpenAI.

**השלכות:** Timeout אינו חוזר על עצמו, כי ניסיון נוסף לא היה נכנס בתקציב. תקלה בשלב ה-Moderation מוצגת מיד, והמשתמש יכול ללחוץ "נסו שוב".

### ADR-6: בדיקות נגישות אוטומטיות עם `@axe-core/playwright`

**הקשר:** Milestone 4 דורש עמידה ב-WCAG 2.2 AA (ניגודיות, שמות נגישים, מבנה). בדיקה ידנית בלבד אינה חוזרת על עצמה בכל שינוי.

**החלטה:** נוספה החבילה `@axe-core/playwright` כ-devDependency. בדיקות Playwright סורקות כל מצב מסך (התחלתי, טעינה, הצלחה, שגיאת קלט, שגיאה עם ובלי ניסיון חוזר) לפי התגים של WCAG 2.0–2.2 ברמות A ו-AA, ונכשלות על כל ממצא.

**השלכות:** החבילה רצה רק בבדיקות וב-CI ואינה נכנסת לאפליקציה. היא אינה מחליפה את הבדיקה הידנית עם קוראי מסך (סעיף 4.1).

### ADR-7: ניהול Focus בזמן טעינה ואחרי "נסו שוב"

**הקשר:** כפתור עם `disabled` מאבד את ה-Focus, והדפדפן מחזיר אותו לתחילת הדף. כך קרה ללחיצה על "צרו לי בדיחה" במקלדת, וגם לכפתור "נסו שוב" שנעלם בזמן הטעינה. סעיף 4.1 אוסר להעביר Focus באופן מפתיע.

**החלטה:** בזמן טעינה הכפתור הראשי מסומן `aria-disabled="true"` במקום `disabled`: הוא נשאר במקום ב-Focus, נראה במצב Disabled (שקיפות 60%), קורא מסך מכריז שאינו זמין, ולחיצה עליו אינה שולחת בקשה. בלחיצה על "נסו שוב" ה-Focus עובר לכותרת "הבדיחה שלכם" (`tabIndex={-1}`), באותו אזור שבו תוצג התוצאה. בכל מקרה אחר ה-Focus אינו זז, והתוצאות מוכרזות דרך `aria-live`.

**השלכות:** משתמש מקלדת וקורא מסך נשאר באותו מקום בדף לאורך כל הזרימה. ההגנה מפני שליחה כפולה נשארת בקוד (`inFlight`) ואינה תלויה במצב הכפתור.
