import React, { useState, useMemo } from 'react';
import { AppDataPayload, Ride, Bike, RideTypeItem } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  Zap, 
  MapPin, 
  Activity, 
  Layers, 
  BarChart3, 
  Compass, 
  FileText 
} from 'lucide-react';
import { exportStatsToPdf } from '../../services/pdfExport';

interface Tab5StatsCalendarProps {
  data: AppDataPayload;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const Tab5StatsCalendar: React.FC<Tab5StatsCalendarProps> = ({ data }) => {
  const currentDate = new Date();
  const [viewMode, setViewMode] = useState<'annuelle' | 'mensuelle'>('annuelle');
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed

  // Filters
  const [filterBike, setFilterBike] = useState<string>('all');
  const [filterAe, setFilterAe] = useState<'all' | 'ae_only' | 'no_ae'>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all'); // 'all', 'q1', 'q2', 'q3', 'q4', 'summer'

  // Extract available years from rides data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    data.rides.forEach((r) => {
      const yr = parseInt(r.date.split('-')[0], 10);
      if (!isNaN(yr)) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data.rides]);

  // Filter rides based on year, bike, AE status, and period
  const filteredRides = useMemo(() => {
    return data.rides.filter((ride) => {
      const [rYearStr, rMonthStr] = ride.date.split('-');
      const rYear = parseInt(rYearStr, 10);
      const rMonth = parseInt(rMonthStr, 10); // 1-12

      // Year match
      if (rYear !== selectedYear) return false;

      // Bike match
      if (filterBike !== 'all' && ride.bikeId !== filterBike) return false;

      // AE filter match
      const bike = data.bikes.find((b) => b.id === ride.bikeId);
      if (filterAe === 'ae_only' && !bike?.isElectric) return false;
      if (filterAe === 'no_ae' && bike?.isElectric) return false;

      // Period filter match
      if (filterPeriod === 'q1' && !(rMonth >= 1 && rMonth <= 3)) return false;
      if (filterPeriod === 'q2' && !(rMonth >= 4 && rMonth <= 6)) return false;
      if (filterPeriod === 'q3' && !(rMonth >= 7 && rMonth <= 9)) return false;
      if (filterPeriod === 'q4' && !(rMonth >= 10 && rMonth <= 12)) return false;
      if (filterPeriod === 'summer' && !(rMonth >= 5 && rMonth <= 9)) return false;

      return true;
    });
  }, [data.rides, data.bikes, selectedYear, filterBike, filterAe, filterPeriod]);

  // Aggregate monthly stats for the 12 months in the year view
  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthNum = monthIdx + 1;
      const monthPrefix = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
      const ridesInMonth = filteredRides.filter((r) => r.date.startsWith(monthPrefix));
      const totalKm = ridesInMonth.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);
      const totalDplus = ridesInMonth.reduce((s, r) => s + (Number(r.elevationGainM) || 0), 0);

      // Group by ride type for sub-details
      const typeBreakdownMap = new Map<string, { count: number; km: number; typeItem: RideTypeItem }>();
      ridesInMonth.forEach((r) => {
        const typeItem = data.rideTypes.find((t) => t.id === r.rideTypeId) || {
          id: r.rideTypeId,
          name: 'Autre',
          color: '#64748b',
        };
        const entry = typeBreakdownMap.get(r.rideTypeId) || { count: 0, km: 0, typeItem };
        entry.count += 1;
        entry.km += Number(r.distanceKm) || 0;
        typeBreakdownMap.set(r.rideTypeId, entry);
      });

      return {
        monthIndex: monthIdx,
        monthName: MONTH_NAMES[monthIdx],
        rides: ridesInMonth,
        ridesCount: ridesInMonth.length,
        totalKm: Math.round(totalKm * 10) / 10,
        totalDplus: Math.round(totalDplus),
        typeBreakdown: Array.from(typeBreakdownMap.values()).sort((a, b) => b.km - a.km),
      };
    });
  }, [filteredRides, selectedYear, data.rideTypes]);

  // Monthly calendar days matrix (for viewMode === 'mensuelle')
  const calendarDays = useMemo(() => {
    if (viewMode !== 'mensuelle') return [];

    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday is index 0 in French standard (0=Sun, 1=Mon... in JS Date)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    // Leading empty days
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRides = filteredRides.filter((r) => r.date === dateStr);
      const dayKm = dayRides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);

      // Breakdown by type
      const typeBreakdownMap = new Map<string, { count: number; km: number; typeItem: RideTypeItem }>();
      dayRides.forEach((r) => {
        const typeItem = data.rideTypes.find((t) => t.id === r.rideTypeId) || {
          id: r.rideTypeId,
          name: 'Autre',
          color: '#64748b',
        };
        const entry = typeBreakdownMap.get(r.rideTypeId) || { count: 0, km: 0, typeItem };
        entry.count += 1;
        entry.km += Number(r.distanceKm) || 0;
        typeBreakdownMap.set(r.rideTypeId, entry);
      });

      days.push({
        dayNumber: d,
        dateStr,
        rides: dayRides,
        ridesCount: dayRides.length,
        totalKm: Math.round(dayKm * 10) / 10,
        typeBreakdown: Array.from(typeBreakdownMap.values()),
      });
    }

    return days;
  }, [viewMode, selectedYear, selectedMonth, filteredRides, data.rideTypes]);

  // Overall totals for the active filtered selection
  const grandTotalKm = useMemo(
    () => filteredRides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0),
    [filteredRides]
  );
  const grandTotalRides = filteredRides.length;

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Handle PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const selectedBike = data.bikes.find((b) => b.id === filterBike);
      const bikeLabel = selectedBike ? `${selectedBike.name} (${selectedBike.brand})` : 'Tous les vélos';

      let aeLabel = 'Tous (AE + Musculaire)';
      if (filterAe === 'ae_only') aeLabel = 'Assistance Électrique (AE) uniquement';
      if (filterAe === 'no_ae') aeLabel = 'Musculaire uniquement (Sans AE)';

      let periodLabel = 'Année entière';
      if (filterPeriod === 'q1') periodLabel = 'Trimestre 1 (Janvier - Mars)';
      if (filterPeriod === 'q2') periodLabel = 'Trimestre 2 (Avril - Juin)';
      if (filterPeriod === 'q3') periodLabel = 'Trimestre 3 (Juillet - Septembre)';
      if (filterPeriod === 'q4') periodLabel = 'Trimestre 4 (Octobre - Décembre)';
      if (filterPeriod === 'summer') periodLabel = 'Saison Estivale (Mai - Septembre)';

      const calendarElement = document.getElementById('stats-calendar-render-target');

      await exportStatsToPdf({
        year: selectedYear,
        periodLabel,
        selectedBikeName: bikeLabel,
        selectedAeLabel: aeLabel,
        filteredRides,
        bikes: data.bikes,
        rideTypes: data.rideTypes,
        appTitle: data.settings.appTitle,
        authorText: data.settings.footerSettings?.authorText || 'FabriziodelaRusta',
        versionText: data.settings.footerSettings?.versionText || 'v1.1',
        viewMode,
        selectedMonthIndex: selectedMonth,
        monthlyStats,
        calendarElement,
      });
    } catch (err) {
      console.error('Error generating landscape PDF', err);
      alert('Une erreur est survenue lors de l\'exportation PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* View Mode Toggle & Year/Month selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switch Pills */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('annuelle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'annuelle'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Vue Annuelle (12 Mois)
            </button>
            <button
              onClick={() => setViewMode('mensuelle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'mensuelle'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Vue Mensuelle (Calendrier)
            </button>
          </div>

          {/* Year navigator */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title="Année précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-sm text-slate-900 dark:text-white px-2 py-0.5 focus:outline-hidden cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title="Année suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month selector if in monthly view */}
          {viewMode === 'mensuelle' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear((y) => y - 1);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-sm text-slate-900 dark:text-white px-2 py-0.5 focus:outline-hidden cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear((y) => y + 1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Pro Landscape PDF Export button */}
        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
          title="Télécharger les statistiques au format PDF paysage (comme affiché à l'écran)"
        >
          <FileText className="w-4 h-4" />
          <span>{isExportingPdf ? 'Génération du PDF paysage...' : 'Télécharger les stats (PDF Paysage)'}</span>
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtres statistiques appliqués :</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bike filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filtrer par Vélo</label>
            <select
              value={filterBike}
              onChange={(e) => setFilterBike(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Tous les vélos ({data.bikes.length})</option>
              {data.bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.brand}) {b.isElectric ? '⚡ AE' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* AE or not filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assistance Électrique (AE)</label>
            <select
              value={filterAe}
              onChange={(e) => setFilterAe(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Tous (AE et Musculaire)</option>
              <option value="ae_only">⚡ Assistance Électrique (AE) uniquement</option>
              <option value="no_ae">Musculaire uniquement (Sans AE)</option>
            </select>
          </div>

          {/* Period filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Période de l'année</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Toute l'année {selectedYear}</option>
              <option value="q1">Trimestre 1 (Janvier - Mars)</option>
              <option value="q2">Trimestre 2 (Avril - Juin)</option>
              <option value="q3">Trimestre 3 (Juillet - Septembre)</option>
              <option value="q4">Trimestre 4 (Octobre - Décembre)</option>
              <option value="summer">Saison estivale (Mai à Septembre)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mini KPI banner for current filtered selection */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-xl p-4 text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
            Synthèse de la période sélectionnée ({selectedYear})
          </span>
          <div className="text-xl sm:text-2xl font-black mt-0.5">
            {Math.round(grandTotalKm).toLocaleString('fr-FR')} km parcourus
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-black">{grandTotalRides}</div>
            <div className="text-xs text-emerald-100">Randos</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-black">
              {grandTotalRides > 0 ? (grandTotalKm / grandTotalRides).toFixed(1) : 0}
            </div>
            <div className="text-xs text-emerald-100">km / rando</div>
          </div>
        </div>
      </div>

      {/* CALENDAR RENDER TARGET FOR LANDSCAPE PDF EXPORT */}
      <div id="stats-calendar-render-target" className="space-y-4">
        {/* VUE 1: ANNUELLE (GRILLE DES 12 MOIS) */}
        {viewMode === 'annuelle' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <span>Calendrier Annuel {selectedYear} : Répartition Mensuelle & Sous-détails</span>
            </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthlyStats.map((m) => (
              <div
                key={m.monthIndex}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  m.ridesCount > 0
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-500/50'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                }`}
              >
                <div>
                  {/* Month title & totals */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2 mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {m.monthName}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        m.ridesCount > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {m.ridesCount} rando{m.ridesCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Main Metric */}
                  <div className="mb-3">
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {m.totalKm > 0 ? `${m.totalKm.toLocaleString('fr-FR')} km` : '0 km'}
                    </div>
                    {m.totalDplus > 0 && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        +{m.totalDplus.toLocaleString('fr-FR')} m D+
                      </div>
                    )}
                  </div>

                  {/* Sub-details per ride type */}
                  {m.typeBreakdown.length > 0 ? (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Détails par type :
                      </div>
                      {m.typeBreakdown.map((t) => (
                        <div
                          key={t.typeItem.id}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: t.typeItem.color }}
                            />
                            <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                              {t.typeItem.name}
                            </span>
                          </div>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap text-[11px]">
                            {t.km.toFixed(0)} km <span className="text-slate-400 font-normal">({t.count})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">
                      Aucune sortie ce mois
                    </div>
                  )}
                </div>

                {/* Quick view button */}
                {m.ridesCount > 0 && (
                  <button
                    onClick={() => {
                      setSelectedMonth(m.monthIndex);
                      setViewMode('mensuelle');
                    }}
                    className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center pt-2 border-t border-slate-100 dark:border-slate-700/60 cursor-pointer"
                  >
                    Ouvrir le calendrier de {m.monthName} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VUE 2: MENSUELLE (CALENDRIER DES JOURS DU MOIS) */}
      {viewMode === 'mensuelle' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <span>
                Calendrier Détaillé : {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-500/20">
              Total du mois : {monthlyStats[selectedMonth]?.totalKm} km ({monthlyStats[selectedMonth]?.ridesCount} sorties)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center font-bold text-xs py-2.5 text-slate-600 dark:text-slate-400">
              {DAY_NAMES.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-700/60 min-h-[480px]">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="bg-slate-50/40 dark:bg-slate-900/20 p-2 min-h-[90px]"
                    />
                  );
                }

                const hasRides = cell.ridesCount > 0;

                return (
                  <div
                    key={cell.dateStr}
                    className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                      hasRides
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/15 hover:bg-emerald-50/60'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/20'
                    }`}
                  >
                    <div>
                      {/* Day number */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            hasRides
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {hasRides && (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {cell.totalKm} km
                          </span>
                        )}
                      </div>

                      {/* Rides on that day */}
                      {hasRides && (
                        <div className="space-y-1 mt-1">
                          {cell.rides.map((ride) => {
                            const rType = data.rideTypes.find((t) => t.id === ride.rideTypeId);
                            const bike = data.bikes.find((b) => b.id === ride.bikeId);

                            return (
                              <div
                                key={ride.id}
                                className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] shadow-2xs leading-tight"
                              >
                                <div className="flex items-center gap-1">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: rType?.color || '#3b82f6' }}
                                  />
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {rType?.name}
                                  </span>
                                  {bike?.isElectric && (
                                    <span className="text-amber-500 font-bold">⚡</span>
                                  )}
                                </div>

                                {ride.commentForType && (
                                  <div className="text-emerald-700 dark:text-emerald-400 font-medium truncate mt-0.5">
                                    {ride.commentForType}
                                  </div>
                                )}

                                <div className="text-slate-500 font-mono mt-0.5">
                                  {ride.distanceKm} km {ride.elevationGainM ? `• ${ride.elevationGainM}m D+` : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
