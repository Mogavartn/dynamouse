# Scripts de Déploiement DynaMouse

Ce répertoire contient les scripts pour déployer DynaMouse sur macOS Sonoma 14.3+ avec support des écrans tactiles ANMITE.

## Scripts Disponibles

### 🚀 `quick-deploy.sh` - Déploiement Rapide

Script simple pour une installation rapide et directe.

```bash
./scripts/quick-deploy.sh
```

**Fonctionnalités :**
- Vérification automatique des prérequis
- Installation des dépendances
- Construction et installation de l'application
- Lancement optionnel de l'application

**Utilisation recommandée :** Pour les utilisateurs qui veulent juste installer rapidement.

### 🔧 `deploy-macos.sh` - Déploiement Complet

Script complet avec toutes les options de configuration.

```bash
# Déploiement complet
./scripts/deploy-macos.sh

# Vérification des prérequis uniquement
./scripts/deploy-macos.sh check

# Installation des pilotes ANMITE
./scripts/deploy-macos.sh install-drivers

# Configuration des permissions
./scripts/deploy-macos.sh setup-permissions

# Installation de l'application uniquement
./scripts/deploy-macos.sh install

# Mise à jour
./scripts/deploy-macos.sh update

# Désinstallation
./scripts/deploy-macos.sh uninstall

# Lancement de l'application
./scripts/deploy-macos.sh launch
```

**Fonctionnalités :**
- Vérification complète des prérequis
- Installation et configuration des pilotes ANMITE
- Configuration automatique des permissions macOS
- Gestion de l'auto-démarrage
- Scripts de mise à jour et désinstallation
- Sauvegarde automatique lors des mises à jour

**Utilisation recommandée :** Pour les utilisateurs avancés ou les administrateurs système.

## Prérequis

### Système
- macOS Sonoma 14.3 ou plus récent
- Apple M1/M2/M3 Pro ou Intel Mac
- Node.js 22.16.0 ou plus récent
- pnpm (installé automatiquement si nécessaire)

### Permissions macOS
L'application nécessite les permissions suivantes :
- **Accessibilité** : Pour contrôler la souris
- **Surveillance des entrées** : Pour détecter les périphériques
- **Fichiers et dossiers** : Pour accéder aux logs et configurations

## Installation des Pilotes ANMITE

### 1. Téléchargement
- Visitez le site officiel ANMITE
- Téléchargez les derniers pilotes pour macOS Sonoma

### 2. Installation
- Suivez les instructions du fabricant
- Redémarrez votre Mac après l'installation

### 3. Vérification
```bash
# Vérifier les périphériques USB
system_profiler SPUSBDataType | grep -i anmite

# Vérifier les périphériques d'affichage
system_profiler SPDisplaysDataType | grep -i touch
```

## Configuration Post-Installation

### 1. Permissions macOS
1. Ouvrez **Préférences Système** > **Sécurité et confidentialité** > **Confidentialité**
2. Sélectionnez **Accessibilité** dans la barre latérale
3. Cliquez sur le cadenas pour déverrouiller
4. Ajoutez **DynaMouse** à la liste des applications autorisées
5. Répétez pour **Surveillance des entrées**

### 2. Configuration des Écrans Tactiles
1. Lancez DynaMouse
2. Cliquez sur l'icône dans la barre de menu
3. Les écrans tactiles ANMITE seront automatiquement détectés
4. Configurez les paramètres selon vos besoins

## Dépannage

### Problèmes Courants

#### L'application ne se lance pas
```bash
# Vérifier les logs
tail -f ~/Library/Logs/DynaMouse/combined.log

# Vérifier les permissions
./scripts/deploy-macos.sh check
```

#### Les écrans tactiles ne sont pas détectés
1. Vérifiez que les pilotes ANMITE sont installés
2. Redémarrez votre Mac
3. Vérifiez les connexions USB
4. Consultez les logs de l'application

#### Problèmes de permissions
```bash
# Reconfigurer les permissions
./scripts/deploy-macos.sh setup-permissions
```

### Logs et Debug
- **Logs de l'application** : `~/Library/Logs/DynaMouse/`
- **Logs système** : `~/Library/Logs/DynaMouse/launchd.log`
- **Configuration** : `~/Library/Application Support/DynaMouse/`

## Mise à Jour

### Mise à jour automatique
```bash
./scripts/deploy-macos.sh update
```

### Mise à jour manuelle
1. `git pull origin main`
2. `./scripts/quick-deploy.sh`

## Désinstallation

### Désinstallation complète
```bash
./scripts/deploy-macos.sh uninstall
```

### Désinstallation manuelle
1. Supprimez l'application : `rm -rf /Applications/DynaMouse.app`
2. Supprimez les données : `rm -rf ~/Library/Application\ Support/DynaMouse`
3. Supprimez les logs : `rm -rf ~/Library/Logs/DynaMouse`
4. Supprimez les permissions dans Préférences Système

## Support

Pour obtenir de l'aide :
1. Consultez les logs de l'application
2. Vérifiez la documentation dans le README principal
3. Créez une issue sur le dépôt GitHub

## Changelog

### v1.2.0
- Ajout du support macOS Sonoma 14.3+
- Ajout du support Apple M3 Pro (ARM64)
- Ajout du support des écrans tactiles ANMITE
- Scripts de déploiement automatisés
- Amélioration de la gestion des permissions
- Scripts de mise à jour et désinstallation