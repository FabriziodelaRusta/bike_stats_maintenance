const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    title: 'Stats et Maintenance Vélo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper: resolve ~ to user home directory
function resolvePath(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return path.resolve(filePath);
}

// IPC: Get user home directory (e.g. /home/sabine)
ipcMain.handle('get-home-dir', () => {
  return os.homedir();
});

// IPC: Open native Linux file dialog to pick a folder
ipcMain.handle('pick-directory', async (event, defaultPath) => {
  const resolvedDefault = defaultPath ? resolvePath(defaultPath) : os.homedir();
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Sélectionner le dossier des données ou sauvegardes',
    defaultPath: resolvedDefault,
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// IPC: Write JSON data directly to physical disk
ipcMain.handle('write-json', async (event, filePath, data) => {
  try {
    const fullPath = resolvePath(filePath);
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    return { success: true, path: fullPath };
  } catch (err) {
    console.error('Error writing file:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Read JSON data directly from physical disk
ipcMain.handle('read-json', async (event, filePath) => {
  try {
    const fullPath = resolvePath(filePath);
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'Fichier non trouvé' };
    }
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data, path: fullPath };
  } catch (err) {
    console.error('Error reading file:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Create a timestamped backup directly on physical disk
ipcMain.handle('create-backup', async (event, backupDir, data) => {
  try {
    const resolvedDir = resolvePath(backupDir);
    await fs.promises.mkdir(resolvedDir, { recursive: true });

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const filename = `${yyyy}${mm}${dd}_${hh}${min}${ss}_velo_stats_backup.json`;
    const fullPath = path.join(resolvedDir, filename);

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    const stat = await fs.promises.stat(fullPath);

    return {
      success: true,
      filename,
      path: fullPath,
      sizeBytes: stat.size,
      timestamp: now.toISOString(),
    };
  } catch (err) {
    console.error('Error creating backup:', err);
    return { success: false, error: err.message };
  }
});

// IPC: List backups present in the physical backup directory
ipcMain.handle('list-backups', async (event, backupDir) => {
  try {
    const resolvedDir = resolvePath(backupDir);
    if (!fs.existsSync(resolvedDir)) {
      return { success: true, backups: [] };
    }
    const files = await fs.promises.readdir(resolvedDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const backups = [];
    for (const file of jsonFiles) {
      const fullPath = path.join(resolvedDir, file);
      const stat = await fs.promises.stat(fullPath);
      backups.push({
        id: file,
        filename: file,
        path: fullPath,
        sizeBytes: stat.size,
        modifiedTime: stat.mtime.toISOString(),
      });
    }

    backups.sort((a, b) => b.filename.localeCompare(a.filename));
    return { success: true, backups };
  } catch (err) {
    console.error('Error listing backups:', err);
    return { success: false, error: err.message, backups: [] };
  }
});
