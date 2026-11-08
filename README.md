חברותא חכמה | Chavruta Smart 🧠📖
שותף לימוד סוקרטי מבוסס בינה מלאכותית – למידה מעמיקה, שאלוני תרגול וחזרות מרווחות.
AI-Powered Socratic Study Partner: Deep Conceptual Learning, Quizzes & Spaced Repetition.
🌐 קישורים מהירים (Quick Links)
האפליקציה החיה (Live Application): https://ais-pre-mcpgb4w6vvfgwudntojxwm-435298918728.europe-west2.run.app
סביבת פיתוח (Dev App URL): https://ais-dev-mcpgb4w6vvfgwudntojxwm-435298918728.europe-west2.run.app
מאגר הקוד ב-GitHub (Repository): https://github.com/ETI-RASFOVSKY/Chavruta_AI
📖 אודות הפרויקט (Project Overview)
"חברותא חכמה" (Chavruta Smart) היא פלטפורמת למידה אישית לסטודנטים ותלמידים, המבוססת על שיטת הלימוד היהודית המסורתית (חברותא) בשילוב הפדגוגיה הסוקרטית ומודלי שפה מתקדמים של Google Gemini.
במקום לפלוט תשובות מוכנות ולהאכיל את התלמיד ב"כפית של סרק", החברותא:
שואלת "מדוע?", דורשת מהתלמיד להסביר מושגים במילים שלו, ומצביעה בעדינות על פערי הבנה.
מחלצת ומתמקדת אך ורק בליבת התוכן המהותית ומתעלמת לחלוטין מכותרות מנהלתיות, שמות מרצים או מבנה מבחן (למשל: "כמה שאלות רשות יש בבחינה?").
מחוללת שאלוני עומק של 8 שאלות רב-ברירה עם משוב והסבר מנומק לכל תשובה.
מנהלת מנגנון חזרה מרווחת (Spaced Repetition) ומסך "חזרה יומית" (Daily Review) שמתזמן שאלות במרווחי זמן מותאמים אישית (יום 1 לשגיאה, 3 ימים לתשובה נכונה, 7 ימים לחזרה נוספת).
✨ תכונות עיקריות (Key Features)
🗣️ שותף לימוד סוקרטי (Socratic Study Partner):
דיאלוג אינטראקטיבי מעמיק על בסיס חומר הלימוד שהועלה.
לעולם אינו מגלה את התשובה מיד – מציג שאלות מכוונות, שואל על מנגנונים ויחסי סיבה-תוצאה.
כפתור בדיקה חכם "הסברתי נכון?" – מעריך ישירות את ההסבר של התלמיד, מאשר דיוק או מכוון לפערים, ולעולם אינו עוקף את השאלה.
מנגנון רמזים מדורג בעת קושי.
שמירת היסטוריית השיחה המלאה בענן תחת chat_sessions.
📝 מחולל שאלוני עומק (8-Question Concept Quizzes):
יצירת 8 שאלות רב-ברירה בפורמט JSON קשיח ישירות מהטקסט.
איסור מוחלט על שאלות טריוויה מנהלתיות – מיקוד במושגי יסוד וקשרים סיבתיים לאורך כל הטקסט.
משוב מיידי והסבר פדגוגי מפורט לאחר כל בחירה.
עדכון אוטומטי של טבלת ההתקדמות (progress).
⏰ מסך חזרה יומית מבוסס חזרות מרווחות (Daily Review with Spaced Repetition):
מעקב מובנה לפי שדה next_review_at.
הצגת השאלות שהגיע מועד החזרה שלהן להיום בלבד (next_review_at <= now).
אלגוריתם תזמון מדויק:
תשובה שגויה: חוזרת מחר (+1 יום / 24 שעות).
תשובה נכונה ראשונה: חוזרת בעוד 3 ימים (+72 שעות).
תשובה נכונה נוספת: חוזרת בעוד 7 ימים (+168 שעות).
תגית מונה (Badge) חיה בסרגל העליון ובאנר תזכורת בלוח הבקרה.
📂 העלאה וחילוץ קבצים (Document Management):
תמיכה בהדבקת טקסט חופשי, קובצי .txt, וקובצי .pdf.
חילוץ טקסט מקומי מ-PDF בדפדפן (באמצעות PDF.js מקומי ב-Vite worker).
🔐 פרטיות ואבטחת שורות (Row-Level Security):
כניסה באמצעות חשבון Google בלבד (Google Sign-In דרך Firebase Authentication).
אבטחת שורות מלאה ב-Firestore (firestore.rules) – כל תלמיד רשאי לקרוא, לכתוב ולמחוק אך ורק את הנתונים שלו (request.auth.uid == resource.data.user_id).
📱 עיצוב מודרני מותאם עברית (Full RTL & Mobile-First):
ממשק משתמש אלגנטי, נקי, מותאם RTL באופן מלא, ונגיש מכל מכשיר נייד ודסקטופ.
🏗️ ארכיטקטורת המערכת (System Architecture)
Code
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser (React 19)              │
│  - Full RTL Tailwind UI       - PDF.js Local Web Worker     │
│  - Firebase Auth (Google)     - Real-time Firestore Sub     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
       HTTPS / Client SDK              Direct API calls
               │                       (/api/quiz/generate,
               ▼                        /api/study-partner/chat)
