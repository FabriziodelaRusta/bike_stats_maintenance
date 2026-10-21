import React, { useState, useMemo } from 'react';
import { MaintenanceLog, Bike, AppDataPayload, MaintenanceOperationType } from '../../types';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface Tab3MaintenanceProps {
  data: AppDataPayload;
  onUpdateMaintenanceLogs: (logs: MaintenanceLog[]) => void;
}

export const Tab3Maintenance: React.FC<Tab3MaintenanceProps> = ({
  data,
  onUpdateMaintenanceLogs,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);

  // Filters
  const [filterBike, setFilterBike] = useState<string>('all');
  const [filterOpType, setFilterOpType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [form, setForm] = useState<Partial<MaintenanceLog>>({
    date: new Date().toISOString().split('T')[0],
    bikeId: data.bikes[0]?.id || '',
    componentName: data.componentCategories[0]?.name || 'Chaîne',
    operationType: 'Remplacement à neuf',
    kmAtService: 0,
    performedBy: 'Soi-même',
    cost: 0,
    notes: '',
  });

  const filteredLogs = useMemo(() => {
    return data.maintenanceLogs
      .filter((log) => {
        if (filterBike !== 'all' && log.bikeId !== filterBike) return false;
        if (filterOpType !== 'all' && log.operationType !== filterOpType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchComp = log.componentName.toLowerCase().includes(q);
          const matchNotes = (log.notes || '').toLowerCase().includes(q);
          const matchBy = (log.performedBy || '').toLowerCase().includes(q);
          if (!matchComp && !matchNotes && !matchBy) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.maintenanceLogs, filterBike, filterOpType, searchQuery]);

  const openModal = (log?: MaintenanceLog) => {
    if (log) {
      setEditingLog(log);
      setForm({ ...log });
    } else {
      setEditingLog(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        bikeId: filterBike !== 'all' ? filterBike : data.bikes[0]?.id || '',
        componentName: data.componentCategories[0]?.name || 'Chaîne',
        operationType: 'Remplacement à neuf',
        kmAtService: 0,
        performedBy: 'Soi-même',
        cost: 0,
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bikeId || !form.componentName) return;

    if (editingLog) {
      const updated = data.maintenanceLogs.map((l) =>
        l.id === editingLog.id
          ? ({
              ...l,
              ...form,
              kmAtService: Number(form.kmAtService) || 0,
              cost: Number(form.cost) || 0,
            } as MaintenanceLog)
          : l
      );
      onUpdateMaintenanceLogs(updated);
    } else {
      const newLog: MaintenanceLog = {
        id: `maint-${Date.now()}`,
        date: form.date || new Date().toISOString().split('T')[0],
        bikeId: form.bikeId,
        componentName: form.componentName,
        operationType: (form.operationType as MaintenanceOperationType) || 'Remplacement à neuf',
        kmAtService: Number(form.kmAtService) || 0,
        performedBy: form.performedBy || 'Soi-même',
        cost: Number(form.cost) || 0,
        notes: form.notes,
      };
      onUpdateMaintenanceLogs([newLog, ...data.maintenanceLogs]);
    }
    setModalOpen(false);
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm('Supprimer cette entrée de maintenance ?')) {
      onUpdateMaintenanceLogs(data.maintenanceLogs.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <span>Historique des Opérations de Maintenance</span>
          </h2>
          <p className="text-xs text-slate-500">
            Journal de bord des révisions, remplacements de pièces et réglages effectués sur chaque vélo.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une opération</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtrer les interventions :</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Vélo</label>
            <select
              value={filterBike}
              onChange={(e) => setFilterBike(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Tous les vélos ({data.bikes.length})</option>
              {data.bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.brand})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type d'opération</label>
            <select
              value={filterOpType}
              onChange={(e) => setFilterOpType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Toutes les opérations</option>
              <option value="Remplacement à neuf">Remplacement à neuf</option>
              <option value="Nettoyage / Dégraissage">Nettoyage / Dégraissage</option>
              <option value="Réglage / Serrage">Réglage / Serrage</option>
              <option value="Lubrification">Lubrification</option>
              <option value="Purge hydraulique">Purge hydraulique</option>
              <option value="Contrôle usure">Contrôle usure</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Chaîne, purge, atelier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Aucune opération de maintenance enregistrée pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vélo</th>
                  <th className="py-3 px-4">Composant changé / entretenu</th>
                  <th className="py-3 px-4">Opération</th>
                  <th className="py-3 px-4">Km compteur</th>
                  <th className="py-3 px-4">Réalisé par</th>
                  <th className="py-3 px-4">Observations / Détails</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredLogs.map((log) => {
                  const bike = data.bikes.find((b) => b.id === log.bikeId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: bike?.color || '#10b981' }}
                          />
                          <span>{bike?.name || 'Vélo'}</span>
                          {bike?.isElectric && (
                            <span className="text-[10px] text-amber-600 font-bold ml-0.5">⚡ AE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {log.componentName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            log.operationType === 'Remplacement à neuf'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                              : log.operationType === 'Purge hydraulique'
                              ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {log.operationType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {log.kmAtService ? `${log.kmAtService.toLocaleString('fr-FR')} km` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.performedBy}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-sm truncate">
                        {log.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openModal(log)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: AJOUTER / MODIFIER MAINTENANCE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <span>{editingLog ? 'Modifier l\'entretien' : 'Enregistrer une opération de maintenance'}</span>
            </h3>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de l'opération *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date || ''}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vélo *
                  </label>
                  <select
                    required
                    value={form.bikeId || ''}
                    onChange={(e) => setForm({ ...form, bikeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    {data.bikes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.brand})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Composant changé / entretenu *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    list="components-list"
                    placeholder="Ex: Chaîne, Cassette, Plaquettes avant..."
                    value={form.componentName || ''}
                    onChange={(e) => setForm({ ...form, componentName: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                  <datalist id="components-list">
                    {data.componentCategories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nature de l'intervention
                  </label>
                  <select
                    value={form.operationType || 'Remplacement à neuf'}
                    onChange={(e) => setForm({ ...form, operationType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Remplacement à neuf">Remplacement à neuf</option>
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
                    Km au compteur lors du service
                  </label>
                  <input
                    type="number"
                    value={form.kmAtService || ''}
                    onChange={(e) => setForm({ ...form, kmAtService: Number(e.target.value) || 0 })}
                    placeholder="Ex: 2400"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intervenant
                  </label>
                  <select
                    value={form.performedBy || 'Soi-même'}
                    onChange={(e) => setForm({ ...form, performedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Soi-même">Soi-même</option>
                    <option value="Atelier vélociste">Atelier vélociste</option>
                    <option value="Ami / Club">Ami / Club</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Coût estimé (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cost || ''}
                    onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observations / Références
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, couple de serrage, marque du maillon rapide..."
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  {editingLog ? 'Sauvegarder' : 'Enregistrer la maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
