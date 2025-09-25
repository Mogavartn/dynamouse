#!/bin/bash

# DynaMouse macOS Deployment Script
# Compatible avec macOS Sonoma 14.3+ et écrans ANMITE
# Version: 1.2.0

set -e  # Exit on any error

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="DynaMouse"
APP_ID="projectstorm.dynamouse"
APP_VERSION="1.2.0"
MIN_MACOS_VERSION="14.3"
REQUIRED_NODE_VERSION="22.16.0"

# Chemins
INSTALL_DIR="/Applications"
USER_APPS_DIR="$HOME/Applications"
LOG_DIR="$HOME/Library/Logs/$APP_NAME"
CONFIG_DIR="$HOME/Library/Application Support/$APP_NAME"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier la version de macOS
    MACOS_VERSION=$(sw_vers -productVersion)
    if [[ $(echo "$MACOS_VERSION $MIN_MACOS_VERSION" | tr " " "\n" | sort -V | head -n1) != "$MIN_MACOS_VERSION" ]]; then
        log_error "macOS $MIN_MACOS_VERSION ou plus récent requis. Version actuelle: $MACOS_VERSION"
        exit 1
    fi
    log_success "Version macOS compatible: $MACOS_VERSION"
    
    # Vérifier l'architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        log_success "Architecture Apple Silicon (ARM64) détectée"
    elif [[ "$ARCH" == "x86_64" ]]; then
        log_success "Architecture Intel (x86_64) détectée"
    else
        log_warning "Architecture non reconnue: $ARCH"
    fi
    
    # Vérifier Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        if [[ $(echo "$NODE_VERSION $REQUIRED_NODE_VERSION" | tr " " "\n" | sort -V | head -n1) != "$REQUIRED_NODE_VERSION" ]]; then
            log_warning "Node.js $REQUIRED_NODE_VERSION recommandé. Version actuelle: $NODE_VERSION"
        else
            log_success "Version Node.js compatible: $NODE_VERSION"
        fi
    else
        log_warning "Node.js non trouvé. Installation recommandée."
    fi
    
    # Vérifier pnpm
    if command -v pnpm &> /dev/null; then
        log_success "pnpm trouvé"
    else
        log_warning "pnpm non trouvé. Installation recommandée: npm install -g pnpm"
    fi
}

# Installation des pilotes ANMITE
install_anmite_drivers() {
    log_info "Vérification des pilotes ANMITE..."
    
    # Vérifier si les pilotes ANMITE sont déjà installés
    if system_profiler SPUSBDataType | grep -i "anmite\|touch" &> /dev/null; then
        log_success "Périphériques tactiles détectés"
    fi
    
    # Créer le répertoire pour les pilotes si nécessaire
    mkdir -p "$CONFIG_DIR/drivers"
    
    # Instructions pour l'utilisateur
    cat > "$CONFIG_DIR/drivers/README.md" << 'EOF'
# Pilotes ANMITE pour macOS

Pour une compatibilité complète avec les écrans tactiles ANMITE sur macOS Sonoma:

1. Téléchargez les derniers pilotes depuis le site officiel ANMITE
2. Installez les pilotes selon les instructions du fabricant
3. Redémarrez votre Mac après l'installation
4. Vérifiez les permissions dans Préférences Système > Sécurité et confidentialité

## Vérification de l'installation

```bash
# Vérifier les périphériques USB
system_profiler SPUSBDataType | grep -i anmite

# Vérifier les périphériques d'affichage
system_profiler SPDisplaysDataType | grep -i touch
```
EOF
    
    log_success "Instructions pour les pilotes ANMITE créées dans $CONFIG_DIR/drivers/README.md"
}

# Configuration des permissions macOS
setup_permissions() {
    log_info "Configuration des permissions macOS..."
    
    # Créer le script d'aide pour les permissions
    cat > "$CONFIG_DIR/setup-permissions.sh" << 'EOF'
#!/bin/bash

echo "Configuration des permissions pour DynaMouse..."
echo ""

echo "1. Ouvrez les Préférences Système > Sécurité et confidentialité > Confidentialité"
echo "2. Sélectionnez 'Accessibilité' dans la barre latérale"
echo "3. Cliquez sur le cadenas pour déverrouiller"
echo "4. Ajoutez DynaMouse à la liste des applications autorisées"
echo ""

echo "5. Sélectionnez 'Surveillance des entrées' dans la barre latérale"
echo "6. Ajoutez DynaMouse à la liste des applications autorisées"
echo ""

echo "7. Sélectionnez 'Fichiers et dossiers' dans la barre latérale"
echo "8. Assurez-vous que DynaMouse a accès aux dossiers nécessaires"
echo ""

echo "Redémarrez DynaMouse après avoir configuré les permissions."
echo ""

# Ouvrir automatiquement les Préférences Système
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
EOF
    
    chmod +x "$CONFIG_DIR/setup-permissions.sh"
    
    log_success "Script de configuration des permissions créé: $CONFIG_DIR/setup-permissions.sh"
}

