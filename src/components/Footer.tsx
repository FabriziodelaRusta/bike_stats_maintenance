import React from 'react';
import { AppDataPayload } from '../types';
import { Bike, MapPin, Activity, DollarSign, Calendar, Wrench } from 'lucide-react';

interface FooterProps {
  data: AppDataPayload;
}

export const Footer: React.FC<FooterProps> = ({ data }) => {
  const { rides, bikes, expenses, maintenanceLogs, settings } = data;
  const { footerSettings } = settings;

  const totalRides = rides.length;
  const totalKm = rides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);
  const totalDplus = rides.reduce((s, r) => s + (Number(r.elevationGainM) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.price) || 0), 0);
  const totalMaintenances = maintenanceLogs.length;

  // Determine text shadow css style based on user settings
  const getShadowStyle = () => {
    switch (footerSettings?.textShadow) {
      case 'subtle':
        return 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]';
      case 'glow':
        return 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'strong':
        return 'drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]';
      case 'vintage':
        return 'drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <footer id="app-footer-custom" className="w-full mt-12 bg-slate-900 text-slate-200 border-t border-slate-800 custom-footer-scope">
      {footerSettings?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: `
          #app-footer-custom, .custom-footer-scope {
            ${footerSettings.customCss}
          }
        `}} />
      )}
      {/* Universal Summary Bar (Totaux Généraux) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-6 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400 inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Synthèse Globale de l'Activité
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Total Général & Statistiques Cumulées
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Randos */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:border-emerald-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {totalRides}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Randos effectuées
              </div>
            </div>

            {/* Total Kilomètres */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:border-emerald-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-1.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                {Math.round(totalKm).toLocaleString('fr-FR')} <span className="text-sm font-semibold">km</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Distance totale cumulée
              </div>
            </div>

            {/* Total D+ */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:border-emerald-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
                <Bike className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
                {Math.round(totalDplus).toLocaleString('fr-FR')} <span className="text-sm font-semibold">m</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Dénivelé positif D+
              </div>
            </div>

            {/* Total Entretiens */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:border-emerald-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-blue-300 tracking-tight">
                {totalMaintenances}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Opérations maintenance
              </div>
            </div>

            {/* Total Dépenses */}
            <div className="col-span-2 sm:col-span-1 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:border-emerald-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1.5">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-rose-300 tracking-tight">
                {Math.round(totalExpenses).toLocaleString('fr-FR')} <span className="text-sm font-semibold">€</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Total dépenses engagées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature and version centered at bottom as strictly requested */}
      <div className="py-6 px-4 text-center">
        <div
          className={`inline-flex flex-col items-center justify-center transition-all ${getShadowStyle()}`}
          style={{
            fontFamily: footerSettings?.fontFamily || 'Space Grotesk',
            color: footerSettings?.fontColor || '#94a3b8',
          }}
        >
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold tracking-wide">
            <span>{footerSettings?.authorText || 'FabriziodelaRusta'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {footerSettings?.versionText || 'v1.1'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">
            Gestion locale des données • Fichiers & Backups autonomes
          </p>
        </div>
      </div>
    </footer>
  );
};
