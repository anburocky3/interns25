export interface InternProfile {
  uid: string;
  name: string;
  email: string;
  slug?: string;
  username?: string;
  avatar?: string;
  gender?: "M" | "F" | "O";
  position?: string;
  isStudent?: boolean;
  hasWifi?: boolean;
  location?: string;
  mobile?: string;
  audioIntroUrl?: string;
  audioIntroUploadedAt?: string;
  social?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
    instagram?: string;
    tasks?: string;
  };
  weeklyTasks?: WeeklyTaskEntry[];
  updatedAt?: string;
  typingStats?: TypingStats;
}

export interface WeeklyTaskEntry {
  week: number;
  title?: string;
  items?: string[];
  status?: "planned" | "in-progress" | "done";
  notes?: string;
  link?: string;
  updatedAt?: string;
}

export interface TypingStats {
  bestWPM: number;
  bestAccuracy: number;
  lastPlayed?: string; // ISO timestamp
  totalGamesPlayed?: number;
  gamesThisMonth?: number;
}

export interface GameResult {
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  isNewRecord: boolean;
  timestamp: string;
}
