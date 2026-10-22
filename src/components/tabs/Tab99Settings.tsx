import React, { useState, useRef } from 'react';
import { AppDataPayload, PageSettings, BackupRecord, TabConfig } from '../../types';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Folder, 
  FolderOpen,
  History, 
  Check, 
  AlertTriangle, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2,
  Monitor 
} from 'lucide-react';
import { 
  createBackupRecord, 
  loadBackups, 
  deleteBackupRecord, 
  downloadBackupFile, 
  downloadCurrentDataAsFile,
  getInitialAppData 
} from '../../services/storage';

interface Tab99SettingsProps {
  data: AppDataPayload;
  tabDefinitions: TabConfig[];
  onUpdateSettings: (settings: PageSettings) => void;
  onRestoreData: (restoredData: AppDataPayload) => void;
  onResetData: () => void;
  onClearToBlank?: () => void;
}

export const Tab99Settings: React.FC<Tab99SettingsProps> = ({
  data,
  tabDefinitions,
  onUpdateSettings,
  onRestoreData,
  onResetData,
  onClearToBlank,
}) => {
  const { settings } = data;
  const [localSettings, setLocalSettings] = useState<PageSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);
  const [directoryNotice, setDirectoryNotice] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>(loadBackups());
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workingDirInputRef = useRef<HTMLInputElement>(null);
  const backupDirInputRef = useRef<HTMLInputElement>(null);

  // Directly apply picked directory path and update settings in real time
  const applySelectedDirectory = (folderName: string, field: 'workingDataPath' | 'backupStoragePath') => {
    if (!folderName) return;
    const cleanFolder = folderName.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');

    // Get the base directory manually entered by the user. If empty, fallback to ~/
    let homePrefix = (localSettings.userHomePrefix || '').trim();
    if (!homePrefix) {
      homePrefix = '~/';
    }

    const isWindows = homePrefix.includes('\\');
    let fullPath = '';
    if (isWindows) {
      const normalizedPrefix = homePrefix.replace(/\\+$/, '');
      fullPath = `${normalizedPrefix}\\${cleanFolder}\\`;
    } else {
      const normalizedPrefix = homePrefix.replace(/\/+$/, '');
      fullPath = `${normalizedPrefix}/${cleanFolder}/`;
    }

    setLocalSettings((prev) => {
      const updated = {
        ...prev,
        [field]: fullPath,
      };
      onUpdateSettings(updated);
      return updated;
    });

    setDirectoryNotice(`Dossier sélectionné : ${fullPath}`);
    setTimeout(() => setDirectoryNotice(null), 5000);
  };

  // Directory Picker handler: opens native OS file manager
  const handlePickDirectory = async (field: 'workingDataPath' | 'backupStoragePath') => {
    // 0. If running in Linux Electron Desktop App, use native OS file manager dialog directly!
    if (window.electronAPI?.pickDirectory) {
      try {
        const defaultPath = (localSettings[field] || localSettings.userHomePrefix || '').trim();
        const selected = await window.electronAPI.pickDirectory(defaultPath);
        if (selected) {
          const isWin = selected.includes('\\');
          const finalPath = selected.endsWith('/') || selected.endsWith('\\') ? selected : `${selected}${isWin ? '\\' : '/'}`;
          const updated = {
            ...localSettings,
            [field]: finalPath,
          };
          setLocalSettings(updated);
          onUpdateSettings(updated);
          setDirectoryNotice(`Dossier sélectionné : ${finalPath}`);
          setTimeout(() => setDirectoryNotice(null), 5000);
          return;
        }
      } catch (err) {
        console.warn('Electron pickDirectory failed:', err);
      }
    }

    let isCrossDomainIframe = false;
    try {
      isCrossDomainIframe = window.self !== window.top;
    } catch {
      isCrossDomainIframe = true;
    }

    // 1. If not in a cross-origin iframe and showDirectoryPicker is supported, try it directly
    if (!isCrossDomainIframe && typeof (window as any).showDirectoryPicker === 'function') {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          startIn: 'documents',
          mode: 'read',
        });
        if (dirHandle?.name) {
          applySelectedDirectory(dirHandle.name, field);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('showDirectoryPicker failed, falling back to input', err);
      }
    }

    // 2. Direct synchronous trigger using hidden directory input to preserve user activation
    if (field === 'workingDataPath' && workingDirInputRef.current) {
      workingDirInputRef.current.value = '';
      workingDirInputRef.current.click();
    } else if (field === 'backupStoragePath' && backupDirInputRef.current) {
      backupDirInputRef.current.value = '';
      backupDirInputRef.current.click();
    }
  };

  const handleDirectoryInputFallback = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'workingDataPath' | 'backupStoragePath'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let folderName = '';
    const sampleFile = files[0];
    if (sampleFile.webkitRelativePath) {
      folderName = sampleFile.webkitRelativePath.split('/')[0] || sampleFile.webkitRelativePath.split('\\')[0];
    } else {
      folderName = sampleFile.name.replace(/\.[^/.]+$/, '');
    }

    if (!folderName) folderName = 'Cyclisme';
    applySelectedDirectory(folderName, field);
    e.target.value = '';
  };

  // Handle saving configuration settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Move tab up or down in order
  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...localSettings.tabOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const updated = { ...localSettings, tabOrder: newOrder };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  // Create manual backup now
  const handleManualBackup = () => {
    const backup = createBackupRecord(data, 'sauvegarde-manuelle');
    setBackups(loadBackups());
    setSelectedBackupId(backup.id);
    alert(`Sauvegarde réussie !\nFichier enregistré localement : ${backup.filename}`);
  };

  // Restore selected backup from list
  const handleRestoreBackup = () => {
    if (!selectedBackupId) {
      alert('Veuillez sélectionner un backup dans la liste déroulante.');
      return;
    }
    const found = backups.find((b) => b.id === selectedBackupId);
    if (!found) return;

    const confirmMsg = `Confirmez-vous le rechargement du backup :\n"${found.filename}" ?\nDate : ${new Date(found.timestamp).toLocaleString('fr-FR')}\nContenu : ${found.summary.ridesCount} randos, ${found.summary.bikesCount} vélos.`;
    if (window.confirm(confirmMsg)) {
      onRestoreData(found.data);
      alert('Le backup a été restauré avec succès.');
    }
  };

  // Delete a backup
  const handleDeleteBackup = (backupId: string) => {
    if (window.confirm('Voulez-vous supprimer ce point de sauvegarde ?')) {
      const remaining = deleteBackupRecord(backupId);
      setBackups(remaining);
      if (selectedBackupId === backupId) {
        setSelectedBackupId('');
      }
    }
  };

  // Import JSON file from user computer
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.bikes && parsed.rides) {
          if (window.confirm(`Fichier "${file.name}" valide. Recharger ces données maintenant ?`)) {
            onRestoreData(parsed);
            alert('Importation terminée avec succès !');
          }
        } else {
          alert('Le fichier importé n\'est pas un fichier de données compatible avec cette application.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Save confirmation alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Tab 99 - Paramètres de la Page & Sauvegardes Locales</span>
          </h2>
          <p className="text-xs text-slate-500">
            Personnalisation complète de l'application, typographie, bandeau, ordre des onglets et gestion des sauvegardes locales.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold animate-fade-in border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Paramètres enregistrés !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* SECTION 1: APPARENCE & IDENTITÉ DE LA PAGE */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>1. Nom de l'application & Style Visuel</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom de la page */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom de la page / Titre affiché
              </label>
              <input
                type="text"
                value={localSettings.appTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, appTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            {/* Font definition */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Définition de la police (Font)
              </label>
              <select
                value={localSettings.fontFamily}
                onChange={(e) => setLocalSettings({ ...localSettings, fontFamily: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium"
              >
                <option value="Inter">Inter (Moderne & Épuré)</option>
                <option value="Poppins">Poppins (Arrondi & Élégant)</option>
                <option value="Montserrat">Montserrat (Géométrique & Sportif)</option>
                <option value="Outfit">Outfit (Contemporain dynamique)</option>
                <option value="Space Grotesk">Space Grotesk (Technique & Pro)</option>
                <option value="Playfair Display">Playfair Display (Classique / Rétro)</option>
                <option value="JetBrains Mono">JetBrains Mono (Monospace technique)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Font size */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Taille générale du texte
              </label>
              <select
                value={localSettings.fontSizeBase}
                onChange={(e) => setLocalSettings({ ...localSettings, fontSizeBase: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                <option value="compact">Compact (Vue dense)</option>
                <option value="normal">Normal (Recommandé)</option>
                <option value="grand">Grand (Confort de lecture)</option>
              </select>
            </div>

            {/* Theme color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Couleur d'accentuation
              </label>
              <select
                value={localSettings.themeColor}
                onChange={(e) => setLocalSettings({ ...localSettings, themeColor: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                <option value="emerald">Émeraude Vélo (Défaut)</option>
                <option value="blue">Bleu Cycliste</option>
                <option value="indigo">Indigo Profond</option>
                <option value="teal">Sarcelle / Cyan</option>
                <option value="amber">Ambre / Or</option>
                <option value="rose">Rose Tour</option>
                <option value="slate">Gris Ardoise Tech</option>
              </select>
            </div>

            {/* Bandeau ou pas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bandeau supérieur rectangle
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="banner-toggle"
                  checked={localSettings.showHeaderBanner}
                  onChange={(e) => setLocalSettings({ ...localSettings, showHeaderBanner: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="banner-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Afficher le bandeau rectangle
                </label>
              </div>
            </div>
          </div>

          {/* Bandeau color customization */}
          {localSettings.showHeaderBanner && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Couleur de fond du bandeau
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localSettings.bannerBgColor || '#0f172a'}
                    onChange={(e) => setLocalSettings({ ...localSettings, bannerBgColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={localSettings.bannerBgColor || '#0f172a'}
                    onChange={(e) => setLocalSettings({ ...localSettings, bannerBgColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Couleur du texte du bandeau
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localSettings.bannerTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({ ...localSettings, bannerTextColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={localSettings.bannerTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({ ...localSettings, bannerTextColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Icons & Favicon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chemin ou URL de l'icône / logo sur la page
              </label>
              <input
                type="text"
                placeholder="Ex: /logo_velo.svg ou https://... (laisser vide pour l'icône par défaut)"
                value={localSettings.pageIconUrl || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, pageIconUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chemin ou URL du favicon (icône d'onglet navigateur)
              </label>
              <input
                type="text"
                placeholder="Ex: /favicon.ico ou /icon.png"
                value={localSettings.faviconUrl || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, faviconUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ORDRE DES TABS */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <Type className="w-4 h-4 text-emerald-600" />
            <span>2. Ordre d'affichage des Onglets (Tabs)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Personnalisez l'ordre des onglets dans la barre de navigation selon vos habitudes avec les boutons Monter / Descendre :
          </p>

          <div className="space-y-2 max-w-xl">
            {localSettings.tabOrder.map((tabId, idx) => {
              const def = tabDefinitions.find((t) => t.id === tabId);
              if (!def) return null;

              return (
                <div
                  key={tabId}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {def.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTab(idx, 'up')}
                      className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      title="Monter"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === localSettings.tabOrder.length - 1}
                      onClick={() => moveTab(idx, 'down')}
                      className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      title="Descendre"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: SAUVEGARDES LOCALES ET FICHIERS */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>3. Sauvegardes Locales, Fichiers & Backups</span>
          </h3>

          {directoryNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{directoryNotice}</span>
            </div>
          )}

          {/* Hidden inputs for directory selection fallback */}
          <input
            type="file"
            ref={workingDirInputRef}
            onChange={(e) => handleDirectoryInputFallback(e, 'workingDataPath')}
            {...({ webkitdirectory: '', directory: '' } as any)}
            className="hidden"
          />
          <input
            type="file"
            ref={backupDirInputRef}
            onChange={(e) => handleDirectoryInputFallback(e, 'backupStoragePath')}
            {...({ webkitdirectory: '', directory: '' } as any)}
            className="hidden"
          />

          {typeof window !== 'undefined' && window.electronAPI && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>
                  <strong>Application Bureau Linux active :</strong> Vos modifications et sauvegardes sont écrites directement sur votre disque dur physique.
                </span>
              </div>
            </div>
          )}

          {/* Instructions pour l'application de Bureau Linux */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 dark:border-emerald-700 rounded-xl space-y-2">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Application de Bureau Linux (Exécutable autonome .AppImage & .deb)</span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                L'application dispose d'un mode Bureau natif Linux avec écriture directe sur votre disque dur. Vous avez deux options simples pour l'obtenir :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Option 1 : Génération locale instantanée (Zéro téléchargement)</span>
                  <p className="text-slate-500 text-[10px]">Dans le dossier du projet sur votre Linux :</p>
                  <code className="block p-1 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px] text-emerald-800 dark:text-emerald-300">
                    npm run electron:build
                  </code>
                  <p className="text-[10px] text-slate-500">L'exécutable .AppImage est créé directement dans votre dossier <code className="font-mono">release/</code>.</p>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-blue-700 dark:text-blue-400">Option 2 : Télécharger depuis GitHub</span>
                  <p className="text-slate-500 text-[10px]">Sur GitHub, onglet <strong>Actions</strong> &gt; dernier build &gt; section <strong>Artifacts</strong> tout en bas de page pour télécharger l'archive zip.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration du répertoire de base (entrée manuelle libre, ou repli sur ~/ si vide) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Répertoire de base (saisie manuelle libre)
                </label>
                <p className="text-[11px] text-slate-500">
                  Entrez votre chemin de base. Si ce champ est vide, le répertoire par défaut (<code className="px-1 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">~/</code>) est automatiquement utilisé.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const p = '/home/sabine/Documents/Voyages - Randonnées/Vélo/Stats_Maintenance';
                    const updated = {
                      ...localSettings,
                      userHomePrefix: p,
                      workingDataPath: `${p}/`,
                      backupStoragePath: `${p}/backups/`,
                    };
                    setLocalSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer"
                  title="Appliquer l'exemple de chemin complet"
                >
                  Exemple : /home/sabine/.../Stats_Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...localSettings,
                      userHomePrefix: '',
                      workingDataPath: '~/',
                      backupStoragePath: '~/backups/',
                    };
                    setLocalSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Réinitialiser au répertoire par défaut (~/)"
                >
                  Par défaut (~/)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                value={localSettings.userHomePrefix ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...localSettings, userHomePrefix: val };
                  setLocalSettings(updated);
                  onUpdateSettings(updated);
                }}
                placeholder="Ex: /home/sabine/Documents/Voyages - Randonnées/Vélo/Stats_Maintenance (ou laisser vide pour ~/)"
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const base = (localSettings.userHomePrefix || '').trim() || '~/';
                  const clean = base.replace(/[/\\]+$/, '');
                  const isWin = clean.includes('\\');
                  const updated = {
                    ...localSettings,
                    workingDataPath: isWin ? `${clean}\\` : `${clean}/`,
                    backupStoragePath: isWin ? `${clean}\\backups\\` : `${clean}/backups/`,
                  };
                  setLocalSettings(updated);
                  onUpdateSettings(updated);
                  setDirectoryNotice(`Chemins mis à jour vers : ${updated.workingDataPath}`);
                  setTimeout(() => setDirectoryNotice(null), 4000);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Appliquer aux dossiers ci-dessous
              </button>
            </div>

            {!(localSettings.userHomePrefix || '').trim() && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                ℹ️ Répertoire par défaut actif : <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">~/</code> sur Linux.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dossier des fichiers utilisés (chemin complet)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSettings.workingDataPath || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, workingDataPath: e.target.value })}
                    placeholder="Ex: /home/sabine/Téléchargements/ ou C:\Velo\data\"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handlePickDirectory('workingDataPath')}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md absolute left-1 top-1 transition-colors cursor-pointer"
                    title="Cliquer sur l'icône pour ouvrir l'explorateur de fichiers"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handlePickDirectory('workingDataPath')}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  title="Ouvrir le gestionnaire de fichiers pour choisir ce répertoire"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Parcourir</span>
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="text-[10px] text-slate-500 self-center">Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = localSettings.userHomePrefix || '/home/sabine';
                    const p = `${prefix.replace(/\/+$/, '')}/Téléchargements/`;
                    setLocalSettings({ ...localSettings, workingDataPath: p });
                    onUpdateSettings({ ...localSettings, workingDataPath: p });
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 font-mono cursor-pointer"
                >
                  Téléchargements
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = localSettings.userHomePrefix || '/home/sabine';
                    const p = `${prefix.replace(/\/+$/, '')}/Documents/`;
                    setLocalSettings({ ...localSettings, workingDataPath: p });
                    onUpdateSettings({ ...localSettings, workingDataPath: p });
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 font-mono cursor-pointer"
                >
                  Documents
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = localSettings.userHomePrefix || '/home/sabine';
                    const p = `${prefix.replace(/\/+$/, '')}/cyclisme/donnees/`;
                    setLocalSettings({ ...localSettings, workingDataPath: p });
                    onUpdateSettings({ ...localSettings, workingDataPath: p });
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 font-mono cursor-pointer"
                >
                  cyclisme/donnees
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dossier pour les sauvegardes / backups (chemin complet)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSettings.backupStoragePath}
                    onChange={(e) => setLocalSettings({ ...localSettings, backupStoragePath: e.target.value })}
                    placeholder="Ex: /home/sabine/Téléchargements/backups/ ou C:\Velo\backups\"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handlePickDirectory('backupStoragePath')}
                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md absolute left-1 top-1 transition-colors cursor-pointer"
                    title="Cliquer sur l'icône pour ouvrir l'explorateur de fichiers"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handlePickDirectory('backupStoragePath')}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  title="Ouvrir le gestionnaire de fichiers pour choisir ce répertoire"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Parcourir</span>
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="text-[10px] text-slate-500 self-center">Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = localSettings.userHomePrefix || '/home/sabine';
                    const p = `${prefix.replace(/\/+$/, '')}/Téléchargements/backups/`;
                    setLocalSettings({ ...localSettings, backupStoragePath: p });
                    onUpdateSettings({ ...localSettings, backupStoragePath: p });
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-mono cursor-pointer"
                >
                  Téléchargements/backups
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = localSettings.userHomePrefix || '/home/sabine';
                    const p = `${prefix.replace(/\/+$/, '')}/backups/`;
                    setLocalSettings({ ...localSettings, backupStoragePath: p });
                    onUpdateSettings({ ...localSettings, backupStoragePath: p });
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-mono cursor-pointer"
                >
                  backups
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = localSettings.userHomePrefix || '/home/sabine';
                    const p = `${prefix.replace(/\/+$/, '')}/cyclisme/donnees/backups/`;
                    setLocalSettings({ ...localSettings, backupStoragePath: p });
                    onUpdateSettings({ ...localSettings, backupStoragePath: p });
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-mono cursor-pointer"
                >
                  cyclisme/donnees/backups
                </button>
              </div>
            </div>
          </div>

          {/* Quick presets for directory paths */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Préréglages rapides pour changer les répertoires :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    workingDataPath: 'C:\\Cyclisme\\Donnees\\',
                    backupStoragePath: 'C:\\Cyclisme\\Backups\\',
                  })
                }
                className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-emerald-50 hover:border-emerald-500 font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Windows (C:\Cyclisme\...)
              </button>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    workingDataPath: '/home/utilisateur/cyclisme/donnees/',
                    backupStoragePath: '/home/utilisateur/cyclisme/backups/',
                  })
                }
                className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-emerald-50 hover:border-emerald-500 font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Mac / Linux (/home/.../cyclisme/)
              </button>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    workingDataPath: './donnees/',
                    backupStoragePath: './donnees/backups/',
                  })
                }
                className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-emerald-50 hover:border-emerald-500 font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Dossier relatif (./donnees/)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de backups que l'on garde
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={localSettings.maxBackupsToKeep}
                onChange={(e) => setLocalSettings({ ...localSettings, maxBackupsToKeep: Number(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Rotation automatique : les backups les plus anciens au-delà de cette limite sont purgés.
              </p>
            </div>
          </div>

          {/* Auto-backup toggle */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.autoBackupOnLoad}
                onChange={(e) => setLocalSettings({ ...localSettings, autoBackupOnLoad: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
              />
              <div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Sauvetage automatique au chargement de la page
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                  Format standard appliqué : <code className="font-mono font-bold">yyyymmdd_hhmmss + nom du fichier</code> (ex : <span className="font-mono">20261021_084512_velo_stats_backup.json</span>).
                </div>
              </div>
            </label>
          </div>

          {/* Manual Backup and Selection Recharging */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Historique des Backups Disponibles ({backups.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Sélectionnez un point de sauvegarde pour le recharger ou le télécharger.
                </p>
              </div>

              <button
                type="button"
                onClick={handleManualBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Créer une sauvegarde maintenant</span>
              </button>
            </div>

            {/* Selector + Recharge button as explicitly specified */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedBackupId}
                onChange={(e) => setSelectedBackupId(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              >
                <option value="">-- Choisir un backup à recharger --</option>
                {backups.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.filename} • {new Date(b.timestamp).toLocaleString('fr-FR')} • ({b.summary.ridesCount} sorties, {b.summary.totalKm} km)
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedBackupId}
                onClick={handleRestoreBackup}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recharger ce backup</span>
              </button>
            </div>

            {/* Backups List Table */}
            {backups.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Nom du fichier de sauvegarde</th>
                      <th className="py-2 px-3">Date & Heure</th>
                      <th className="py-2 px-3">Contenu</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {backups.map((b) => (
                      <tr key={b.id} className="hover:bg-white dark:hover:bg-slate-800">
                        <td className="py-2 px-3 font-mono text-slate-900 dark:text-white">
                          {b.filename}
                        </td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(b.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {b.summary.ridesCount} randos • {b.summary.totalKm} km • {b.summary.bikesCount} vélos
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => downloadBackupFile(b)}
                              className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                              title="Télécharger ce fichier JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBackup(b.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Explanation of data origin upon deployment */}
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>D'où viennent les données visibles au premier déploiement ?</span>
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              Lors du premier lancement, l'application est fournie avec des <strong>données d'exemple</strong> (Colnago, Canyon, Moustache AE, randos et dépenses démo) pour vous permettre de tester immédiatement les graphiques, le calendrier et les jauges d'usure.
              <strong> GitHub ne stocke aucune base de données privée</strong> : toutes vos informations sont gérées localement dans la mémoire de votre navigateur (Local Storage) et dans vos fichiers de sauvegardes.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              {onClearToBlank && (
                <button
                  type="button"
                  onClick={onClearToBlank}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Vider toutes les données (Démarrer à zéro avec mes vrais vélos)
                </button>
              )}
              <button
                type="button"
                onClick={onResetData}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Recharger les données d'exemple (Démo)
              </button>
            </div>
          </div>

          {/* Import / Export & Reset actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadCurrentDataAsFile(data)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exporter fichier JSON sur disque</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Importer un fichier JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>

            {onClearToBlank && (
              <button
                type="button"
                onClick={onClearToBlank}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vider la base pour commencer à zéro</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 4: PIED DE PAGE & SIGNATURE "FabriziodelaRusta v1.1" */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>4. Signature de Pied de Page (FabriziodelaRusta v1.1)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Personnalisation de la mention centrée en bas de page : texte, numéro de version, police, couleur et ombrage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom d'auteur affiché
              </label>
              <input
                type="text"
                value={localSettings.footerSettings?.authorText || 'FabriziodelaRusta'}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    footerSettings: { ...localSettings.footerSettings, authorText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Numéro de version
              </label>
              <input
                type="text"
                value={localSettings.footerSettings?.versionText || 'v1.1'}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    footerSettings: { ...localSettings.footerSettings, versionText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Police du footer
              </label>
              <select
                value={localSettings.footerSettings?.fontFamily || 'Space Grotesk'}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    footerSettings: { ...localSettings.footerSettings, fontFamily: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Outfit">Outfit</option>
                <option value="Playfair Display">Playfair Display (Classique)</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Couleur du texte
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.footerSettings?.fontColor || '#94a3b8'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      footerSettings: { ...localSettings.footerSettings, fontColor: e.target.value },
                    })
                  }
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={localSettings.footerSettings?.fontColor || '#94a3b8'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      footerSettings: { ...localSettings.footerSettings, fontColor: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Effet d'ombrage (Shadow)
              </label>
              <select
                value={localSettings.footerSettings?.textShadow || 'subtle'}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    footerSettings: { ...localSettings.footerSettings, textShadow: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value="subtle">Ombrage Discret</option>
                <option value="glow">Lueur Néon Verte (Glow)</option>
                <option value="strong">Ombre Profonde Forte</option>
                <option value="vintage">Effet Vintage Rétro 3D</option>
                <option value="none">Sans ombrage</option>
              </select>
            </div>
          </div>

          {/* Custom CSS Code for Footer */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Code CSS personnalisé pour le pied de page
            </label>
            <textarea
              rows={3}
              value={localSettings.footerSettings?.customCss || ''}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  footerSettings: { ...localSettings.footerSettings, customCss: e.target.value },
                })
              }
              placeholder="/* Ex: border-top: 3px solid #10b981; background: #0b1329; letter-spacing: 1.5px; text-transform: uppercase; */"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Ce code CSS s'applique directement au bloc de pied de page pour personnaliser librement le style (bordures, fonds, dégradés, espacement...).
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer toutes les préférences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
