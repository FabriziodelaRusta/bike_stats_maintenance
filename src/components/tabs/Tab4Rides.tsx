import React, { useState, useMemo } from 'react';
import { Ride, Bike, AppDataPayload, RideTypeItem } from '../../types';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  Search, 
  TrendingUp, 
  Clock, 
  Zap, 
  Tag, 
  Compass, 
  X 
} from 'lucide-react';

interface Tab4RidesProps {
  data: AppDataPayload;
  onUpdateRides: (rides: Ride[]) => void;
  onUpdateRideTypes: (types: RideTypeItem[]) => void;
}

export const Tab4Rides: React.FC<Tab4RidesProps> = ({
  data,
  onUpdateRides,
  onUpdateRideTypes,
}) => {
  const [rideModalOpen, setRideModalOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);

  // New Type Creation Modal
  const [newTypeModalOpen, setNewTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#2563eb');

  // Filters
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterBike, setFilterBike] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [form, setForm] = useState<Partial<Ride>>({
    date: new Date().toISOString().split('T')[0],
    bikeId: data.bikes[0]?.id || '',
    rideTypeId: data.rideTypes[0]?.id || '',
    commentForType: '',
    distanceKm: 0,
    elevationGainM: 0,
    durationMinutes: 0,
    notes: '',
  });

  // Extract years from rides
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.rides.forEach((r) => {
      if (r.date) years.add(r.date.split('-')[0]);
    });
    return Array.from(years).sort().reverse();
  }, [data.rides]);

  // Filtered rides
  const filteredRides = useMemo(() => {
    return data.rides
      .filter((r) => {
        if (filterYear !== 'all' && !r.date.startsWith(filterYear)) return false;
        if (filterBike !== 'all' && r.bikeId !== filterBike) return false;
        if (filterType !== 'all' && r.rideTypeId !== filterType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchComment = (r.commentForType || '').toLowerCase().includes(q);
          const matchNotes = (r.notes || '').toLowerCase().includes(q);
          if (!matchComment && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.rides, filterYear, filterBike, filterType, searchQuery]);

  // Calculations on filtered rides
  const filteredKm = useMemo(
    () => filteredRides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0),
    [filteredRides]
  );
  const filteredDplus = useMemo(
    () => filteredRides.reduce((s, r) => s + (Number(r.elevationGainM) || 0), 0),
    [filteredRides]
  );

  const openRideModal = (ride?: Ride) => {
    if (ride) {
      setEditingRide(ride);
      setForm({ ...ride });
    } else {
      setEditingRide(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        bikeId: filterBike !== 'all' ? filterBike : data.bikes[0]?.id || '',
        rideTypeId: filterType !== 'all' ? filterType : data.rideTypes[0]?.id || '',
        commentForType: '',
        distanceKm: 0,
        elevationGainM: 0,
        durationMinutes: 0,
        notes: '',
      });
    }
    setRideModalOpen(true);
  };

  const handleSaveRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bikeId || !form.rideTypeId || !form.distanceKm) return;

    if (editingRide) {
      const updated = data.rides.map((r) =>
        r.id === editingRide.id
          ? ({
              ...r,
              ...form,
              distanceKm: Number(form.distanceKm) || 0,
              elevationGainM: Number(form.elevationGainM) || 0,
              durationMinutes: Number(form.durationMinutes) || 0,
            } as Ride)
          : r
      );
      onUpdateRides(updated);
    } else {
      const newRide: Ride = {
        id: `ride-${Date.now()}`,
        date: form.date || new Date().toISOString().split('T')[0],
        bikeId: form.bikeId,
        rideTypeId: form.rideTypeId,
        commentForType: form.commentForType || '',
        distanceKm: Number(form.distanceKm) || 0,
        elevationGainM: Number(form.elevationGainM) || 0,
        durationMinutes: Number(form.durationMinutes) || 0,
        notes: form.notes,
      };
      onUpdateRides([newRide, ...data.rides]);
    }
    setRideModalOpen(false);
  };

  const handleDeleteRide = (id: string) => {
    if (window.confirm('Supprimer cette sortie vélo ?')) {
      onUpdateRides(data.rides.filter((r) => r.id !== id));
    }
  };

  const handleAddNewType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: RideTypeItem = {
      id: `rtype-custom-${Date.now()}`,
      name: newTypeName.trim(),
      color: newTypeColor || '#3b82f6',
      isCustom: true,
    };

    onUpdateRideTypes([...data.rideTypes, newType]);
    setForm((prev) => ({ ...prev, rideTypeId: newType.id }));
    setNewTypeName('');
    setNewTypeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>Liste des Randos & Sorties Effectuées</span>
          </h2>
          <p className="text-xs text-slate-500">
            Enregistrement des sorties, distances kilométriques, types de randos et commentaires spécifiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewTypeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Gérer / Ajouter un Type</span>
          </button>

          <button
            onClick={() => openRideModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Encoder une rando</span>
          </button>
        </div>
      </div>

      {/* KPI Totals on Filtered Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Randos Sélectionnées
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {filteredRides.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            sur {data.rides.length} enregistrées
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Distance Totale
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {Math.round(filteredKm).toLocaleString('fr-FR')} <span className="text-sm font-bold">km</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Moyenne: {filteredRides.length > 0 ? (filteredKm / filteredRides.length).toFixed(1) : 0} km/sortie
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dénivelé Positif (D+)
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {Math.round(filteredDplus).toLocaleString('fr-FR')} <span className="text-sm font-bold">m</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            D+ cumulé sur la sélection
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Vélo Actif
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
            {filterBike === 'all'
              ? 'Tous les vélos'
              : data.bikes.find((b) => b.id === filterBike)?.name || 'Vélo'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {filterType === 'all'
              ? 'Tous types confondus'
              : data.rideTypes.find((t) => t.id === filterType)?.name}
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtrer les sorties :</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Par Vélo</label>
            <select
              value={filterBike}
              onChange={(e) => setFilterBike(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Tous les vélos</option>
              {data.bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.brand}) {b.isElectric ? '⚡ AE' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type de Rando</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Tous les types de randos</option>
              {data.rideTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Gorizia, Ventoux, col..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Rides Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        {filteredRides.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Aucune rando trouvée avec ces filtres.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vélo & AE</th>
                  <th className="py-3 px-4">Type de Rando</th>
                  <th className="py-3 px-4">Commentaire pour le type</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">D+ (m)</th>
                  <th className="py-3 px-4">Durée</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredRides.map((ride) => {
                  const bike = data.bikes.find((b) => b.id === ride.bikeId);
                  const rType = data.rideTypes.find((t) => t.id === ride.rideTypeId);

                  return (
                    <tr key={ride.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {ride.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: bike?.color || '#10b981' }}
                          />
                          <span>{bike?.name || 'Vélo'}</span>
                          {bike?.isElectric ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                              <Zap className="w-2.5 h-2.5 fill-amber-500" />
                              AE
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-2xs"
                          style={{ backgroundColor: rType?.color || '#3b82f6' }}
                        >
                          {rType?.name || 'Autre'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {ride.commentForType ? (
                          <span className="text-emerald-700 dark:text-emerald-300">
                            {ride.commentForType}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">—</span>
                        )}
                        {ride.notes && (
                          <span className="block text-[11px] font-normal text-slate-500 italic mt-0.5 truncate max-w-xs">
                            "{ride.notes}"
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {ride.distanceKm.toFixed(1)} km
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {ride.elevationGainM ? `${ride.elevationGainM} m` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ride.durationMinutes
                          ? `${Math.floor(ride.durationMinutes / 60)}h${String(ride.durationMinutes % 60).padStart(2, '0')}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openRideModal(ride)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRide(ride.id)}
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
                    Total Sélection ({filteredRides.length} randos)
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 text-base">
                    {filteredKm.toFixed(1)} km
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400">
                    {Math.round(filteredDplus)} m
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: AJOUTER / MODIFIER UNE RANDO */}
      {rideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>{editingRide ? 'Modifier la rando' : 'Encoder une nouvelle rando'}</span>
            </h3>

            <form onSubmit={handleSaveRide} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de la rando *
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
                    Vélo utilisé *
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

              {/* Type de rando */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Type de rando *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewTypeModalOpen(true)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Créer un autre type</span>
                  </button>
                </div>
                <select
                  required
                  value={form.rideTypeId || ''}
                  onChange={(e) => setForm({ ...form, rideTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {data.rideTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specific Comment for Type (requested explicitly by user) */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                  Commentaire pour le type (ex: Voyage → "Vienne - Gorizia", Diagonale → "Brest - Strasbourg")
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vienne - Gorizia, Étape 3, Rando des Collines..."
                  value={form.commentForType || ''}
                  onChange={(e) => setForm({ ...form, commentForType: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Distance and metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="95.5"
                    value={form.distanceKm || ''}
                    onChange={(e) => setForm({ ...form, distanceKm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dénivelé D+ (m)
                  </label>
                  <input
                    type="number"
                    step="10"
                    placeholder="1200"
                    value={form.elevationGainM || ''}
                    onChange={(e) => setForm({ ...form, elevationGainM: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Durée (min)
                  </label>
                  <input
                    type="number"
                    step="5"
                    placeholder="210"
                    value={form.durationMinutes || ''}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Récit de la sortie
                </label>
                <textarea
                  rows={2}
                  placeholder="Météo, sensations, parcours, incidents..."
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRideModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  {editingRide ? 'Sauvegarder' : 'Enregistrer la sortie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJOUTER UN TYPE DE RANDO */}
      {newTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <span>Nouveau Type de Randonnée</span>
            </h3>

            <form onSubmit={handleAddNewType} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom du type de rando *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brevet 200k, Gravel Bikepacking, Nocturne..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Couleur du badge
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTypeColor}
                    onChange={(e) => setNewTypeColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: newTypeColor }}
                  >
                    Aperçu : {newTypeName || 'Nouveau type'}
                  </div>
                </div>
              </div>

              {/* Existing Types List */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 block mb-2">
                  Types actuellement disponibles :
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {data.rideTypes.map((t) => (
                    <span
                      key={t.id}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setNewTypeModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  Ajouter le type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
