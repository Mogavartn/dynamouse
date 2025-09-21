# Guide d'Installation DynaMouse v1.2.0

## Mise à Jour pour macOS Sonoma 14.3+ et Écrans Tactiles ANMITE

Ce guide vous accompagne dans l'installation et la configuration de DynaMouse v1.2.0, maintenant compatible avec macOS Sonoma 14.3+ et les écrans tactiles ANMITE.

## 🚀 Installation Rapide

### Option 1: Script Automatique (Recommandé)

```bash
# Cloner le dépôt
git clone [URL_DU_DEPOT]
cd dynamouse

# Installation rapide
./scripts/quick-deploy.sh
```

### Option 2: Installation Manuelle

```bash
# Prérequis
node --version  # v22.16.0 ou plus récent
pnpm --version  # ou npm

# Installation
pnpm install
pnpm build
pnpm app:dist

# Copier l'application
cp -R dist_electron/mac/*.app /Applications/
```

## 📋 Prérequis Système

### Système d'Exploitation
- **macOS Sonoma 14.3** ou plus récent
- Compatible **Apple M1/M2/M3 Pro** et **Intel**

### Outils de Développement
- **Node.js 22.16.0+** : [Télécharger](https://nodejs.org)
- **pnpm** : `npm install -g pnpm`
- **Xcode Command Line Tools** : `xcode-select --install`

### Vérification des Prérequis
```bash
# Vérifier macOS
sw_vers -productVersion

# Vérifier l'architecture
uname -m

# Vérifier Node.js
node --version

# Vérifier pnpm
pnpm --version
```

## 🔧 Configuration des Permissions

### 1. Permissions Système Requises

DynaMouse nécessite les permissions suivantes :

#### Accessibilité
1. **Préférences Système** → **Sécurité et confidentialité** → **Confidentialité**
2. Sélectionnez **Accessibilité** dans la barre latérale
3. Cliquez sur le **cadenas** pour déverrouiller
4. Ajoutez **DynaMouse** en cliquant sur **+**
5. Naviguez vers `/Applications/DynaMouse.app`

#### Surveillance des Entrées
1. Dans le même panneau, sélectionnez **Surveillance des entrées**
2. Ajoutez **DynaMouse** de la même manière

#### Script Automatique
```bash
# Ouvrir automatiquement les préférences
./scripts/deploy-macos.sh setup-permissions
```

### 2. Configuration Auto-Démarrage

```bash
# Configurer le lancement au démarrage
./scripts/deploy-macos.sh autostart

# Ou manuellement
launchctl load ~/Library/LaunchAgents/com.projectstorm.dynamouse.plist
```

## 📱 Support des Écrans Tactiles ANMITE

### 1. Installation des Pilotes ANMITE

#### Téléchargement
- Visitez le site officiel ANMITE
- Téléchargez les pilotes macOS Sonoma
- Suivez les instructions d'installation du fabricant

#### Vérification de l'Installation
```bash
# Vérifier les périphériques USB
system_profiler SPUSBDataType | grep -i anmite

# Vérifier les affichages tactiles
system_profiler SPDisplaysDataType | grep -i touch
```

### 2. Configuration dans DynaMouse

1. **Lancez DynaMouse**
2. **Cliquez sur l'icône** dans la barre de menu système
3. Les **écrans tactiles ANMITE** apparaîtront automatiquement
4. **Configurez les paramètres** selon vos besoins :
   - Activation/Désactivation
   - Informations sur le périphérique
   - Résolution et position

### 3. Fonctionnalités Tactiles

- ✅ **Détection automatique** des écrans ANMITE
- ✅ **Monitoring des événements** tactiles
- ✅ **Configuration individuelle** par écran
- ✅ **Informations détaillées** sur les périphériques
- ⚠️ **Expérimental** : Nécessite des pilotes appropriés

## 🛠️ Dépannage

### Problèmes Courants

#### L'application ne se lance pas
```bash
# Vérifier les logs
tail -f ~/Library/Logs/DynaMouse/combined.log

# Vérifier les permissions
./scripts/deploy-macos.sh check

# Réinstaller
./scripts/deploy-macos.sh install
```

#### Écrans tactiles non détectés
1. **Vérifiez les pilotes** ANMITE
2. **Redémarrez** votre Mac
3. **Vérifiez les connexions** USB
4. **Consultez les logs** : `~/Library/Logs/DynaMouse/`

#### Erreurs de compilation
```bash
# Problème avec robotjs/node-gyp
xcode-select --install
pnpm rebuild

# Problème avec les dépendances natives
./scripts/deploy-macos.sh update
```

#### Problèmes de permissions
```bash
# Reconfigurer les permissions
./scripts/deploy-macos.sh setup-permissions

# Vérifier les permissions
./scripts/deploy-macos.sh check
```

### Logs et Diagnostics

#### Emplacements des Logs
- **Application** : `~/Library/Logs/DynaMouse/combined.log`
- **Système** : `~/Library/Logs/DynaMouse/launchd.log`
- **Erreurs** : `~/Library/Logs/DynaMouse/launchd.error.log`

#### Activation du Debug
1. Lancez DynaMouse
2. Menu système → **Debug** → **File Logging**
3. Redémarrez l'application

#### Commandes Utiles
```bash
# Vérifier le processus
ps aux | grep -i dynamouse

# Vérifier les périphériques USB
system_profiler SPUSBDataType

# Vérifier les affichages
system_profiler SPDisplaysDataType

# Tester les permissions
./scripts/deploy-macos.sh check
```

## 🔄 Mise à Jour

### Mise à Jour Automatique
```bash
./scripts/deploy-macos.sh update
```

### Mise à Jour Manuelle
```bash
git pull origin main
./scripts/quick-deploy.sh
```

### Sauvegarde des Configurations
Les configurations sont automatiquement sauvegardées dans :
- `~/Library/Application Support/DynaMouse/`
- Sauvegarde lors des mises à jour dans `backups/`

## 🗑️ Désinstallation

### Désinstallation Complète
```bash
./scripts/deploy-macos.sh uninstall
```

### Désinstallation Manuelle
```bash
# Arrêter l'application
pkill -f DynaMouse

# Supprimer l'application
rm -rf /Applications/DynaMouse.app

# Supprimer les données utilisateur
rm -rf ~/Library/Application\ Support/DynaMouse
rm -rf ~/Library/Logs/DynaMouse

# Supprimer l'auto-démarrage
rm -f ~/Library/LaunchAgents/com.projectstorm.dynamouse.plist
```

## 📞 Support

### Ressources d'Aide
1. **Documentation** : README.md principal
2. **Scripts** : `scripts/README.md`
3. **Logs** : `~/Library/Logs/DynaMouse/`
4. **Issues GitHub** : Créer un ticket avec les logs

### Informations Système
```bash
# Collecter les informations de debug
echo "macOS Version: $(sw_vers -productVersion)"
echo "Architecture: $(uname -m)"
echo "Node.js: $(node --version)"
echo "DynaMouse Version: $(defaults read /Applications/DynaMouse.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null || echo 'Not installed')"
```

## 🎉 Fonctionnalités v1.2.0

### Nouvelles Fonctionnalités
- ✅ **macOS Sonoma 14.3+** compatible
- ✅ **Apple M3 Pro** (ARM64) support
- ✅ **Écrans tactiles ANMITE** détection et gestion
- ✅ **Scripts de déploiement** automatisés
- ✅ **Gestion des permissions** améliorée
- ✅ **Mise à jour automatique** des dépendances

### Améliorations
- 🔄 **Electron 32.0.0** (dernière version)
- 🔄 **Node.js 22.16.0** support
- 🔄 **TypeScript 5.6.3** strict mode
- 🔄 **Entitlements macOS** sécurisés
- 🔄 **Architecture universelle** (x64 + ARM64)

---

## 💡 Conseils et Astuces

### Optimisation des Performances
- Configurez un **délai de démarrage** si nécessaire
- Activez les **logs fichier** seulement pour le debug
- Désactivez les écrans tactiles **non utilisés**

### Utilisation Avancée
- Configurez des **assignations multiples** souris → écran
- Utilisez les **scripts automatiques** pour le déploiement
- Configurez l'**auto-démarrage** pour un usage quotidien

### Sécurité
- Les **entitlements** sont configurés pour macOS
- Les **permissions** sont demandées de manière sécurisée
- Les **données** sont stockées localement seulement

Bon usage de DynaMouse v1.2.0 ! 🎯