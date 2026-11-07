/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Server-Side API Middleware for Chavruta Smart (חברותא חכמה)
 * 
 * ביצועים מהירים: שימוש ב-ThinkingLevel.LOW / MINIMAL ומודלים אופטימליים לזמן תגובה קצר במיוחד!
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// Initialize Gemini on the server side using the server environment variable
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

/**
 * Helper to read JSON request body from IncomingMessage
 */
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        // Prevent abuse: max 5MB body
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!data) return resolve({});
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

/**
 * Resilient, ultra-fast generateContent runner with optimized thinking levels and model fallback
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    primaryModel?: string;
  }
) {
  // Ordered models prioritizing fastest response latency
  const candidateModels = [
    params.primaryModel || 'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    // Determine optimized thinking level to eliminate long thinking delays
    const modelConfig = { ...(params.config || {}) };
    
    if (model === 'gemini-3.8-flash' || model === 'gemini-3.1-flash-lite') {
      modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    // Up to 2 attempts per candidate model
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: modelConfig,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isUnavailable = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('429');

        console.warn(`Gemini call on ${model} (attempt ${attempt + 1}) encountered issue:`, errMsg);

        if (isUnavailable) {
          // Wait briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
          continue; // retry this model
        } else {
          // For non-transient errors (like 400 Bad Request), switch to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error('מודל ה-AI אינו זמין כרגע עקב עומס גבוה. אנא נסה שוב בעוד כמה רגעים.');
}

/**
 * Helper to clean and validate quiz JSON from model
 */
function validateAndParseQuizQuestions(rawText: string) {
  // Strip potential markdown code fences ```json ... ```
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error('שגיאה בפענוח JSON: הפורמט שהתקבל אינו תקין.');
  }

  // Handle case where model wraps array in an object like { questions: [...] }
  let questionsArray = parsed;
  if (!Array.isArray(questionsArray) && typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed.questions)) {
      questionsArray = parsed.questions;
    } else if (Array.isArray(parsed.data)) {
      questionsArray = parsed.data;
    }
  }

  if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
    throw new Error('התקבל מערך ריק או מבנה שאינו רשימת שאלות.');
  }

  // Validate each question structure strictly
  const validatedQuestions = questionsArray.map((item: any, index: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`שאלה מספר ${index + 1} אינה אובייקט תקין.`);
    }

    const question = typeof item.question === 'string' ? item.question.trim() : '';
    if (!question) {
      throw new Error(`בשאלה מספר ${index + 1} חסר טקסט השאלה.`);
    }

    if (!Array.isArray(item.options) || item.options.length < 2) {
      throw new Error(`בשאלה מספר ${index + 1} חסרות אפשרויות בחירה (נדרשות לפחות 2).`);
    }

    const options = item.options.map((opt: any) => String(opt || '').trim());
    const correct_index = typeof item.correct_index === 'number' ? Math.floor(item.correct_index) : 0;
    
    if (correct_index < 0 || correct_index >= options.length) {
      throw new Error(`בשאלה מספר ${index + 1} אינדקס התשובה הנכונה אינו בטווח האפשרויות.`);
    }

    const explanation = typeof item.explanation === 'string' && item.explanation.trim()
      ? item.explanation.trim()
      : 'תשובה נכונה על פי חומר הלימוד.';

    const topic = typeof item.topic === 'string' && item.topic.trim()
      ? item.topic.trim()
      : 'כללי';

    return {
      type: 'multiple_choice' as const,
      question,
      options,
      correct_index,
      explanation,
      topic,
    };
  });

  return validatedQuestions;
}

/**
 * Server middleware handling /api/* requests
 */
