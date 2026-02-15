
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ClassroomMetrics, AIAdviceResponse, ActivityType } from "../types";

const SYSTEM_INSTRUCTION = `
Sen bir "Sınıf Dikkat Asistanı"sın. Görevin, öğretmene sınıfın genel durumu hakkında anlık öneriler vermektir.
VERİLER ANONİMDİR. Kişisel veri içermez. Sadece toplu istatistik gelir.
Tüm yanıtlar TÜRKÇE, destekleyici ve saygılı olmalıdır.
`;

const adviceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    genel_durum: { type: Type.STRING, enum: ["yüksek_dikkat", "orta_dikkat", "düşük_dikkat"] },
    durum_ozeti: { type: Type.STRING },
    ogretmene_kisa_mesaj: { type: Type.STRING },
    onerilen_eylem_turu: { type: Type.STRING },
    ogretmenin_soyleyebilecegi_cumle: { type: Type.STRING },
    alternatif_etkinlik_fikirleri: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["genel_durum", "durum_ozeti", "ogretmene_kisa_mesaj", "onerilen_eylem_turu", "ogretmenin_soyleyebilecegi_cumle", "alternatif_etkinlik_fikirleri"]
};

const metricsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    focus_score: { type: Type.NUMBER },
    gaze_board_percentage: { type: Type.NUMBER },
    heads_down_percentage: { type: Type.NUMBER },
    fidgeting_level: { type: Type.NUMBER },
    noise_level: { type: Type.NUMBER },
    activity_type: { type: Type.STRING, enum: Object.values(ActivityType) }
  },
  required: ["focus_score", "gaze_board_percentage", "heads_down_percentage", "fidgeting_level", "noise_level", "activity_type"]
};

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdvice = async (metrics: ClassroomMetrics): Promise<AIAdviceResponse> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(metrics) }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: adviceSchema,
    },
  });
  return JSON.parse(response.text || "{}") as AIAdviceResponse;
};

export const analyzeImage = async (base64WithHeader: string): Promise<Partial<ClassroomMetrics>> => {
  const ai = getAI();
  const match = base64WithHeader.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Görüntü formatı geçersiz.");
  
  const mimeType = match[1];
  const data = match[2];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      parts: [
        { inlineData: { data, mimeType } },
        { text: "Analyze this classroom image for engagement metrics. Focus on postures and heads. Return JSON." }
      ]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: metricsSchema,
    }
  });
  return JSON.parse(response.text || "{}") as Partial<ClassroomMetrics>;
};
