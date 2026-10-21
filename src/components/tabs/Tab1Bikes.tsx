import React, { useState } from 'react';
import { Bike, BikeComponentLink, ComponentCategory, AppDataPayload, BikeType } from '../../types';
import { 
  Bike as BikeIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Zap, 
  Layers, 
  Link as LinkIcon, 
  CheckCircle, 
  Info,
  Calendar,
  Activity,
  Sliders
} from 'lucide-react';
import { computeBikeStats } from '../../services/calculations';

interface Tab1BikesProps {
  data: AppDataPayload;
  onUpdateBikes: (bikes: Bike[]) => void;
  onUpdateCategories: (categories: ComponentCategory[]) => void;
  onUpdateLinks: (links: BikeComponentLink[]) => void;
}

export const Tab1Bikes: React.FC<Tab1BikesProps> = ({
  data,
  onUpdateBikes,
  onUpdateCategories,
  onUpdateLinks,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'velos' | 'composants' | 'composition'>('velos');

  // Modals state
  const [bikeModalOpen, setBikeModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ComponentCategory | null>(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<BikeComponentLink | null>(null);
  const [selectedBikeForComposition, setSelectedBikeForComposition] = useState<string>(
    data.bikes[0]?.id || ''
  );

  // Bike Form state
  const [bikeForm, setBikeForm] = useState<Partial<Bike>>({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    frameNumber: '',
    type: 'Route',
    isElectric: false,
    color: '#059669',
    status: 'actif',
    notes: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  // Category Form state
  const [catForm, setCatForm] = useState<Partial<ComponentCategory>>({
    name: '',
    category: 'Transmission',
    defaultLifespanKm: 5000,
    description: '',
  });

  // Link Form state
  const [linkForm, setLinkForm] = useState<Partial<BikeComponentLink>>({
    bikeId: selectedBikeForComposition || data.bikes[0]?.id || '',
    componentCategoryId: data.componentCategories[0]?.id || '',
    customName: '',
    installedDate: new Date().toISOString().split('T')[0],
    installedAtKm: 0,
    lifespanKmTarget: 5000,
    notes: '',
  });

  // Open Bike Modal
  const openBikeModal = (bike?: Bike) => {
    if (bike) {
      setEditingBike(bike);
      setBikeForm({ ...bike });
    } else {
      setEditingBike(null);
      setBikeForm({
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        frameNumber: '',
        type: 'Route',
        isElectric: false,
        color: '#059669',
        status: 'actif',
        notes: '',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
    }
    setBikeModalOpen(true);
  };

  const handleSaveBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bikeForm.name || !bikeForm.brand) return;

    if (editingBike) {
      const updated = data.bikes.map((b) =>
        b.id === editingBike.id ? ({ ...b, ...bikeForm } as Bike) : b
      );
      onUpdateBikes(updated);
    } else {
      const newBike: Bike = {
        id: `bike-${Date.now()}`,
        name: bikeForm.name || 'Nouveau Vélo',
        brand: bikeForm.brand || 'Générique',
        model: bikeForm.model || '',
        year: bikeForm.year,
        frameNumber: bikeForm.frameNumber,
        type: bikeForm.type as BikeType,
        isElectric: !!bikeForm.isElectric,
        color: bikeForm.color || '#3b82f6',
        status: bikeForm.status || 'actif',
        notes: bikeForm.notes,
        purchaseDate: bikeForm.purchaseDate,
      };
      onUpdateBikes([...data.bikes, newBike]);
      if (!selectedBikeForComposition) {
        setSelectedBikeForComposition(newBike.id);
      }
    }
    setBikeModalOpen(false);
  };

  const handleDeleteBike = (bikeId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce vélo ? (Les composants liés seront conservés)')) {
      onUpdateBikes(data.bikes.filter((b) => b.id !== bikeId));
      if (selectedBikeForComposition === bikeId) {
        const remaining = data.bikes.filter((b) => b.id !== bikeId);
        setSelectedBikeForComposition(remaining[0]?.id || '');
      }
    }
  };

  // Category Actions
  const openCategoryModal = (cat?: ComponentCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({ ...cat });
    } else {
      setEditingCategory(null);
      setCatForm({
        name: '',
        category: 'Transmission',
        defaultLifespanKm: 5000,
        description: '',
      });
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;

    if (editingCategory) {
      const updated = data.componentCategories.map((c) =>
        c.id === editingCategory.id ? ({ ...c, ...catForm } as ComponentCategory) : c
      );
      onUpdateCategories(updated);
    } else {
      const newCat: ComponentCategory = {
        id: `cat-${Date.now()}`,
        name: catForm.name || '',
        category: catForm.category as any,
        defaultLifespanKm: Number(catForm.defaultLifespanKm) || 5000,
        description: catForm.description,
      };
      onUpdateCategories([...data.componentCategories, newCat]);
    }
    setCategoryModalOpen(false);
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm('Supprimer ce composant du catalogue ?')) {
      onUpdateCategories(data.componentCategories.filter((c) => c.id !== catId));
    }
  };

  // Composition Link Actions
  const openLinkModal = (link?: BikeComponentLink) => {
    if (link) {
      setEditingLink(link);
      setLinkForm({ ...link });
    } else {
      setEditingLink(null);
      setLinkForm({
        bikeId: selectedBikeForComposition || data.bikes[0]?.id || '',
        componentCategoryId: data.componentCategories[0]?.id || '',
        customName: '',
        installedDate: new Date().toISOString().split('T')[0],
        installedAtKm: 0,
        lifespanKmTarget: 5000,
        notes: '',
      });
    }
    setLinkModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.bikeId || !linkForm.componentCategoryId) return;

    if (editingLink) {
      const updated = data.bikeComponentLinks.map((l) =>
        l.id === editingLink.id ? ({ ...l, ...linkForm } as BikeComponentLink) : l
      );
      onUpdateLinks(updated);
    } else {
      const newLink: BikeComponentLink = {
        id: `bcomp-${Date.now()}`,
        bikeId: linkForm.bikeId,
        componentCategoryId: linkForm.componentCategoryId,
        customName: linkForm.customName,
        installedDate: linkForm.installedDate || new Date().toISOString().split('T')[0],
        installedAtKm: Number(linkForm.installedAtKm) || 0,
        lifespanKmTarget: Number(linkForm.lifespanKmTarget) || 5000,
        notes: linkForm.notes,
      };
      onUpdateLinks([...data.bikeComponentLinks, newLink]);
    }
    setLinkModalOpen(false);
  };

  const handleDeleteLink = (linkId: string) => {
    if (window.confirm('Détacher ce composant de ce vélo ?')) {
      onUpdateLinks(data.bikeComponentLinks.filter((l) => l.id !== linkId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('velos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'velos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <BikeIcon className="w-4 h-4" />
            <span>Vélos ({data.bikes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('composants')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'composants'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Catalogue Composants ({data.componentCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('composition')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'composition'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Composition du Vélo</span>
          </button>
        </div>

        {/* Action Button for Active Subtab */}
        {activeSubTab === 'velos' && (
          <button
            onClick={() => openBikeModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un vélo</span>
          </button>
        )}

        {activeSubTab === 'composants' && (
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau type de composant</span>
          </button>
        )}

        {activeSubTab === 'composition' && (
          <button
            onClick={() => openLinkModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Associer un composant</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1.1: VÉLOS */}
      {activeSubTab === 'velos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.bikes.map((bike) => {
              const stats = computeBikeStats(bike.id, data.rides);
              const linkedComponents = data.bikeComponentLinks.filter((l) => l.bikeId === bike.id);

              return (
                <div
                  key={bike.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Color bar indicator */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: bike.color || '#059669' }}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {bike.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {bike.brand} {bike.model} {bike.year ? `(${bike.year})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {bike.isElectric ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            AE (Électrique)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Musculaire
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge details */}
                    <div className="flex flex-wrap gap-1.5 my-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                        Type: {bike.type}
                      </span>
                      {bike.frameNumber && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                          N° {bike.frameNumber}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          bike.status === 'actif'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : bike.status === 'maintenance'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {bike.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Bike Stats Mini Cards */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-700/60 my-3 text-center">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {stats.totalKm.toLocaleString('fr-FR')} km
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">Distance</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {stats.totalRides}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">Randos</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {linkedComponents.length}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">Composants</div>
                      </div>
                    </div>

                    {bike.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic mb-3">
                        "{bike.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setSelectedBikeForComposition(bike.id);
                        setActiveSubTab('composition');
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Voir composition
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openBikeModal(bike)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBike(bike.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 1.2: COMPOSANTS (CATALOGUE) */}
      {activeSubTab === 'composants' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Catalogue des composants et durées de vie recommandées</p>
              <p className="mt-0.5">
                Définissez ici tous les types de composants dont vous souhaitez surveiller l'usure et maintenir l'historique d'entretien (ex : Chaîne, Cassette, Roulements roues, Roulement de pédalier, Guidoline, Plaquettes, Disques...). Vous pouvez en ajouter de nouveaux ou ajuster la périodicité kilométrique.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Nom du composant</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Durée de vie conseillée</th>
                    <th className="py-3 px-4">Description / Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {data.componentCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {cat.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {cat.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {cat.defaultLifespanKm.toLocaleString('fr-FR')} km
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {cat.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCategoryModal(cat)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1.3: COMPOSITION DU VÉLO */}
      {activeSubTab === 'composition' && (
        <div className="space-y-4">
          {/* Bike Picker */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="bike-select" className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Choisir le vélo à équiper :
              </label>
              <select
                id="bike-select"
                value={selectedBikeForComposition}
                onChange={(e) => setSelectedBikeForComposition(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {data.bikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.brand}) {b.isElectric ? '⚡ AE' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setLinkForm({
                  bikeId: selectedBikeForComposition,
                  componentCategoryId: data.componentCategories[0]?.id || '',
                  customName: '',
                  installedDate: new Date().toISOString().split('T')[0],
                  installedAtKm: 0,
                  lifespanKmTarget: 5000,
                  notes: '',
                });
                setEditingLink(null);
                setLinkModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Associer un composant à ce vélo</span>
            </button>
          </div>

          {/* List of components linked to this bike */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Composants montés sur{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {data.bikes.find((b) => b.id === selectedBikeForComposition)?.name || 'le vélo'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Ces composants alimenteront le suivi d'usure en temps réel dans l'onglet État de maintenance.
                </p>
              </div>
            </div>

            {data.bikeComponentLinks.filter((l) => l.bikeId === selectedBikeForComposition).length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Aucun composant associé à ce vélo pour l'instant. Cliquez sur "Associer un composant" pour lier la chaîne, la cassette, les plaquettes, etc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Composant / Modèle installé</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Date de pose</th>
                      <th className="py-3 px-4">Km au montage</th>
                      <th className="py-3 px-4">Objectif durée de vie</th>
                      <th className="py-3 px-4">Remarques</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {data.bikeComponentLinks
                      .filter((l) => l.bikeId === selectedBikeForComposition)
                      .map((link) => {
                        const cat = data.componentCategories.find((c) => c.id === link.componentCategoryId);
                        return (
                          <tr key={link.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {link.customName || cat?.name || 'Composant'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {cat?.name || 'Composant'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {link.installedDate}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {link.installedAtKm || 0} km
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              {(link.lifespanKmTarget || cat?.defaultLifespanKm || 5000).toLocaleString('fr-FR')} km
                            </td>
                            <td className="py-3 px-4 text-slate-500 italic">
                              {link.notes || '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openLinkModal(link)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                  title="Détacher"
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
        </div>
      )}

      {/* MODAL: AJOUT / MODIF VÉLO */}
      {bikeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BikeIcon className="w-5 h-5 text-emerald-600" />
              <span>{editingBike ? 'Modifier le vélo' : 'Ajouter un nouveau vélo'}</span>
            </h3>

            <form onSubmit={handleSaveBike} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom du vélo *
                  </label>
                  <input
                    type="text"
                    required
                    value={bikeForm.name || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                    placeholder="Ex: Mon Colnago C68"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marque *
                  </label>
                  <input
                    type="text"
                    required
                    value={bikeForm.brand || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                    placeholder="Ex: Colnago, Trek, Canyon..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Modèle
                  </label>
                  <input
                    type="text"
                    value={bikeForm.model || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                    placeholder="Ex: C68 Road Disc"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={bikeForm.year || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, year: Number(e.target.value) || undefined })}
                    placeholder="Ex: 2024"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type de vélo
                  </label>
                  <select
                    value={bikeForm.type || 'Route'}
                    onChange={(e) => setBikeForm({ ...bikeForm, type: e.target.value as BikeType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Route">Route</option>
                    <option value="Gravel">Gravel</option>
                    <option value="VTT">VTT</option>
                    <option value="Voyage / Rando">Voyage / Rando</option>
                    <option value="Ville / Urbain">Ville / Urbain</option>
                    <option value="Cyclotourisme">Cyclotourisme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={bikeForm.status || 'actif'}
                    onChange={(e) => setBikeForm({ ...bikeForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="actif">Actif (en usage)</option>
                    <option value="maintenance">En révision / maintenance</option>
                    <option value="archive">Archivé / Vendu</option>
                  </select>
                </div>
              </div>

              {/* Assistance Électrique (AE) Toggle */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bikeForm.isElectric || false}
                    onChange={(e) => setBikeForm({ ...bikeForm, isElectric: e.target.checked })}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 border-amber-300"
                  />
                  <div>
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>AE - Assistance Électrique</span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300/80">
                      Cochez si ce vélo dispose d'un moteur et d'une batterie électrique (suivi distinct dans les statistiques).
                    </p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° de cadre / série
                  </label>
                  <input
                    type="text"
                    value={bikeForm.frameNumber || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, frameNumber: e.target.value })}
                    placeholder="Ex: COL-68-9921"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Couleur de repère
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bikeForm.color || '#059669'}
                      onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={bikeForm.color || '#059669'}
                      onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Équipements
                </label>
                <textarea
                  rows={2}
                  value={bikeForm.notes || ''}
                  onChange={(e) => setBikeForm({ ...bikeForm, notes: e.target.value })}
                  placeholder="Ex: Groupe Ultegra Di2, roues carbone, sacoches..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setBikeModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingBike ? 'Sauvegarder les modifications' : 'Créer le vélo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJOUT / MODIF COMPOSANT CATALOGUE */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>{editingCategory ? 'Modifier le composant' : 'Nouveau type de composant'}</span>
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom du composant *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name || ''}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Ex: Cassette, Chaîne, Roulements roues..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie technique
                </label>
                <select
                  value={catForm.category || 'Transmission'}
                  onChange={(e) => setCatForm({ ...catForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="Transmission">Transmission</option>
                  <option value="Roulement">Roulement</option>
                  <option value="Freinage">Freinage</option>
                  <option value="Poste de pilotage">Poste de pilotage</option>
                  <option value="Roues & Pneus">Roues & Pneus</option>
                  <option value="Électrique">Électrique</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Durée de vie conseillée (km)
                </label>
                <input
                  type="number"
                  step="100"
                  value={catForm.defaultLifespanKm || 5000}
                  onChange={(e) => setCatForm({ ...catForm, defaultLifespanKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Consignes
                </label>
                <textarea
                  rows={2}
                  value={catForm.description || ''}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Ex: Vérifier l'élongation avec le calibre à 0.75"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSOCIER UN COMPOSANT (COMPOSITION) */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-600" />
              <span>{editingLink ? 'Modifier le lien' : 'Associer un composant au vélo'}</span>
            </h3>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vélo destinataire
                </label>
                <select
                  value={linkForm.bikeId || selectedBikeForComposition}
                  onChange={(e) => setLinkForm({ ...linkForm, bikeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  {data.bikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type de composant
                </label>
                <select
                  value={linkForm.componentCategoryId || ''}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const cat = data.componentCategories.find((c) => c.id === catId);
                    setLinkForm({
                      ...linkForm,
                      componentCategoryId: catId,
                      lifespanKmTarget: cat?.defaultLifespanKm || 5000,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  {data.componentCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modèle exact / Marque installée (optionnel)
                </label>
                <input
                  type="text"
                  value={linkForm.customName || ''}
                  onChange={(e) => setLinkForm({ ...linkForm, customName: e.target.value })}
                  placeholder="Ex: Shimano Ultegra CN-M8100 12v"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date d'installation
                  </label>
                  <input
                    type="date"
                    required
                    value={linkForm.installedDate || ''}
                    onChange={(e) => setLinkForm({ ...linkForm, installedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Objectif durée (km)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={linkForm.lifespanKmTarget || 5000}
                    onChange={(e) => setLinkForm({ ...linkForm, lifespanKmTarget: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarques
                </label>
                <input
                  type="text"
                  value={linkForm.notes || ''}
                  onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                  placeholder="Ex: Monté neuf lors de l'achat"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  Lier au vélo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