export async function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || '';

  // Only handle /api endpoints
  if (!url.startsWith('/api/')) {
    return next();
  }

  // Set standard JSON and CORS headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Health check endpoint
  if (url === '/api/health' && req.method === 'GET') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      service: 'Chavruta Smart API Server',
      timestamp: new Date().toISOString()
    }));
  }

  // LLM Server-side endpoint: Generate 8 multiple-choice quiz questions
  if (url === '/api/quiz/generate' && req.method === 'POST') {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ 
          error: 'מפתח GEMINI_API_KEY חסר בהגדרות השרת.' 
        }));
      }

      const body = await parseJsonBody(req);
      const { text, title } = body;

      if (!text || typeof text !== 'string' || text.trim().length < 15) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ 
          error: 'הטקסט קצר מדי ליצירת שאלון. אנא ספק חומר לימוד מפורט יותר.' 
        }));
      }

      const prompt = `
אתה מחבר בחינות ושאלונים אקדמי מומחה ברמה הגבוהה ביותר.
מטרתך: לחבר שאלון איכותי, מעמיק ומחשבתי שבודק הבנה אמיתית של מושגי היסוד והרעיונות המרכזיים בחומר הלימוד.

חומר הלימוד:
${title ? `כותרת: ${title}\n` : ''}
"""
${text.trim().slice(0, 30000)}
"""

חבר בדיוק 8 שאלות רב-ברירה (אמריקאיות) עמוקות ומאתגרות בעברית.

הנחיות מחמירות לאיכות ועומק התוכן (קרא בעיון רב):
1. איסור מוחלט על שאלות טכניות / מנהלתיות / מבנה מבחן:
   - התעלם לחלוטין מכל מידע מנהלתי: כותרות סילבוס, תאריכים, שמות מרצים, מבנה הבחינה, מספרי עמודים, ובעיקר שאלות כגון "כמה שאלות רשות יש בבחינה?", "מה משך המבחן?", "איזה חלק הוא חובה?". שאלות מסוג זה אסורות בתכלית!
2. עומק מחשבתי והבנה מהותית (לא שאלות רדודות):
   - שאל על עקרונות יסוד, מנגנונים, קשרים סיבתיים ("מדוע?", "כיצד מוביל X ל-Y?"), תהליכים, השוואות ומשמעויות של התיאוריות או המושגים בגוף הטקסט.
   - הימנע משאלות זיכרון טריוויה פשוטות שאינן מעידות על הבנה.
3. כיסוי מקיף של כל חלקי הטקסט:
   - פרוס את 8 השאלות על פני נושאים שונים לאורך כל חומר הלימוד (התחלה, אמצע וסוף), כדי לחקור לעומק את כל התוכן.
4. מבנה השאלות:
   - 4 אפשרויות בחירה מקצועיות והגיוניות (תשובה נכונה אחת מדויקת, ו-3 מסיחים משכנעים הדורשים חשיבה).
   - הסבר מנומק, עמוק ומאלף לכל שאלה.
5. החזר אך ורק מערך STRICT JSON בפורמט:
[
  {
    "type": "multiple_choice",
    "question": "שאלה מהותית ומעמיקה בעברית...",
    "options": ["אפשרות 1", "אפשרות 2", "אפשרות 3", "אפשרות 4"],
    "correct_index": 0,
    "explanation": "הסבר מנומק המבהיר את העיקרון המהותי...",
    "topic": "שם הנושא המהותי"
  }
]
`;

      // Use generation with gemini-3.1-flash-lite / gemini-3.8-flash with thinking for high-depth reasoning
      const response = await generateContentWithRetry(ai, {
        primaryModel: 'gemini-3.1-flash-lite',
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '';
      
      // Validate and parse the generated questions strictly
      const questions = validateAndParseQuizQuestions(responseText);

      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        questions,
      }));
    } catch (err: any) {
      console.error('API Error in /api/quiz/generate:', err);
      
      const rawMessage = err?.message || String(err);
      let userFriendlyMessage = rawMessage;

      if (rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE') || rawMessage.includes('high demand')) {
        userFriendlyMessage = 'שרתי ה-AI חווים עומס זמני גבוה. בוצעו ניסיונות חוזרים. אנא נסה שנית בעוד מספר שניות.';
      } else if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        userFriendlyMessage = 'הגעת למגבלת הקריאות הרגעית של ה-AI. אנא המתן חצי דקה ונסה שוב.';
      }

      res.statusCode = 503;
      return res.end(JSON.stringify({ 
        error: userFriendlyMessage 
      }));
    }
  }

  // LLM Server-side endpoint: Socratic study partner query
  if (url === '/api/study-partner/chat' && req.method === 'POST') {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ 
          error: 'מפתח GEMINI_API_KEY חסר בהגדרות השרת.' 
        }));
      }

      const body = await parseJsonBody(req);
      const { userMessage, studyMaterial, conversationHistory } = body;

      if (!userMessage) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'חסרה הודעת המשתמש.' }));
      }

      // Socratic system prompt with deep conceptual focus and strict filter on administrative headers
      const systemInstruction = `You are a master Socratic study partner (חברותא סוקרטית מעמיקה ומאתגרת). Your sole purpose is to engage the student in a profound, intellectually rigorous, and stimulating dialogue on the substantive concepts, core principles, logic, and mechanisms found in the provided study material.

ABSOLUTE RULES FOR DEPTH AND SUBSTANTIVE RIGOR:
1. TOTAL BAN ON ADMINISTRATIVE TRIVIA AND EXAM HEADINGS:
   - Completely ignore administrative headers, course outlines, lecturer names, exam structures, or exam rules (NEVER ask or discuss "כמה שאלות רשות יש בבחינה?", "איך בנוי המבחן?", or superficial document headings)!
   - Focus 100% of your dialogue on the SUBSTANTIVE CORE CONCEPTS, theories, processes, arguments, causes-and-effects, and critical principles in the text.
2. INTELLECTUAL DEPTH OVER SHALLOWNESS (עומק מהותי - לא שאלות רדודות):
   - Do NOT ask shallow, trivial, or obvious questions.
   - Challenge the student with deep Socratic questions:
     * "מדוע לדעתך מתרחש X?"
     * "מהו המנגנון או ההיגיון המרכזי שמניע את...?"
     * "כיצד מושג א' מתקשר למושג ב' או משפיע עליו על פי הטקסט?"
     * "מה ההבדל המהותי בין... לבין...?"
     * "מה המשמעות של עיקרון זה בפועל / מה ההשלכות?"
3. SYSTEMATIC AND COMPREHENSIVE EXPLORATION (חקירה לעומק של כל התוכן):
   - Don't get stuck on only the first page. Actively and progressively guide the student through all key topics and layers of the provided material, ensuring deep mastery of the whole text.
4. SOCRATIC PEDAGOGY:
   - Ask ONE focused, deep question at a time.
   - Ask the student to explain in their own words, to prove genuine understanding.
   - Do not give away the answer immediately.
   - If the student is stuck twice, give a small, targeted hint.
5. HANDLING EXPLANATIONS AND "הסברתי נכון?":
   - When the student explains or asks "הסברתי נכון?", "האם צדקתי?", or asks for feedback:
   - NEVER bypass, skip, or change the question without directly analyzing their explanation!
   - If accurate: praise their specific insight, and challenge them with a deeper follow-up question or advance to the next core concept.
   - If inaccurate or missing nuance: gently point out specifically what they grasped well and what was missed or misunderstood ("הבנת יפה את..., אך שים לב ל... מה קורה כאשר...?"). Stay on this question until resolved.
6. LANGUAGE:
   - Always reply in Hebrew. Speak like a wise, encouraging, sharp study partner (חברותא ידען ומעורר מחשבה).`;

      const formattedContents: any[] = [
        {
          role: 'user',
          parts: [{ text: `חומר הלימוד המלא:\n"""\n${studyMaterial || ''}\n"""\n\nבוא נתחיל בדיאלוג סוקרטי מעמיק על התוכן המהותי (התעלם מכל כותרת מנהלתית או מבנה בחינה).` }]
        },
        {
          role: 'model',
          parts: [{ text: 'שלום! אני החברותא שלך. בוא נצלול לעומק הרעיונות, המושגים והמנגנונים המרכזיים בחומר.' }]
        }
      ];

      // Add previous conversation turns, ensuring valid role mapping and no adjacent duplicate user turns
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory) {
          if (item && item.text) {
            const role = item.role === 'user' ? 'user' : 'model';
            const textContent = String(item.text).trim();
            if (!textContent) continue;

            const prev = formattedContents[formattedContents.length - 1];
            // Avoid adding identical consecutive user messages
            if (prev && prev.role === role && prev.parts[0]?.text === textContent) {
              continue;
            }
            formattedContents.push({
              role,
              parts: [{ text: textContent }]
            });
          }
        }
      }

      // Add current user message only if it wasn't already the last turn
      const promptText = userMessage === '__START__'
        ? 'התעלם לחלוטין מכותרות מנהלתיות, שמות מרצים, מבנה הבחינה או שאלות רשות. זהה את הרעיון או המושג המהותי והמרכזי ביותר בגוף חומר הלימוד, ופתח בשאלה סוקרטית עמוקה ומאתגרת אחת (לא שאלת טריוויה רדודה) שתדרוש ממני להסביר את ההיגיון או המנגנון שמאחוריו במילים שלי.'
        : String(userMessage).trim();

      const lastTurn = formattedContents[formattedContents.length - 1];
      if (!lastTurn || lastTurn.role !== 'user' || lastTurn.parts[0]?.text !== promptText) {
        formattedContents.push({
          role: 'user',
          parts: [{ text: promptText }]
        });
      }

      const response = await generateContentWithRetry(ai, {
        primaryModel: 'gemini-3.1-flash-lite',
        contents: formattedContents,
        config: {
          systemInstruction,
        }
      });

      res.statusCode = 200;
      return res.end(JSON.stringify({
        reply: response.text || '',
      }));
    } catch (err: any) {
      console.error('API Error in /api/study-partner/chat:', err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ 
        error: err.message || 'שגיאה בעיבוד בקשת החברותא.' 
      }));
    }
  }

  // Fallback for unhandled /api routes
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'API route not found' }));
}
