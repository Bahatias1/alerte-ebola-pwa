import Dexie, { type Table } from 'dexie';
import type {
  UserProfile,
  FamilyMember,
  FavoriteZone,
  EbolaAlert,
  AIChatMessage,
  ReportedCase,
  EpidemicUpdate,
  OfficialSource,
  HealthCenter,
  EpidemicStats
} from './types';
import type { FormOutboxItem } from './services/outboxTypes';

export class AlertEbolaDatabase extends Dexie {
  userProfiles!: Table<UserProfile, string>;
  familyMembers!: Table<FamilyMember, number>;
  favoriteZones!: Table<FavoriteZone, string>;
  alerts!: Table<EbolaAlert, string>;
  aiChatMessages!: Table<AIChatMessage, number>;
  reportedCases!: Table<ReportedCase, string>;
  epidemicUpdates!: Table<EpidemicUpdate, number>;
  officialSources!: Table<OfficialSource, string>;
  healthCenters!: Table<HealthCenter, string>;
  epidemicStats!: Table<EpidemicStats, number>;
  formOutbox!: Table<FormOutboxItem, string>;

  constructor() {
    super('AlertEbolaDatabase');
    
    // Schema definition.
    // Indexes list properties we want to query by.
    this.version(1).stores({
      userProfiles: 'id, email',
      familyMembers: '++id, name, relationship',
      favoriteZones: 'region',
      alerts: 'id, region, severity, timestamp, isRead',
      aiChatMessages: '++id, sender, timestamp',
      reportedCases: 'id, userId, status, createdAt',
      epidemicUpdates: '++id, province',
      officialSources: 'id, sourceType, fetchedAt, publishedAt',
      healthCenters: 'id, province, verified',
      epidemicStats: 'id'
    });

    this.version(2).stores({
      formOutbox: 'id, status, targetTable, createdAt'
    });
  }
}

export const db = new AlertEbolaDatabase();

// Seed initial health articles (symptoms, preventions) into local memory or storage
export const initialArticles = [
  {
    category: "Symptômes",
    titleFr: "Symptôme 1 : Forte Fièvre", titleEn: "Symptom 1: High Fever",
    contentFr: "Une forte fièvre apparaissant soudainement (souvent > 38.5°C) est l'un des premiers signes de l'infection.", contentEn: "A sudden high fever (often > 38.5°C) is one of the first signs of infection."
  },
  {
    category: "Symptômes",
    titleFr: "Symptôme 2 : Maux de tête graves", titleEn: "Symptom 2: Severe Headache",
    contentFr: "Des céphalées (maux de tête) intenses et persistantes qui ne cèdent pas aux calmants habituels.", contentEn: "Intense and persistent headaches."
  },
  {
    category: "Symptômes",
    titleFr: "Symptôme 3 : Douleurs musculaires", titleEn: "Symptom 3: Muscle and Joint pain",
    contentFr: "Des douleurs intenses dans les muscles, les articulations et parfois dans le dos.", contentEn: "Intense muscle and joint pain."
  },
  {
    category: "Symptômes",
    titleFr: "Symptôme 4 : Fatigue intense", titleEn: "Symptom 4: Intense Fatigue",
    contentFr: "Une sensation d'épuisement extrême et de faiblesse générale (asthénie).", contentEn: "Extreme exhaustion and general weakness."
  },
  {
    category: "Symptômes",
    titleFr: "Symptôme 5 : Vomissements et diarrhée", titleEn: "Symptom 5: Vomiting & Diarrhea",
    contentFr: "Nausées, vomissements fréquents et diarrhée liquide, apparaissant quelques jours après la fièvre.", contentEn: "Nausea, frequent vomiting and watery diarrhea."
  },
  {
    category: "Symptômes",
    titleFr: "Symptôme 6 : Maux de gorge et toux", titleEn: "Symptom 6: Sore throat and cough",
    contentFr: "Une inflammation douloureuse de la gorge, parfois accompagnée d'une toux sèche.", contentEn: "Sore throat and dry cough."
  },
  {
    category: "Symptômes",
    titleFr: "Symptôme 7 : Saignements inexpliqués", titleEn: "Symptom 7: Unexplained bleeding",
    contentFr: "Hémorragies internes ou externes : saignements des gencives, du nez ou présence de sang dans les selles (stade avancé).", contentEn: "Internal or external bleeding: gums, nose or blood in stools (advanced stage)."
  },
  {
    category: "Prévention",
    titleFr: "Prévention 1 : Lavage des mains", titleEn: "Prevention 1: Wash hands",
    contentFr: "Lavez-vous fréquemment les mains avec de l'eau et du savon ou une solution hydroalcoolique.", contentEn: "Wash your hands frequently with soap and water."
  },
  {
    category: "Prévention",
    titleFr: "Prévention 2 : Éviter les contacts", titleEn: "Prevention 2: Avoid contact",
    contentFr: "N'ayez pas de contact physique avec les fluides corporels des personnes malades.", contentEn: "Avoid contact with bodily fluids of sick people."
  },
  {
    category: "Prévention",
    titleFr: "Prévention 3 : Rites funéraires", titleEn: "Prevention 3: Safe burials",
    contentFr: "Laissez les professionnels gérer le corps d'une personne décédée d'Ebola.", contentEn: "Avoid contact with the body of someone who died of Ebola."
  },
  {
    category: "Prévention",
    titleFr: "Prévention 4 : Viande de brousse", titleEn: "Prevention 4: Bushmeat",
    contentFr: "Évitez de consommer de la viande d'animaux sauvages, comme les chauves-souris ou les singes.", contentEn: "Avoid handling and eating wild animal meat."
  }
];
