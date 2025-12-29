
import { GoogleGenAI } from "@google/genai";

export const getDailyReflection = async (readingTitle: string) => {
  // في Vite، نصل للمتغيرات المعرفة في config عبر process.env إذا تم تعريفها في define
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "كلمة الله حية وفعالة، واصل المسير في قراءتك اليوم!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `أعطني تأملاً روحياً قصيراً جداً (جملتين فقط) مشجعاً للمتسابقين في مارثون الكتاب المقدس حول القراءة التالية: ${readingTitle}. اجعل الأسلوب بسيطاً وروحياً ومحفزاً.`,
    });
    return response.text || "واصل القراءة بنشاط اليوم!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "كلمة الله حية وفعالة، واصل المسير في قراءتك اليوم!";
  }
};
