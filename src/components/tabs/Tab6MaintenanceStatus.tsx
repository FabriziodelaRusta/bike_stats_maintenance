import React, { useState, useMemo } from 'react';
import { AppDataPayload, Bike, MaintenanceLog, MaintenanceOperationType } from '../../types';
import { 
  Activity, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Plus, 
  Calendar, 
  MapPin, 
  Layers, 
  Zap 
} from 'lucide-react';
import { computeBikeComponentStatuses, ComponentMaintenanceStatus } from '../../services/calculations';

interface Tab6MaintenanceStatusProps {
  data: AppDataPayload;
  onUpdateMaintenanceLogs: (logs: MaintenanceLog[]) => void;
}

export const Tab6MaintenanceStatus: React.FC<Tab6MaintenanceStatusProps> = ({
  data,
  onUpdateMaintenanceLogs,
}) => {
  const [selectedBikeId, setSelectedBikeId] = useState<string>(data.bikes[0]?.id || '');
  const [quickServiceModalOpen, setQuickServiceModalOpen] = useState(false);
  const [targetComponent, setTargetComponent] = useState<ComponentMaintenanceStatus | null>(null);

  // Quick maintenance service form
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [serviceOp, setServiceOp] = useState<MaintenanceOperationType>('Remplacement à neuf');
  const [serviceCost, setServiceCost] = useState<number>(0);
  const [serviceNotes, setServiceNotes] = useState<string>('');

  const selectedBike = data.bikes.find((b) => b.id === selectedBikeId) || data.bikes[0];

  // Compute status for the selected bike
  const componentStatuses = useMemo(() => {
    if (!selectedBike) return [];
    return computeBikeComponentStatuses(
      selectedBike.id,
      data.bikeComponentLinks,
      data.componentCategories,
      data.maintenanceLogs,
      data.rides
    );
  }, [selectedBike, data.bikeComponentLinks, data.componentCategories, data.maintenanceLogs, data.rides]);

  // Overall bike status metrics
  const criticalCount = componentStatuses.filter((s) => s.statusLevel === 'critical').length;
  const warningCount = componentStatuses.filter((s) => s.statusLevel === 'warning').length;
  const goodCount = componentStatuses.filter((s) => s.statusLevel === 'good').length;

  const openQuickService = (compStatus: ComponentMaintenanceStatus) => {
    setTargetComponent(compStatus);
    setServiceDate(new Date().toISOString().split('T')[0]);
    setServiceOp('Remplacement à neuf');
    setServiceCost(0);
    setServiceNotes(`Intervention sur ${compStatus.displayName}`);
    setQuickServiceModalOpen(true);
  };

  const handleSaveQuickService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetComponent || !selectedBike) return;

    const newLog: MaintenanceLog = {
      id: `maint-${Date.now()}`,
      date: serviceDate || new Date().toISOString().split('T')[0],
      bikeId: selectedBike.id,
      componentName: targetComponent.displayName,
      bikeComponentLinkId: targetComponent.componentLink.id,
      operationType: serviceOp,
      kmAtService: 0,
      performedBy: 'Soi-même',
      cost: Number(serviceCost) || 0,
      notes: serviceNotes,
    };

    onUpdateMaintenanceLogs([newLog, ...data.maintenanceLogs]);
    setQuickServiceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Bike selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>État d'Usure & Maintenance des Vélos</span>
          </h2>
          <p className="text-xs text-slate-500">
            Suivi kilométrique en temps réel et alertes de remplacement calculées à partir de vos randos réelles.
          </p>
        </div>

        {/* Bike Picker */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <label htmlFor="bike-selector-select" className="text-xs font-bold text-slate-600 dark:text-slate-300 pl-2">
            Vélo :
          </label>
          <select
            id="bike-selector-select"
            value={selectedBikeId}
            onChange={(e) => setSelectedBikeId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            {data.bikes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.brand}) {b.isElectric ? '⚡ AE' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBike && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: selectedBike.color || '#059669' }}
              >
                {selectedBike.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedBike.name}
                  </h3>
                  {selectedBike.isElectric && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <Zap className="w-3 h-3 fill-amber-500" />
                      Assistance Électrique (AE)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedBike.brand} {selectedBike.model} • Type : {selectedBike.type}
                </p>
              </div>
            </div>

            {/* Health pill indicators */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{goodCount} OK</span>
              </div>

              {warningCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{warningCount} À surveiller</span>
                </div>
              )}

              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/40">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>{criticalCount} À remplacer</span>
                </div>
              )}
            </div>
          </div>

          {/* Component list with wear calculation */}
          {componentStatuses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>Aucun composant n'est encore associé à ce vélo.</p>
              <p className="text-xs text-slate-400 mt-1">
                Allez dans l'onglet "1. Paramètres Vélo" &gt; "1.3 - Composition du vélo" pour associer la chaîne, la cassette, les pneus, etc.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {componentStatuses.map((status) => {
                const isCritical = status.statusLevel === 'critical';
                const isWarning = status.statusLevel === 'warning';

                return (
                  <div
                    key={status.componentLink.id}
                    className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                      isCritical
                        ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                        : isWarning
                        ? 'border-amber-300 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      {/* Component name & status badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {status.categoryName}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {status.displayName}
                          </h4>
                        </div>

                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300">
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            À remplacer
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            À surveiller
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Bon état
                          </span>
                        )}
                      </div>

                      {/* Wear Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600 dark:text-slate-300">
                            Usure : <strong className="text-slate-900 dark:text-white">{status.wearPercentage}%</strong>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Objectif : {status.targetLifespanKm.toLocaleString('fr-FR')} km
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical
                                ? 'bg-rose-600'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, status.wearPercentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats: km and rides done since last maintenance */}
                      <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-center">
                        <div>
                          <div className="text-xs text-slate-500 uppercase font-medium">
                            Km effectués depuis
                          </div>
                          <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                            {status.kmSinceLastMaintenance.toLocaleString('fr-FR')} km
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-500 uppercase font-medium">
                            Randos effectuées
                          </div>
                          <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                            {status.ridesSinceLastMaintenance} sortie{status.ridesSinceLastMaintenance > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Last service info */}
                      <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                        <span>
                          Dernier entretien : <strong>{status.lastMaintenanceDate || 'Pose initiale'}</strong>
                        </span>
                        <span className="italic truncate max-w-[150px]">
                          {status.lastMaintenanceOp}
                        </span>
                      </div>
                    </div>

                    {/* Quick maintenance action button */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end">
                      <button
                        onClick={() => openQuickService(status)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                        <span>Enregistrer un entretien / remplacement</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK SERVICE MODAL */}
      {quickServiceModalOpen && targetComponent && selectedBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <span>Entretien de : {targetComponent.displayName}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sur le vélo {selectedBike.name}. Cette opération réinitialisera le calcul des kilomètres effectués depuis le dernier entretien.
            </p>

            <form onSubmit={handleSaveQuickService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date de l'opération *
                </label>
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type d'opération
                </label>
                <select
                  value={serviceOp}
                  onChange={(e) => setServiceOp(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="Remplacement à neuf">Remplacement à neuf (remise à zéro de l'usure)</option>
                  <option value="Nettoyage / Dégraissage">Nettoyage / Dégraissage</option>
                  <option value="Réglage / Serrage">Réglage / Serrage</option>
                  <option value="Lubrification">Lubrification</option>
                  <option value="Purge hydraulique">Purge hydraulique</option>
                  <option value="Contrôle usure">Contrôle usure</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coût associé (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarques / Référence
                </label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuickServiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  Enregistrer l'intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
