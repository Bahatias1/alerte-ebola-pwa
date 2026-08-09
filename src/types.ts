export type UserRole = 
  | 'PUBLIC_USER' 
  | 'HEALTH_AGENT' 
  | 'LABORATORY' 
  | 'SUPERVISOR' 
  | 'MODERATOR'
  | 'ADMIN' 
  | 'SUPER_ADMIN' 
  | 'USER' 
  | 'ADMIN_SANTE';

export interface UserProfile {
  id: string;
  name: string;
  postnom?: string;
  email: string;
  role: UserRole;
  selectedLanguage: 'fr' | 'en';
  locationConsent: boolean;
  notificationsConsent: boolean;
  currentRegion: string;
  isPremium?: boolean;
  joinedTimestamp?: number;
  lastSyncTimestamp?: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface ReportedCase {
  id?: string;
  userId?: string;
  diseaseId?: string;
  diseaseCode?: string;
  fullName: string;
  phone: string;
  location: string;
  symptoms: string;
  description: string;
  status: 'Suspect' | 'Confirmé' | 'Invalidé' | 'under_review' | 'validated' | 'rejected' | 'closed';
  createdAt?: string;
  updatedAt?: string;
  geom?: string; // POINT(longitude latitude)
  latitude?: number;
  longitude?: number;
}

export interface ReportStatusHistory {
  id?: string;
  reportId: string;
  status: string;
  comment?: string;
  createdAt?: string;
}

export interface OfficialSource {
  id: string;
  title: string;
  content: string;
  sourceType: 'OMS' | 'INSP' | 'Radio Okapi' | 'MINSANTE' | string;
  fetchedAt: string;
  publishedAt?: string;
  aiSummary?: string;
  isActive?: boolean;
  isProcessed?: boolean;
  provinceDetected?: string;
  metadata?: Record<string, any>;
}

export interface EpidemicStats {
  id?: number;
  totalCases: number;
  recovered: number;
  deaths: number;
  weeklyTrend: number;
  lastUpdated: string;
}

export interface EpidemicUpdate {
  id?: number;
  province: string;
  newCases: number;
  confirmedCases: number;
  suspectedCases?: number;
  recoveries?: number;
  contactsUnderFollowup?: number;
  newDeaths: number;
  totalDeaths: number;
  donations?: string;
  medicalSupport?: string;
  source: string;
  summary: string;
  articleUrl?: string;
  createdAt?: string;
}

export interface EbolaAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  region: string;
  latitude?: number;
  longitude?: number;
  status: string;
  timestamp: number;
  isRead: boolean;
  isOfficiallyVerified: boolean;
  isSystemGenerated: boolean;
}

export interface HealthCenter {
  id: string;
  name: string;
  province: string;
  bedsAvailable: number;
  totalBeds: number;
  phone: string;
  doctorInCharge: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  address?: string;
  operatingHours?: string;
  emergencyContact?: string;
  lastUpdated?: string;
}

export interface RiskZone {
  id: string;
  name: string;
  region: string;
  riskLevel: number; // 1 = Moyen, 2 = Elevé, 3 = Critique
  riskScore: number;
  geojson?: string;
  geom?: string;
  lastUpdated?: string;
}

export interface AIChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  isDisclaimer?: boolean;
}

export interface FamilyMember {
  id?: number;
  name: string;
  relationship: 'Conjoint' | 'Enfant' | 'Parent' | 'Proche' | string;
  age: number;
  riskStatus: 'Faible' | 'Moyen' | 'Élevé' | string;
  notes?: string;
}

export interface FavoriteZone {
  region: string;
  riskLevel: 'Faible' | 'Moyen' | 'Élevé' | string;
  notificationEnabled: boolean;
}

export interface Disease {
  id: string;
  code: string;
  name: { fr: string; en?: string; sw?: string };
  family?: string;
  transmissionModes?: string[];
  incubationPeriodDays?: string;
  caseFatalityRate?: string;
  pathogenicityLevel?: string;
  isActive?: boolean;
}

export interface IDSRFormTemplate {
  id: string;
  code: string;
  title: { fr: string; en?: string };
  version: number;
  diseaseId: string;
  schemaJson: any;
  uiSchemaJson?: any;
  isPrintable: boolean;
  isActive: boolean;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'GUIDELINE' | 'FAQ' | 'PROTOCOL' | 'VIDEO' | string;
  diseaseCode?: string;
  summary: string;
  fileUrl?: string;
  downloadUrl?: string;
  language: string;
  publishedDate: string;
}

export interface CaseDefinitionRule {
  diseaseCode: string;
  diseaseName: string;
  suspectCriteria: string[];
  probableCriteria: string[];
  confirmedCriteria: string[];
  labRequirement: string;
}

