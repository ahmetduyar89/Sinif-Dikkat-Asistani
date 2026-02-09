export enum ActivityType {
  LECTURE = "düz anlatım",
  QUESTION_ANSWER = "soru çözümü",
  GROUP_WORK = "grup çalışması",
  EXPERIMENT = "deney",
  GAME = "oyun",
  DISCUSSION = "tartışma"
}

export enum TrendType {
  INCREASING = "artıyor",
  DECREASING = "azalıyor",
  STABLE = "stabil"
}

export interface ClassroomMetrics {
  focus_score: number; // 0-100
  gaze_board_percentage: number; // 0-100
  heads_down_percentage: number; // 0-100
  fidgeting_level: number; // 0-10
  noise_level: number; // 0-10
  lesson_minute: number;
  activity_type: ActivityType;
  trend_last_5_min: TrendType;
}

export interface AIAdviceResponse {
  genel_durum: "yüksek_dikkat" | "orta_dikkat" | "düşük_dikkat";
  durum_ozeti: string;
  ogretmene_kisa_mesaj: string;
  onerilen_eylem_turu: string;
  ogretmenin_soyleyebilecegi_cumle: string;
  alternatif_etkinlik_fikirleri: string[];
}
