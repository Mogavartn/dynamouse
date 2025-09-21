#!/bin/bash

# Script de déploiement rapide pour DynaMouse
# Usage: ./scripts/quick-deploy.sh

set -e

echo "🚀 Déploiement rapide de DynaMouse v1.2.0"
echo "Compatible macOS Sonoma 14.3+ et écrans ANMITE"
echo ""

# Vérifier si on est dans le bon répertoire
if [[ ! -f "package.json" ]]; then
    echo "❌ Erreur: Lancez ce script depuis le répertoire racine du projet"
    exit 1
fi

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé. Installez Node.js 22.16.0+ depuis https://nodejs.org"
    exit 1
fi

# pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm non trouvé. Installation..."
    npm install -g pnpm
fi

# macOS version
MACOS_VERSION=$(sw_vers -productVersion)
echo "✅ macOS $MACOS_VERSION détecté"

# Architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    echo "✅ Architecture Apple Silicon (M1/M2/M3) détectée"
elif [[ "$ARCH" == "x86_64" ]]; then
    echo "✅ Architecture Intel détectée"
fi

echo ""
echo "🔨 Construction de l'application..."

# Installer les dépendances
pnpm install

# Construire le projet
pnpm build

# Créer le package
pnpm app:dist

echo ""
echo "📦 Installation de l'application..."

# Trouver et installer l'application
if [[ -d "dist_electron/mac" ]]; then
    APP_PATH=$(find dist_electron/mac -name "*.app" | head -n1)
    if [[ -n "$APP_PATH" ]]; then
        # Arrêter l'application si elle tourne
        pkill -f "DynaMouse" || true
        
        # Supprimer l'ancienne version
        rm -rf "/Applications/DynaMouse.app"
        
        # Installer la nouvelle version
        cp -R "$APP_PATH" "/Applications/"
        
        echo "✅ DynaMouse installé dans /Applications/"
    else
        echo "❌ Application non trouvée dans dist_electron/mac"
        exit 1
    fi
else
    echo "❌ Répertoire dist_electron/mac non trouvé"
    exit 1
fi

echo ""
echo "🎉 Installation terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Ouvrez les Préférences Système > Sécurité et confidentialité > Confidentialité"
echo "2. Ajoutez DynaMouse aux permissions 'Accessibilité' et 'Surveillance des entrées'"
echo "3. Pour les écrans ANMITE: installez les pilotes depuis le site officiel"
echo "4. Lancez DynaMouse depuis /Applications/"
echo ""

read -p "🚀 Voulez-vous lancer DynaMouse maintenant? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "/Applications/DynaMouse.app"
    echo "✅ DynaMouse lancé!"
fi

echo ""
echo "💡 Pour plus d'options, utilisez: ./scripts/deploy-macos.sh"