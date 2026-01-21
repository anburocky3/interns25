export interface InternProfile {
  uid: string;
  name: string;
  email: string;
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
}
