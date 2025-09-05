export interface Document {
  id: string;                       // uuid dari Supabase
  title: string;
  file_url: string;
  content: string;
  content_raw?: string;
  created_at: Date;
  processed: boolean;
  metadata: Record<string, any>;
}

export type DocumentSeed = Document;