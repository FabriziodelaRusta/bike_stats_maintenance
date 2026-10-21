export type BikeType = 'Route' | 'Gravel' | 'VTT' | 'Voyage / Rando' | 'Ville / Urbain' | 'Cyclotourisme' | 'Autre';

export type BikeStatus = 'actif' | 'maintenance' | 'archive';

export interface Bike {
  id: string;
  name: string;
  brand: string;
  model: string;
  year?: number;
  frameNumber?: string;
  type: BikeType;
  isElectric: boolean; // AE (Assistance Électrique ou non)
  color?: string;
  notes?: string;
  purchaseDate?: string;
  initialKm?: number;
  status: BikeStatus;
  photoUrl?: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  category: 'Transmission' | 'Roulement' | 'Freinage' | 'Poste de pilotage' | 'Roues & Pneus' | 'Électrique' | 'Autre';
  defaultLifespanKm: number;
  description?: string;
}

export interface BikeComponentLink {
  id: string;
  bikeId: string;
  componentCategoryId: string;
  customName?: string; // ex: "Chaîne Shimano Ultegra 12v"
  installedDate: string; // YYYY-MM-DD
  installedAtKm?: number; // Km au compteur lors de la pose
  lifespanKmTarget?: number;
  notes?: string;
}

export type ExpenseCategory = 'Composant' | 'Entretien / Atelier' | 'Consommable' | 'Accessoire' | 'Outillage' | 'Autre';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  bikeId: string;
  pieceName: string; // Pièce / Article
  price: number; // Prix en €
  category: ExpenseCategory;
  provider?: string; // Magasin / Vélociste
  invoiceRef?: string;
  notes?: string;
}

export type MaintenanceOperationType =
  | 'Remplacement à neuf'
  | 'Nettoyage / Dégraissage'
  | 'Réglage / Serrage'
  | 'Lubrification'
  | 'Purge hydraulique'
  | 'Contrôle usure'
  | 'Autre';

export interface MaintenanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  bikeId: string;
  componentName: string; // Composant changé ou entretenu
  bikeComponentLinkId?: string; // lien optionnel vers composition
  operationType: MaintenanceOperationType;
  kmAtService?: number;
  performedBy: string; // Soi-même, Atelier vélociste, etc.
  cost?: number;
  notes?: string;
}

export interface RideTypeItem {
  id: string;
  name: string;
  color: string; // Tailwind or Hex
  isCustom?: boolean;
}

export interface Ride {
  id: string;
  date: string; // YYYY-MM-DD
  bikeId: string;
  rideTypeId: string;
  commentForType?: string; // ex: Voyage -> "Vienne - Gorizia", Flèche -> "Flèche Vélocio", etc.
  distanceKm: number;
  elevationGainM?: number;
  durationMinutes?: number;
  notes?: string;
}

export interface TabConfig {
  id: string; // 'tab-1' | 'tab-2' | 'tab-3' | 'tab-4' | 'tab-5' | 'tab-6' | 'tab-99'
  title: string;
  shortTitle: string;
  iconName: string;
  enabled: boolean;
}

export interface PageSettings {
  appTitle: string;
  fontFamily: 'Inter' | 'Poppins' | 'Montserrat' | 'Outfit' | 'Space Grotesk' | 'Playfair Display' | 'JetBrains Mono';
  fontSizeBase: 'compact' | 'normal' | 'grand';
  themeColor: 'emerald' | 'blue' | 'indigo' | 'teal' | 'amber' | 'rose' | 'slate';
  showHeaderBanner: boolean;
  bannerBgColor: string;
  bannerTextColor: string;
  pageIconUrl: string;
  faviconUrl: string;
  tabOrder: string[]; // List of tab IDs
  workingDataPath: string; // Dossier chemin complet pour les fichiers utilisés
  backupStoragePath: string; // Dossier chemin complet pour les sauvegardes
  autoBackupOnLoad: boolean;
  maxBackupsToKeep: number;
  footerSettings: {
    authorText: string; // "FabriziodelaRusta"
    versionText: string; // "v1.1"
    fontFamily: string;
    fontColor: string;
    textShadow: 'none' | 'subtle' | 'glow' | 'strong' | 'vintage';
    fontSize: 'sm' | 'base' | 'lg' | 'xl';
    customCss?: string; // Code CSS personnalisé pour le pied de page
  };
}

export interface BackupRecord {
  id: string;
  timestamp: string; // ISO
  filename: string; // Format: yyyymmdd_hhmmss + nom du fichier
  path: string;
  sizeBytes: number;
  summary: {
    bikesCount: number;
    ridesCount: number;
    maintenanceCount: number;
    expensesCount: number;
    totalKm: number;
  };
  data: AppDataPayload;
}

export interface AppDataPayload {
  bikes: Bike[];
  componentCategories: ComponentCategory[];
  bikeComponentLinks: BikeComponentLink[];
  expenses: Expense[];
  maintenanceLogs: MaintenanceLog[];
  rideTypes: RideTypeItem[];
  rides: Ride[];
  settings: PageSettings;
}
