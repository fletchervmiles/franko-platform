// Types for the aggregated responses system

export interface ResponseFilters {
  agentType?: string;
  modalName?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TransformedResponse {
  // Original fields
  id: string;
  intervieweeFirstName: string | null;
  intervieweeSecondName: string | null;
  intervieweeEmail: string | null;
  completionStatus: string | null;
  interviewEndTime: Date | null;
  interviewStartTime: Date | null;
  transcript_summary: string | null;
  cleanTranscript: string | null;
  user_words: string | null;
  updatedAt: Date;
  agentType: string | null;
  chatInstanceId: string;
  modalName: string | null;
  modalEmbedSlug: string | null;
  
  // Transformed/computed fields
  agentName: string;
  name: string;
  completionRate: number;
  completionDate: string;
  customerWords: number;
  summary: string;
  transcript: string;
  email: string;
}

export interface AggregatedStats {
  totalResponses: number;
  totalCustomerWords: number;
  avgCompletionRate: number;
}

export interface AggregatedResponsesApiResponse {
  responses: TransformedResponse[];
  pagination: PaginationMeta;
  aggregatedStats: AggregatedStats;
  filters: ResponseFilters;
}

// For download functionality
export interface DownloadFormat {
  type: 'csv' | 'llm';
  filters: ResponseFilters;
}

// For the frontend components
export interface ResponsesPageProps {
  initialData?: AggregatedResponsesApiResponse;
  initialFilters?: ResponseFilters;
  initialPage?: number;
  userId: string;
}

export interface ResponsesFiltersProps {
  filters: ResponseFilters;
  onFiltersChange: (filters: ResponseFilters) => void;
  onClearFilters: () => void;
  agentTypes: Array<{ id: string; name: string }>;
  modalNames: string[];
}

export interface ResponsesPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export interface ResponsesDownloadProps {
  filters: ResponseFilters;
  totalCount: number;
  onDownload: (format: 'csv' | 'llm') => void;
  isDownloading: boolean;
} 