┌──────────────────────────────┐              │
│      Firebase Platform       │              ▼
│ - Firebase Authentication    │    ┌───────────────────────────┐
│   (Google OAuth Provider)    │    │  Express / Vite Server    │
│ - Cloud Firestore Database   │    │  (Port 3000 / Cloud Run)  │
│   (ABAC / RLS Security Rules)│    │  - No Client API Keys     │
│   • users                    │    │  - Request Validation     │
│   • documents                │    └─────────────┬─────────────┘
│   • questions                │                  │
│   • progress                 │                  │ Google GenAI SDK
│   • chat_sessions            │                  ▼
└──────────────────────────────┘    ┌───────────────────────────┐
                                    │    Google Gemini API      │
                                    │ - gemini-3.1-flash-lite   │
                                    │ - gemini-3.8-flash        │
                                    │ - ThinkingLevel.LOW       │
                                    │ - JSON Schema Enforcement │
                                    └───────────────────────────┘
🗄️ מבנה מסד הנתונים (Firestore Collections)
מסד הנתונים מנוהל ב-Cloud Firestore עם כללי אבטחת שורות (Row-Level Security):
Collection	Document ID Pattern	Fields & Types	Description
users	{userId}	id (string), email (string), display_name (string), photo_url (string), created_at (ISO timestamp)	פרופיל משתמש בסיסי. גישה בלעדית לבעל החשבון.
documents	doc_{timestamp}_{random}	id (string), user_id (string), title (string), raw_text (string), created_at (ISO timestamp)	סיכומי וחומרי הלימוד שהמשתמש העלה או הדביק.
questions	q_{timestamp}_{index}	id (string), document_id (string), user_id (string), type ('multiple_choice' | 'flashcard'), content (map/JSON), topic (string)	8 שאלות שנחצבו מחומר הלימוד, כולל תשובה נכונה והסבר.
progress	prog_{questionId}	id (string), user_id (string), question_id (string), times_correct (number), times_wrong (number), next_review_at (ISO timestamp)	תיעוד הצלחות וטעויות לצורך חזרות מרווחות (Spaced Repetition).
chat_sessions	chat_{userId}_{docId}	id (string), document_id (string), user_id (string), messages (array of objects: role, text, created_at), created_at (ISO timestamp)	היסטוריית השיחה הסוקרטית בין התלמיד לחברותא.
חוקי אבטחה ב-Firestore (firestore.rules):
JavaScript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /documents/{documentId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    match /questions/{questionId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    match /progress/{progressId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    match /chat_sessions/{sessionId} {
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
  }
}
💻 מחסנית טכנולוגית (Tech Stack)
Frontend:
React 19 – ספריית UI מודרנית עם Hooks וניהול State ריאקטיבי.
TypeScript 7 – תמיכה מלאה ב-Type Safety בכל רכיבי האפליקציה.
Tailwind CSS v4 – עיצוב מתקדם, תמיכה נקייה ב-RTL (ימין-שמאל) ומובייל-פירסט.
Lucide React – מערכת אייקונים אחידה ומודרנית.
PDF.js (Mozilla) – חילוץ טקסט מלא מקובצי PDF מקומית בדפדפן.
Backend & Server Proxy:
Node.js + Express / Vite Proxy – שרת מרכזי המנהל את כל הקריאות ל-AI ללא חשיפת מפתחות API ללקוח.
AI & LLM:
Google GenAI SDK (@google/genai) – אינטגרציה רשמית למודלי Gemini.
Models: gemini-3.1-flash-lite, gemini-3.8-flash.
Thinking Level: מוגדר ל-ThinkingLevel.LOW המעניק שכבת חשיבה והיסק עמוקה תוך שמירה על מהירות מענה גבוהה (~3.5 שניות).
Database & Auth:
Firebase Firestore – מסד נתונים NoSQL בענן עם האזנה בזמן אמת.
Firebase Authentication – אימות מאובטח מבוסס חשבונות Google.
Infrastructure & Deployment:
Google Cloud Run – שירות קונטיינרים מנוהל וסקיילבילי.
🚀 הוראות התקנה והרצה מקומית (Setup & Local Development)
1. דרישות מוקדמות
Node.js גרסה 20 ומעלה
npm גרסה 10 ומעלה
חשבון Google Firebase ומפתח ל-Gemini API
2. שכפול המאגר (Clone Repository)
Bash
git clone https://github.com/ETI-RASFOVSKY/Chavruta_AI.git
cd Chavruta_AI
3. התקנת תלויות
Bash
npm install
4. הגדרת משתני סביבה (.env)
צרו קובץ .env בתיקיית השורש בהתבסס על .env.example:
Env
# Gemini API Key (שרת בלבד - לא נחשף לקליינט)
GEMINI_API_KEY="AIzaSy..."

# כתובת האפליקציה
APP_URL="http://localhost:3000"

# משתני Firebase (המוזרקים לקליינט)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
VITE_FIREBASE_DATABASE_ID="your-firestore-db-id"
5. הרצת שרת הפיתוח
Bash
npm run dev
האפליקציה תפעל בכתובת: http://localhost:3000
6. בדיקת תקינות ובנייה לפרודקשן
Bash
# בדיקת טיפוסים (Linter & Typecheck)
npm run lint

# בנייה לפרודקשן
npm run build

# הרצת שרת הפרודקשן
npm start
🔒 אבטחה ופרטיות מידע (Security & Privacy)
Zero Client Secrets: מפתח ה-Gemini API שמור אך ורק בשרת (process.env.GEMINI_API_KEY). הלקוח מתקשר עם שרת האפליקציה באמצעות נתיבי /api/*.
אימות Google בלבד: אין שימוש בסיסמאות מקומיות – האימות מנוהל ברמת האבטחה הגבוהה ביותר של Google Identity Services.
בידוד נתונים מוחלט: אף משתמש אינו יכול לראות, לתחקר או לגשת לחומרי לימוד, שאלונים, צ'אטים או התקדמות של משתמש אחר הודות לכללי Row-Level Security.
📄 רישיון (License)
פרויקט זה מופץ תחת רישיון Apache-2.0.
פרטים נוספים בקובצי הקוד הרלוונטיים.
