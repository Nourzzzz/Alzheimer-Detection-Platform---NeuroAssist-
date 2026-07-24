export type KnowledgeCategory = 'GUIDELINE' | 'RESEARCH_PAPER' | 'PROTOCOL' | 'OTHER';

export type IndexingStatus = 'PENDING' | 'INDEXING' | 'INDEXED' | 'FAILED';

export interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  category: KnowledgeCategory;
  originalFilename: string;
  fileSizeBytes: number;
  contentType: string | null;
  uploadedByEmail: string;
  indexingStatus: IndexingStatus;
  chunkCount: number;
  uploadedAt: string;
}

export const KNOWLEDGE_CATEGORIES: { value: KnowledgeCategory; label: string }[] = [
  { value: 'GUIDELINE', label: 'Clinical guideline' },
  { value: 'RESEARCH_PAPER', label: 'Research paper' },
  { value: 'PROTOCOL', label: 'Protocol' },
  { value: 'OTHER', label: 'Other' },
];
