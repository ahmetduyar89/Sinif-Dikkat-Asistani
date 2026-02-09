
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ClassroomMetrics, AIAdviceResponse, ActivityType, TrendType } from "../types";

const SYSTEM_INSTRUCTION = `
Sen bir "Sınıf Dikkat Asistanı"sın. Görevin, sınıfta ders anlatan öğretmene, sınıfın genel dikkat ve enerji durumuna göre anlık, uygulanabilir ve kısa öneriler vermektir.

Sistemden sana, sınıfla ilgili KİŞİSEL VERİ İÇERMEYEN, SADECE TOPLU İSTATİSTİKLERE DAYALI bir veri paketi gelir. Bu veriler:
- Sadece ANLIK analizdir, geçmiş görüntü veya ses kaydı içermez.
- Hiçbir öğrenciyi tek tek hedef göstermez, sadece "sınıfın genel durumu"nu temsil eder.

Senin çıktıların:
- Öğretmenin derste anında uygulayabileceği, pratik, net öneriler olmalıdır.
- Öğretmeni eleştirme, suçlama; destekleyici, yargılayıcı olmayan bir dil kullan.
- Önerilerin her zaman TÜRKÇE olmalı ve saygılı, sakin bir üslup içermeli.

# YORUMLAMA KURALLARI

1. focus_score yüksek (>=75) ise:
   - "genel_durum" genellikle "yüksek_dikkat" olsun.
   - Önerilerin mevcut yöntemi destekleyici, küçük çeşitlendirmeler öneren türde olsun.
   - Gereksiz yere "mola" önermekten kaçın.

2. focus_score orta seviyede (40–74) ise:
   - "genel_durum" genellikle "orta_dikkat" olsun.
   - Özellikle trend_last_5_min "azalıyor" ise, mini bir etkileşim, örnek soru veya kısa hareketlendirme öner.

3. focus_score düşük (<40) ise:
   - "genel_durum" "düşük_dikkat" olsun.
   - Kısa, uygulanabilir ve mümkünse ayağa kaldıran, düşündüren veya güldüren bir etkinlik öner.
   - Öğretmene "ortamı suçlayan" değil, "durumu iyileştirmeye yönelik" öneriler ver.

4. noise_level yorumlama:
   - Çok düşük (0–2) ve focus_score de düşükse → sınıf muhtemelen sıkılmış veya kopmuş olabilir.
   - Çok yüksek (8–10) ve activity_type "düz anlatım" ise → dikkat dağılmış, öğrenciler muhtemelen kendi aralarında konuşuyordur.
   - Yüksek gürültüyü "grup çalışması" sırasında otomatik kötü varsayma; bunun yerine "yapıcı gürültü" olabileceğini düşün.

5. fidgeting_level:
   - Orta seviyede (4–6) ve focus_score yüksekse → "canlılık" olabilir, mutlaka olumsuz yorumlama.
   - Çok yüksek (7–10) ve focus_score düşükse → "dağılma / sıkılma" işareti olarak değerlendir.

6. heads_down_percentage:
   - Yüksek olup activity_type "soru çözümü" ise normal olabilir.
   - Düz anlatımda çok yüksekse → öğrenciler kopmuş veya başka şeyle meşgul olabilir.

7. activity_type'a göre öneri:
   - "düz anlatım" uzun süredir varsa ve focus_score düşmüşse → soru-cevap, küçük oyun, minik tartışma öner.
   - "soru çözümü" sırasında düşüş varsa → öğrencilerin birlikte çözebileceği örnek, tahtaya bir öğrenciyi çağırma, eşli çalışma öner.
   - "grup çalışması" sırasında düşüş varsa → net yönergeleri tekrar etme, süre tutma, hedef hatırlatma öner.

# DİL ve ÜSLUP

- Tüm yanıtlar TÜRKÇE olacak.
- Öğretmene her zaman saygılı ve destekleyici bir tonda hitap et.
- Öğrenciler hakkında asla aşağılayıcı ifade kullanma.
`;

const adviceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    genel_durum: {
      type: Type.STRING,
      enum: ["yüksek_dikkat", "orta_dikkat", "düşük_dikkat"]
    },
    durum_ozeti: { type: Type.STRING },
    ogretmene_kisa_mesaj: { type: Type.STRING },
    onerilen_eylem_turu: { type: Type.STRING },
    ogretmenin_soyleyebilecegi_cumle: { type: Type.STRING },
    alternatif_etkinlik_fikirleri: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: [
    "genel_durum",
    "durum_ozeti",
    "ogretmene_kisa_mesaj",
    "onerilen_eylem_turu",
    "ogretmenin_soyleyebilecegi_cumle",
    "alternatif_etkinlik_fikirleri"
  ]
};

const metricsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    focus_score: { type: Type.NUMBER, description: "0-100 score based on eye contact and posture" },
    gaze_board_percentage: { type: Type.NUMBER, description: "Percentage of people looking forward" },
    heads_down_percentage: { type: Type.NUMBER, description: "Percentage of people looking down" },
    fidgeting_level: { type: Type.NUMBER, description: "0-10 scale of movement/blur" },
    noise_level: { type: Type.NUMBER, description: "0-10 scale estimated from visual cues (open mouths)" },
    activity_type: { 
      type: Type.STRING, 
      enum: Object.values(ActivityType) 
    }
  },
  required: [
    "focus_score",
    "gaze_board_percentage",
    "heads_down_percentage",
    "fidgeting_level",
    "noise_level",
    "activity_type"
  ]
};

// Initialize with a fresh instance when needed is handled within exports to ensure latest API key if applicable, 
// but here we use the environment variable as per standard.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdvice = async (metrics: ClassroomMetrics): Promise<AIAdviceResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: JSON.stringify(metrics) }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: adviceSchema,
        temperature: 0.6,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }
    
    return JSON.parse(text) as AIAdviceResponse;
  } catch (error) {
    console.error("Gemini API Error (Advice):", error);
    throw error;
  }
};

export const analyzeImage = async (base64Image: string): Promise<Partial<ClassroomMetrics>> => {
  try {
    // Extract MIME type and data from data URL
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image format. Expected a base64 data URL.");
    }
    
    const mimeType = match[1];
    const base64Data = match[2];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `Analyze this classroom image and estimate the engagement metrics. 
              Return valid JSON matching the schema.
              Infer the activity type based on the layout (e.g., if people are in circles -> group work).
              Be realistic with estimates.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: metricsSchema,
        temperature: 0.4,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini for image analysis");

    return JSON.parse(text) as Partial<ClassroomMetrics>;

  } catch (error) {
    console.error("Gemini API Error (Image Analysis):", error);
    throw error;
  }
};
