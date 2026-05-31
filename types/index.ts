export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Recording {
  id?: number;
  title: string;
  duration: number;
  audioPath: string; // local file URI (expo-file-system)
  transcript?: TranscriptSegment[];
  summary?: string;
  actionItems?: ActionItem[];
  mindMap?: string;
  tags: string[];
  isFavorite: boolean;
  templateId?: string;
  language: 'th' | 'en';
  createdAt: string; // ISO string (SQLite stores as TEXT)
}

export interface Note {
  id?: number;
  recordingId: number;
  timestamp: number;
  content: string;
  imagePaths: string[]; // local file URIs
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tags: string[];
  isBuiltIn?: boolean;
}

export type RecorderState = 'idle' | 'recording' | 'processing' | 'saved';
export type Language = 'th' | 'en';
