import React, { useState, useMemo } from 'react';
import { Expense, Bike, AppDataPayload, ExpenseCategory } from '../../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Download, 
  Search, 
  TrendingUp, 
  Tag, 
  Receipt 
} from 'lucide-react';

interface Tab2ExpensesProps {
  data: AppDataPayload;
  onUpdateExpenses: (expenses: Expense[]) => void;
}

export const Tab2Expenses: React.FC<Tab2ExpensesProps> = ({ data, onUpdateExpenses }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filters
  const [filterBike, setFilterBike] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [form, setForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    bikeId: data.bikes[0]?.id || '',
    pieceName: '',
    price: 0,
    category: 'Composant',
    provider: '',
    invoiceRef: '',
    notes: '',
  });

  // Extract years from expenses
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.expenses.forEach((e) => {
      if (e.date) years.add(e.date.split('-')[0]);
    });
    return Array.from(years).sort().reverse();
  }, [data.expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return data.expenses
      .filter((e) => {
        if (filterBike !== 'all' && e.bikeId !== filterBike) return false;
        if (filterCategory !== 'all' && e.category !== filterCategory) return false;
        if (filterYear !== 'all' && !e.date.startsWith(filterYear)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPiece = e.pieceName.toLowerCase().includes(q);
          const matchProvider = (e.provider || '').toLowerCase().includes(q);
          const matchNotes = (e.notes || '').toLowerCase().includes(q);
          if (!matchPiece && !matchProvider && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.expenses, filterBike, filterCategory, filterYear, searchQuery]);

  // Totals calculations
  const totalFilteredCost = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  }, [filteredExpenses]);

  // Total km for the selected bike / filter
  const relevantKm = useMemo(() => {
    const rides = data.rides.filter((r) => {
      if (filterBike !== 'all' && r.bikeId !== filterBike) return false;
      if (filterYear !== 'all' && !r.date.startsWith(filterYear)) return false;
      return true;
    });
    return rides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);
  }, [data.rides, filterBike, filterYear]);

  const costPerKm = useMemo(() => {
    if (relevantKm <= 0) return 0;
    return totalFilteredCost / relevantKm;
  }, [totalFilteredCost, relevantKm]);

  // Open Add / Edit Modal
  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setForm({ ...expense });
    } else {
      setEditingExpense(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        bikeId: filterBike !== 'all' ? filterBike : data.bikes[0]?.id || '',
        pieceName: '',
        price: 0,
        category: 'Composant',
        provider: '',
        invoiceRef: '',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pieceName || form.price === undefined || !form.bikeId) return;

    if (editingExpense) {
      const updated = data.expenses.map((exp) =>
        exp.id === editingExpense.id ? ({ ...exp, ...form, price: Number(form.price) } as Expense) : exp
      );
      onUpdateExpenses(updated);
    } else {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        date: form.date || new Date().toISOString().split('T')[0],
        bikeId: form.bikeId,
        pieceName: form.pieceName,
        price: Number(form.price),
        category: (form.category as ExpenseCategory) || 'Composant',
        provider: form.provider,
        invoiceRef: form.invoiceRef,
        notes: form.notes,
      };
      onUpdateExpenses([newExp, ...data.expenses]);
    }
    setModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Supprimer cette dépense ?')) {
      onUpdateExpenses(data.expenses.filter((e) => e.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Vélo', 'Marque', 'Pièce / Article', 'Prix (€)', 'Catégorie', 'Fournisseur', 'Facture', 'Notes'];
    const rows = filteredExpenses.map((e) => {
      const bike = data.bikes.find((b) => b.id === e.bikeId);
      return [
        e.date,
        `"${bike?.name || 'Inconnu'}"`,
        `"${bike?.brand || ''}"`,
        `"${e.pieceName.replace(/"/g, '""')}"`,
        e.price.toFixed(2),
        `"${e.category}"`,
        `"${(e.provider || '').replace(/"/g, '""')}"`,
        `"${(e.invoiceRef || '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `depenses_velos_${filterYear !== 'all' ? filterYear : 'toutes'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top action & Totals Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Historique des Dépenses par Vélo</span>
          </h2>
          <p className="text-xs text-slate-500">
            Encodage des achats de pièces, consommables et révisions avec calcul automatique du coût kilométrique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            title="Exporter la liste filtrée au format CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Encoder une dépense</span>
          </button>
        </div>
      </div>

      {/* KPI Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Dépenses Filtrées
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalFilteredCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {filteredExpenses.length} ligne(s) d'achat
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Coût Kilométrique Réel
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {(costPerKm * 100).toFixed(2)} <span className="text-sm font-semibold">ct€ / km</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            soit {costPerKm.toFixed(3)} € / km sur {Math.round(relevantKm).toLocaleString('fr-FR')} km
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dépense Moyenne / Article
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {filteredExpenses.length > 0
              ? (totalFilteredCost / filteredExpenses.length).toFixed(2)
              : '0.00'}{' '}
            €
          </div>
          <div className="text-xs text-slate-500 mt-1">Par composant / entretien</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Vélo Sélectionné
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
            {filterBike === 'all'
              ? 'Tous les vélos'
              : data.bikes.find((b) => b.id === filterBike)?.name || 'Vélo'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {filterYear === 'all' ? 'Toutes les années' : `Année ${filterYear}`}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtres de recherche et totaux par critère :</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Bike filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Par Vélo</label>
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

          {/* Category filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Composant">Composant</option>
              <option value="Entretien / Atelier">Entretien / Atelier</option>
              <option value="Consommable">Consommable</option>
              <option value="Accessoire">Accessoire</option>
              <option value="Outillage">Outillage</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Year filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Année</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Toutes les années</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Search keyword */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Recherche mot-clé</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Chaîne, pneu, Shimano..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Aucune dépense ne correspond aux critères de filtre sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vélo</th>
                  <th className="py-3 px-4">Pièce / Article</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Prix</th>
                  <th className="py-3 px-4">Fournisseur / Réf</th>
                  <th className="py-3 px-4">Commentaires</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredExpenses.map((exp) => {
                  const bike = data.bikes.find((b) => b.id === exp.bikeId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: bike?.color || '#10b981' }}
                          />
                          <span>{bike?.name || 'Vélo supprimé'}</span>
                          {bike?.isElectric && (
                            <span className="text-[10px] text-amber-600 font-bold ml-0.5">⚡ AE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {exp.pieceName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {exp.price.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {exp.provider || '—'}
                        {exp.invoiceRef && (
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {exp.invoiceRef}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {exp.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openModal(exp)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
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
              <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-slate-800 dark:text-slate-200 uppercase text-xs">
                    Total dépenses filtrées ({filteredExpenses.length} lignes)
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 text-base">
                    {totalFilteredCost.toFixed(2)} €
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-xs text-slate-500 font-normal">
                    Moyenne: {(totalFilteredCost / (filteredExpenses.length || 1)).toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: AJOUTER / MODIFIER UNE DÉPENSE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>{editingExpense ? 'Modifier la dépense' : 'Encoder une dépense vélo'}</span>
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
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
                    Vélo concerné *
                  </label>
                  <select
                    required
                    value={form.bikeId || ''}
                    onChange={(e) => setForm({ ...form, bikeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    {data.bikes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.brand}) {b.isElectric ? '⚡ AE' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pièce / Article / Libellé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chaîne Shimano Ultegra 12v, Pneus GP5000, Plaquettes..."
                  value={form.pieceName || ''}
                  onChange={(e) => setForm({ ...form, pieceName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prix TTC (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="0.00"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={form.category || 'Composant'}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Composant">Composant</option>
                    <option value="Entretien / Atelier">Entretien / Atelier</option>
                    <option value="Consommable">Consommable</option>
                    <option value="Accessoire">Accessoire</option>
                    <option value="Outillage">Outillage</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fournisseur / Magasin
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Alltricks, Vélo Station..."
                    value={form.provider || ''}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° Facture / Ticket (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: INV-2026-44"
                    value={form.invoiceRef || ''}
                    onChange={(e) => setForm({ ...form, invoiceRef: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Commentaires / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Remarques particulières..."
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
                  {editingExpense ? 'Sauvegarder' : 'Enregistrer la dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
