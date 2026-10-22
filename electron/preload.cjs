const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  pickDirectory: (defaultPath) => ipcRenderer.invoke('pick-directory', defaultPath),
  saveData: (filePath, data) => ipcRenderer.invoke('write-json', filePath, data),
  loadData: (filePath) => ipcRenderer.invoke('read-json', filePath),
  createBackup: (backupDir, data) => ipcRenderer.invoke('create-backup', backupDir, data),
  listBackups: (backupDir) => ipcRenderer.invoke('list-backups', backupDir),
});
