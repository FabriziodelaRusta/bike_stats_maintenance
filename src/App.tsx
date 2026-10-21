import React, { useState, useEffect } from 'react';
import { 
  AppDataPayload, 
  Bike, 
  BikeComponentLink, 
  ComponentCategory, 
  Expense, 
  MaintenanceLog, 
  Ride, 
  RideTypeItem, 
  PageSettings, 
  TabConfig 
} from './types';
import { 
  loadStoredAppData, 
  saveAppData, 
  checkAndPerformAutoBackup, 
  getInitialAppData,
  getBlankAppData,
  getDemoAppData
} from './services/storage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Tab1Bikes } from './components/tabs/Tab1Bikes';
import { Tab2Expenses } from './components/tabs/Tab2Expenses';
import { Tab3Maintenance } from './components/tabs/Tab3Maintenance';
import { Tab4Rides } from './components/tabs/Tab4Rides';
import { Tab5StatsCalendar } from './components/tabs/Tab5StatsCalendar';
import { Tab6MaintenanceStatus } from './components/tabs/Tab6MaintenanceStatus';
import { Tab99Settings } from './components/tabs/Tab99Settings';

const TAB_DEFINITIONS: TabConfig[] = [
  { id: 'tab-1', title: 'Paramètres Vélo', shortTitle: 'Vélos & Composants', iconName: 'Layers', enabled: true },
  { id: 'tab-2', title: 'Dépenses Vélo', shortTitle: 'Dépenses', iconName: 'DollarSign', enabled: true },
  { id: 'tab-3', title: 'Historique Maintenance', shortTitle: 'Maintenance', iconName: 'Wrench', enabled: true },
  { id: 'tab-4', title: 'Randos Effectuées', shortTitle: 'Randos', iconName: 'MapPin', enabled: true },
  { id: 'tab-5', title: 'Statistiques Calendrier', shortTitle: 'Statistiques', iconName: 'Calendar', enabled: true },
  { id: 'tab-6', title: 'État de Maintenance', shortTitle: 'État Usure', iconName: 'Activity', enabled: true },
  { id: 'tab-99', title: 'Paramètres & Backups', shortTitle: 'Paramètres', iconName: 'Settings', enabled: true },
];

export default function App() {
  const [data, setData] = useState<AppDataPayload>(() => loadStoredAppData());
  const [activeTab, setActiveTab] = useState<string>(() => data.settings.tabOrder[0] || 'tab-1');

  // Check and perform auto-backup on mount if enabled
  useEffect(() => {
    checkAndPerformAutoBackup(data);
  }, []);

  // Sync title and favicon
  useEffect(() => {
    if (data.settings.appTitle) {
      document.title = data.settings.appTitle;
    }
    if (data.settings.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = data.settings.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [data.settings.appTitle, data.settings.faviconUrl]);

  // Persist state updates to local storage
  const updateData = (newData: AppDataPayload) => {
    setData(newData);
    saveAppData(newData);
  };

  const handleUpdateBikes = (bikes: Bike[]) => {
    updateData({ ...data, bikes });
  };

  const handleUpdateCategories = (componentCategories: ComponentCategory[]) => {
    updateData({ ...data, componentCategories });
  };

  const handleUpdateLinks = (bikeComponentLinks: BikeComponentLink[]) => {
    updateData({ ...data, bikeComponentLinks });
  };

  const handleUpdateExpenses = (expenses: Expense[]) => {
    updateData({ ...data, expenses });
  };

  const handleUpdateMaintenanceLogs = (maintenanceLogs: MaintenanceLog[]) => {
    updateData({ ...data, maintenanceLogs });
  };

  const handleUpdateRides = (rides: Ride[]) => {
    updateData({ ...data, rides });
  };

  const handleUpdateRideTypes = (rideTypes: RideTypeItem[]) => {
    updateData({ ...data, rideTypes });
  };

  const handleUpdateSettings = (settings: PageSettings) => {
    updateData({ ...data, settings });
  };

  const handleRestoreData = (restoredData: AppDataPayload) => {
    updateData(restoredData);
  };

  const handleResetData = () => {
    if (window.confirm('Voulez-vous charger le jeu complet de données de démonstration (Colnago, Canyon, randos démo) ?')) {
      const demo = getDemoAppData(data.settings);
      updateData(demo);
      alert('Données de démonstration chargées avec succès.');
    }
  };

  const handleClearToBlank = () => {
    if (window.confirm('Voulez-vous vider toutes les données pour démarrer à zéro (0 vélo, 0 rando) avec vos propres données ?')) {
      const blank = getBlankAppData(data.settings);
      updateData(blank);
      alert('Base de données vidée avec succès. Vous commencez à zéro !');
    }
  };

  // Dynamic root font size class
  const getFontSizeClass = () => {
    switch (data.settings.fontSizeBase) {
      case 'compact':
        return 'text-xs sm:text-sm';
      case 'grand':
        return 'text-base sm:text-lg';
      case 'normal':
      default:
        return 'text-sm sm:text-base';
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between ${getFontSizeClass()}`}
      style={{
        fontFamily: data.settings.fontFamily ? `"${data.settings.fontFamily}", sans-serif` : 'Inter, sans-serif',
      }}
    >
      <div>
        {/* Main Header with banner, live stats and tabs */}
        <Header
          data={data}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tabDefinitions={TAB_DEFINITIONS}
        />

        {/* Tab Content Body */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'tab-1' && (
            <Tab1Bikes
              data={data}
              onUpdateBikes={handleUpdateBikes}
              onUpdateCategories={handleUpdateCategories}
              onUpdateLinks={handleUpdateLinks}
            />
          )}

          {activeTab === 'tab-2' && (
            <Tab2Expenses
              data={data}
              onUpdateExpenses={handleUpdateExpenses}
            />
          )}

          {activeTab === 'tab-3' && (
            <Tab3Maintenance
              data={data}
              onUpdateMaintenanceLogs={handleUpdateMaintenanceLogs}
            />
          )}

          {activeTab === 'tab-4' && (
            <Tab4Rides
              data={data}
              onUpdateRides={handleUpdateRides}
              onUpdateRideTypes={handleUpdateRideTypes}
            />
          )}

          {activeTab === 'tab-5' && (
            <Tab5StatsCalendar
              data={data}
            />
          )}

          {activeTab === 'tab-6' && (
            <Tab6MaintenanceStatus
              data={data}
              onUpdateMaintenanceLogs={handleUpdateMaintenanceLogs}
            />
          )}

          {activeTab === 'tab-99' && (
            <Tab99Settings
              data={data}
              tabDefinitions={TAB_DEFINITIONS}
              onUpdateSettings={handleUpdateSettings}
              onRestoreData={handleRestoreData}
              onResetData={handleResetData}
              onClearToBlank={handleClearToBlank}
            />
          )}
        </main>
      </div>

      {/* Universal Footer with Total General of rides/km and centered FabriziodelaRusta signature */}
      <Footer data={data} />
    </div>
  );
}