# Installation de l'application
install_app() {
    log_info "Installation de $APP_NAME..."
    
    # Arrêter l'application si elle est en cours d'exécution
    if pgrep -f "$APP_NAME" &> /dev/null; then
        log_info "Arrêt de $APP_NAME en cours d'exécution..."
        pkill -f "$APP_NAME" || true
        sleep 2
    fi
    
    # Créer les répertoires nécessaires
    mkdir -p "$LOG_DIR"
    mkdir -p "$CONFIG_DIR"
    
    # Construire l'application
    if [[ -f "package.json" ]]; then
        log_info "Construction de l'application..."
        
        # Installer les dépendances
        if command -v pnpm &> /dev/null; then
            pnpm install
        elif command -v npm &> /dev/null; then
            npm install
        else
            log_error "pnpm ou npm requis pour construire l'application"
            exit 1
        fi
        
        # Construire le projet
        if command -v pnpm &> /dev/null; then
            pnpm build
        else
            npm run build
        fi
        
        # Créer le package d'application
        if command -v pnpm &> /dev/null; then
            pnpm app:dist
        else
            npm run app:dist
        fi
        
        # Copier l'application vers le répertoire d'installation
        if [[ -d "dist_electron/mac" ]]; then
            APP_PATH=$(find dist_electron/mac -name "*.app" | head -n1)
            if [[ -n "$APP_PATH" ]]; then
                cp -R "$APP_PATH" "$INSTALL_DIR/"
                log_success "Application installée dans $INSTALL_DIR"
            fi
        fi
    else
        log_error "Fichier package.json non trouvé. Lancez ce script depuis le répertoire du projet."
        exit 1
    fi
}

# Configuration de l'auto-démarrage
setup_autostart() {
    log_info "Configuration de l'auto-démarrage..."
    
    cat > "$CONFIG_DIR/autostart-setup.sh" << 'EOF'
#!/bin/bash

# Configuration de l'auto-démarrage pour DynaMouse
APP_PATH="/Applications/DynaMouse.app"

if [[ -d "$APP_PATH" ]]; then
    # Créer un LaunchAgent pour l'auto-démarrage
    LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
    mkdir -p "$LAUNCH_AGENT_DIR"
    
    cat > "$LAUNCH_AGENT_DIR/com.projectstorm.dynamouse.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.projectstorm.dynamouse</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/DynaMouse.app/Contents/MacOS/DynaMouse</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>~/Library/Logs/DynaMouse/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>~/Library/Logs/DynaMouse/launchd.error.log</string>
</dict>
</plist>
PLIST
    
    echo "Auto-démarrage configuré avec LaunchAgent"
    echo "Pour activer: launchctl load ~/Library/LaunchAgents/com.projectstorm.dynamouse.plist"
    echo "Pour désactiver: launchctl unload ~/Library/LaunchAgents/com.projectstorm.dynamouse.plist"
else
    echo "Erreur: Application non trouvée dans $APP_PATH"
fi
EOF
    
    chmod +x "$CONFIG_DIR/autostart-setup.sh"
    log_success "Script d'auto-démarrage créé: $CONFIG_DIR/autostart-setup.sh"
}

