# Application Linux - Stats et Maintenance Vélo

Cette application fonctionne à la fois comme application web et comme **véritable application de bureau Linux**.
En mode Bureau Linux, l'application dispose d'un accès direct au disque dur et écrit automatiquement vos données et sauvegardes physiques dans votre dossier personnel (ex : `/home/sabine/Documents/Voyages - Randonnées/Vélo/Stats_Maintenance/`).

---

## Méthode 1 : Télécharger l'application déjà compilée depuis GitHub (Sans rien compiler !)

À chaque `git push` sur votre dépôt GitHub, l'automatisation GitHub compile automatiquement l'exécutable Linux :

1. Sur votre dépôt GitHub, cliquez sur l'onglet **Actions**.
2. Cliquez sur le dernier workflow terminé : **« Compilation Application Linux (AppImage & deb) »**.
3. Tout en bas de la page, dans la section **Artifacts**, cliquez sur **`application-linux-velo-stats`** pour télécharger l'archive zip contenant votre fichier `.AppImage` (et le paquet d'installation `.deb`).
4. Extrayez l'archive sur votre Linux.
5. Rendez le fichier exécutable :
   ```bash
   chmod +x "Stats et Maintenance Vélo-1.0.0.AppImage"
   ```
6. Double-cliquez dessus pour lancer votre application !

---

## Méthode 2 : Lancer et tester en mode Bureau Linux en local

Sur votre machine Linux dans le dossier du projet :

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application de bureau
npm run electron:dev
```

L'application s'ouvre dans une fenêtre native Linux avec le bandeau vert confirmant :
*« Application Bureau Linux active : Vos modifications et sauvegardes sont écrites directement sur votre disque dur physique. »*

---

## Méthode 3 : Compiler vous-même le fichier `.AppImage` ou `.deb` sur votre Linux

Pour fabriquer votre propre fichier exécutable `.AppImage` ou paquet d'installation `.deb` :

```bash
npm run electron:build
```

Une fois terminé, vous trouverez vos fichiers prêts à l'emploi dans le dossier :
```text
release/
├── Stats et Maintenance Vélo-1.0.0.AppImage
└── Stats et Maintenance Vélo_1.0.0_amd64.deb
```

* Pour lancer le fichier **AppImage** :
  ```bash
  chmod +x release/*.AppImage
  ./release/*.AppImage
  ```
* Pour installer le paquet **.deb** sur Ubuntu / Debian / Linux Mint :
  ```bash
  sudo dpkg -i release/*.deb
  ```
