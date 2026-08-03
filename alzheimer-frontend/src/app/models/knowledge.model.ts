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

// Carries a translation key rather than a literal, so the dropdown follows the
// active language like the rest of the console.
export const KNOWLEDGE_CATEGORIES: { value: KnowledgeCategory; labelKey: string }[] = [
  { value: 'GUIDELINE', labelKey: 'medecin.kb.category.guideline' },
  { value: 'RESEARCH_PAPER', labelKey: 'medecin.kb.category.research' },
  { value: 'PROTOCOL', labelKey: 'medecin.kb.category.protocol' },
  { value: 'OTHER', labelKey: 'medecin.kb.category.other' },
];