# Création d'un script de mise à jour
create_update_script() {
    log_info "Création du script de mise à jour..."
    
    cat > "$CONFIG_DIR/update-dynamouse.sh" << 'EOF'
#!/bin/bash

# Script de mise à jour pour DynaMouse
set -e

APP_NAME="DynaMouse"
BACKUP_DIR="$HOME/Library/Application Support/DynaMouse/backups"
CURRENT_VERSION=$(defaults read /Applications/DynaMouse.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null || echo "unknown")

echo "Mise à jour de $APP_NAME..."
echo "Version actuelle: $CURRENT_VERSION"

# Créer une sauvegarde
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
if [[ -d "/Applications/$APP_NAME.app" ]]; then
    cp -R "/Applications/$APP_NAME.app" "$BACKUP_DIR/$APP_NAME_$CURRENT_VERSION_$TIMESTAMP.app"
    echo "Sauvegarde créée: $BACKUP_DIR/$APP_NAME_$CURRENT_VERSION_$TIMESTAMP.app"
fi

# Arrêter l'application
pkill -f "$APP_NAME" || true

# Mettre à jour depuis le dépôt Git
if [[ -d ".git" ]]; then
    git pull origin main
    echo "Code source mis à jour"
    
    # Reconstruire et installer
    if command -v pnpm &> /dev/null; then
        pnpm install
        pnpm build
        pnpm app:dist
        
        # Installer la nouvelle version
        if [[ -d "dist_electron/mac" ]]; then
            APP_PATH=$(find dist_electron/mac -name "*.app" | head -n1)
            if [[ -n "$APP_PATH" ]]; then
                rm -rf "/Applications/$APP_NAME.app"
                cp -R "$APP_PATH" "/Applications/"
                echo "Application mise à jour dans /Applications/"
            fi
        fi
    else
        echo "pnpm requis pour la mise à jour"
        exit 1
    fi
else
    echo "Ce répertoire n'est pas un dépôt Git"
    exit 1
fi

echo "Mise à jour terminée!"
echo "Redémarrez $APP_NAME pour appliquer les changements."
EOF
    
    chmod +x "$CONFIG_DIR/update-dynamouse.sh"
    log_success "Script de mise à jour créé: $CONFIG_DIR/update-dynamouse.sh"
}

# Script de désinstallation
create_uninstall_script() {
    log_info "Création du script de désinstallation..."
    
    cat > "$CONFIG_DIR/uninstall-dynamouse.sh" << 'EOF'
#!/bin/bash

# Script de désinstallation pour DynaMouse
APP_NAME="DynaMouse"

echo "Désinstallation de $APP_NAME..."

# Arrêter l'application
pkill -f "$APP_NAME" || true

# Supprimer l'application
if [[ -d "/Applications/$APP_NAME.app" ]]; then
    rm -rf "/Applications/$APP_NAME.app"
    echo "Application supprimée de /Applications/"
fi

# Supprimer les données utilisateur
rm -rf "$HOME/Library/Application Support/$APP_NAME"
rm -rf "$HOME/Library/Logs/$APP_NAME"

# Supprimer les LaunchAgents
rm -f "$HOME/Library/LaunchAgents/com.projectstorm.dynamouse.plist"

# Supprimer les caches
rm -rf "$HOME/Library/Caches/$APP_ID"

echo "Désinstallation terminée!"
echo "Note: Les permissions dans Préférences Système doivent être supprimées manuellement."
EOF
    
    chmod +x "$CONFIG_DIR/uninstall-dynamouse.sh"
    log_success "Script de désinstallation créé: $CONFIG_DIR/uninstall-dynamouse.sh"
}

# Lancement de l'application
launch_app() {
    log_info "Lancement de $APP_NAME..."
    
    if [[ -d "/Applications/$APP_NAME.app" ]]; then
        open "/Applications/$APP_NAME.app"
        log_success "Application lancée"
    else
        log_error "Application non trouvée dans /Applications/"
        exit 1
    fi
}

# Fonction principale
main() {
    echo "=========================================="
    echo "  Script de déploiement DynaMouse v$APP_VERSION"
    echo "  Compatible macOS Sonoma 14.3+ et écrans ANMITE"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    install_anmite_drivers
    setup_permissions
    install_app
    setup_autostart
    create_update_script
    create_uninstall_script
    
    echo ""
    echo "=========================================="
    log_success "Déploiement terminé!"
    echo "=========================================="
    echo ""
    echo "Prochaines étapes:"
    echo "1. Exécutez: $CONFIG_DIR/setup-permissions.sh"
    echo "2. Configurez les permissions dans Préférences Système"
    echo "3. Installez les pilotes ANMITE si nécessaire"
    echo "4. Redémarrez votre Mac"
    echo ""
    
    read -p "Voulez-vous lancer l'application maintenant? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        launch_app
    fi
}

# Gestion des arguments
case "${1:-}" in
    "check")
        check_prerequisites
        ;;
    "install-drivers")
        install_anmite_drivers
        ;;
    "setup-permissions")
        setup_permissions
        ;;
    "install")
        install_app
        ;;
    "update")
        if [[ -f "$CONFIG_DIR/update-dynamouse.sh" ]]; then
            bash "$CONFIG_DIR/update-dynamouse.sh"
        else
            log_error "Script de mise à jour non trouvé"
            exit 1
        fi
        ;;
    "uninstall")
        if [[ -f "$CONFIG_DIR/uninstall-dynamouse.sh" ]]; then
            bash "$CONFIG_DIR/uninstall-dynamouse.sh"
        else
            log_error "Script de désinstallation non trouvé"
            exit 1
        fi
        ;;
    "launch")
        launch_app
        ;;
    *)
        main
        ;;
esac