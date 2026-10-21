import React from 'react';
import { Bike, AppDataPayload, TabConfig } from '../types';
import { 
  Bike as BikeIcon, 
  Wrench, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Activity, 
  Settings, 
  Zap, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

interface HeaderProps {
  data: AppDataPayload;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  tabDefinitions: TabConfig[];
}

const TAB_ICON_MAP: Record<string, React.ReactNode> = {
  'tab-1': <Layers className="w-4 h-4" />,
  'tab-2': <DollarSign className="w-4 h-4" />,
  'tab-3': <Wrench className="w-4 h-4" />,
  'tab-4': <MapPin className="w-4 h-4" />,
  'tab-5': <Calendar className="w-4 h-4" />,
  'tab-6': <Activity className="w-4 h-4" />,
  'tab-99': <Settings className="w-4 h-4" />,
};

export const Header: React.FC<HeaderProps> = ({
  data,
  activeTab,
  onSelectTab,
  tabDefinitions,
}) => {
  const { settings, bikes, rides, expenses, maintenanceLogs } = data;

  // Global KPI calculations
  const totalKm = rides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);
  const totalRides = rides.length;
  const totalSpent = expenses.reduce((s, e) => s + (Number(e.price) || 0), 0);
  const activeBikes = bikes.filter((b) => b.status === 'actif').length;
  const aeBikes = bikes.filter((b) => b.isElectric).length;

  // Order tabs based on user preference in settings.tabOrder
  const orderedTabs = settings.tabOrder
    .map((id) => tabDefinitions.find((t) => t.id === id))
    .filter((t): t is TabConfig => !!t && t.enabled);

  return (
    <header className="w-full">
      {settings.showHeaderBanner && (
        <div
          className="border-b shadow-sm transition-colors duration-200"
          style={{
            backgroundColor: settings.bannerBgColor || '#0f172a',
            color: settings.bannerTextColor || '#ffffff',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Brand and Logo */}
              <div className="flex items-center gap-3.5">
                {settings.pageIconUrl ? (
                  <img
                    src={settings.pageIconUrl}
                    alt="Logo"
                    className="w-11 h-11 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/20">
                    <BikeIcon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                      {settings.appTitle || 'Stats et Maintenance Vélo'}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Local
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300/90 font-normal">
                    Suivi multi-vélos • Randos & Sorties • Maintenance proactive • Dépenses
                  </p>
                </div>
              </div>

              {/* Quick counters in banner */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <BikeIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    <strong className="text-white font-semibold">{activeBikes}</strong> vélos
                    {aeBikes > 0 && <span className="text-slate-300 text-[11px] ml-1">({aeBikes} AE)</span>}
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    <strong className="text-white font-semibold">{totalRides}</strong> randos
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    <strong className="text-white font-semibold">
                      {Math.round(totalKm).toLocaleString('fr-FR')}
                    </strong>{' '}
                    km
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    <strong className="text-white font-semibold">
                      {Math.round(totalSpent).toLocaleString('fr-FR')} €
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2.5 scrollbar-thin">
            {orderedTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isSpecial = tab.id === 'tab-99';

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${isSpecial ? 'ml-auto border border-dashed border-slate-300 dark:border-slate-700' : ''}`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                    {TAB_ICON_MAP[tab.id] || <BikeIcon className="w-4 h-4" />}
                  </span>
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
