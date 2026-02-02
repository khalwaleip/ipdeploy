
export interface UserInfo {
  name: string;
  email: string;
  whatsapp: string;
}

export interface MailingListEntry {
  full_name: string;
  niche: string;
  email: string;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface AnalysisResult {
  summary: string;
  jurisdictionAnalysis: {
    kenya: string;
    us: string;
    uk: string;
  };
  redFlags: string[];
  recommendations: string[];
  fullMarkdown: string;
}

export enum AppState {
  LANDING,
  ARTIST_EDU,
  PRODUCER_EDU,
  DETAILS_FORM,
  UPLOAD,
  ANALYZING,
  RESULTS,
  PAYMENT,
  CONSULT_FORM,
  GENERATING_BRIEF,
  BOOKING,
  STORE,
  ERROR,
  QUIZ_INTRO,
  QUIZ_GAME,
  QUIZ_RESULTS,
  CERTIFICATE,
  ARCHIVE
}

export interface LegalTemplate {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  benefits: string[];
}

export interface ContractFile {
  name: string;
  type: string;
  base64: string; 
  mimeType: string;
}

export interface CaseFile {
  id: string;
  createdDate: string;
  clientComplaints: string;
  attorneyBrief: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sourceUrl: string; 
}

export type QuizCategory = 'Music Business' | 'Film Industry' | 'Publishing' | 'Production' | 'Artist Rights';

export interface DBClient {
  id: string; 
  full_name: string;
  email: string;
  whatsapp: string;
  created_at: string;
}

export interface DBContractAudit {
  id: string; 
  client_id: string;
  contract_name: string;
  analysis_summary: string; 
  risk_score: number;
  created_at: string;
}
