import { AppDataPayload, BackupRecord, PageSettings } from '../types';
import {
  DEFAULT_BIKES,
  DEFAULT_COMPONENT_CATEGORIES,
  DEFAULT_BIKE_COMPONENTS,
  DEFAULT_EXPENSES,
  DEFAULT_MAINTENANCE_LOGS,
  DEFAULT_RIDE_TYPES,
  DEFAULT_RIDES,
  DEFAULT_PAGE_SETTINGS,
} from '../mockData';

const STORAGE_KEY_DATA = 'velo_stats_app_data_v1';
const STORAGE_KEY_BACKUPS = 'velo_stats_app_backups_v1';
const LAST_AUTOBACKUP_KEY = 'velo_stats_last_autobackup_time';

export function getInitialAppData(): AppDataPayload {
  return {
    bikes: [],
    componentCategories: DEFAULT_COMPONENT_CATEGORIES,
    bikeComponentLinks: [],
    expenses: [],
    maintenanceLogs: [],
    rideTypes: DEFAULT_RIDE_TYPES,
    rides: [],
    settings: DEFAULT_PAGE_SETTINGS,
  };
}

export function getBlankAppData(existingSettings?: PageSettings): AppDataPayload {
  return {
    bikes: [],
    componentCategories: DEFAULT_COMPONENT_CATEGORIES,
    bikeComponentLinks: [],
    expenses: [],
    maintenanceLogs: [],
    rideTypes: DEFAULT_RIDE_TYPES,
    rides: [],
    settings: existingSettings || DEFAULT_PAGE_SETTINGS,
  };
}

export function getDemoAppData(existingSettings?: PageSettings): AppDataPayload {
  return {
    bikes: DEFAULT_BIKES,
    componentCategories: DEFAULT_COMPONENT_CATEGORIES,
    bikeComponentLinks: DEFAULT_BIKE_COMPONENTS,
    expenses: DEFAULT_EXPENSES,
    maintenanceLogs: DEFAULT_MAINTENANCE_LOGS,
    rideTypes: DEFAULT_RIDE_TYPES,
    rides: DEFAULT_RIDES,
    settings: existingSettings || DEFAULT_PAGE_SETTINGS,
  };
}

export function loadStoredAppData(): AppDataPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATA);
    if (!raw) {
      const initial = getInitialAppData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<AppDataPayload>;
    return {
      bikes: parsed.bikes ?? [],
      componentCategories: parsed.componentCategories ?? DEFAULT_COMPONENT_CATEGORIES,
      bikeComponentLinks: parsed.bikeComponentLinks ?? [],
      expenses: parsed.expenses ?? [],
      maintenanceLogs: parsed.maintenanceLogs ?? [],
      rideTypes: parsed.rideTypes ?? DEFAULT_RIDE_TYPES,
      rides: parsed.rides ?? [],
      settings: { ...DEFAULT_PAGE_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('Failed to load data from storage, fallback to defaults', err);
    return getInitialAppData();
  }
}

export function saveAppData(data: AppDataPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage', err);
  }
}

export function loadBackups(): BackupRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUPS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read backups', err);
    return [];
  }
}

export function saveBackups(backups: BackupRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(backups));
  } catch (err) {
    console.error('Failed to save backups list', err);
  }
}

function formatBackupFilename(date: Date, prefix: string = 'velo_stats_backup.json'): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}_${prefix}`;
}

export function createBackupRecord(
  data: AppDataPayload,
  reason: string = 'manuel'
): BackupRecord {
  const now = new Date();
  const filename = formatBackupFilename(now);
  const jsonString = JSON.stringify(data);
  const sizeBytes = new Blob([jsonString]).size;
  const path = `${data.settings.backupStoragePath.replace(/\/$/, '')}/${filename}`;

  const totalKm = data.rides.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0);

  const backup: BackupRecord = {
    id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: now.toISOString(),
    filename,
    path,
    sizeBytes,
    summary: {
      bikesCount: data.bikes.length,
      ridesCount: data.rides.length,
      maintenanceCount: data.maintenanceLogs.length,
      expensesCount: data.expenses.length,
      totalKm: Math.round(totalKm * 10) / 10,
    },
    data,
  };

  const existingBackups = loadBackups();
  const maxKeep = Math.max(1, data.settings.maxBackupsToKeep || 10);
  const updatedBackups = [backup, ...existingBackups].slice(0, maxKeep);
  saveBackups(updatedBackups);

  return backup;
}

export function checkAndPerformAutoBackup(data: AppDataPayload): BackupRecord | null {
  if (!data.settings.autoBackupOnLoad) return null;

  try {
    const lastBackupTime = localStorage.getItem(LAST_AUTOBACKUP_KEY);
    const now = Date.now();
    // Do not autobackup more often than once per 5 minutes on page reloads
    if (lastBackupTime && now - parseInt(lastBackupTime, 10) < 5 * 60 * 1000) {
      return null;
    }
    localStorage.setItem(LAST_AUTOBACKUP_KEY, String(now));
    return createBackupRecord(data, 'auto-chargement');
  } catch (e) {
    console.error('Auto-backup check failed', e);
    return null;
  }
}

export function deleteBackupRecord(backupId: string): BackupRecord[] {
  const current = loadBackups();
  const filtered = current.filter((b) => b.id !== backupId);
  saveBackups(filtered);
  return filtered;
}

export function downloadBackupFile(backup: BackupRecord): void {
  const json = JSON.stringify(backup.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backup.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCurrentDataAsFile(data: AppDataPayload): void {
  const now = new Date();
  const filename = formatBackupFilename(now, 'export_velos.json');
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
