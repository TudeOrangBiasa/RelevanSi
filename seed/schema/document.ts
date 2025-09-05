export interface Document {
  id: number;
  title: string;
  file_url: string;
  content: string;
  created_at: Date;
  processed: boolean;
  metadata: Record<string, any>;
}

export {}