# Corrections pour macOS Sonoma - Dynamouse

Ce document décrit les corrections apportées à Dynamouse pour résoudre les problèmes rencontrés avec macOS Sonoma.

## Problèmes identifiés et corrigés

### 1. Détection des écrans tactiles (doublons)

**Problème** : Affichage de 2 Touchscreen alors qu'il n'y en a qu'un seul.

**Solution** :
- Amélioration de la méthode `detectTouchscreenDevices()` dans `TouchscreenEngine.ts`
- Ajout d'une méthode `isTouchscreenDevice()` pour distinguer les vrais écrans tactiles des écrans normaux
- Utilisation de l'ID d'affichage unique (`display.id`) au lieu de l'index pour éviter les doublons
- Nettoyage des périphériques existants avant la détection

### 2. Contrôle d'ANMITE par son écran tactile

**Problème** : Rien ne se passe quand on demande à ANMITE d'être contrôlé par son touchscreen.

**Solution** :
- Amélioration de la détection spécifique des écrans ANMITE
- Ajout d'une méthode `setupAnmiteTouchDetection()` pour gérer les événements tactiles ANMITE
- Implémentation d'une détection basée sur la position de la souris dans la zone ANMITE
- Ajout d'options de contrôle spécifiques dans le menu contextuel

### 3. Contrôle du trackpad pour l'écran intégré

**Problème** : Le trackpad ne contrôle pas l'écran intégré.

**Solution** :
- Ajout d'une option "Trackpad (Built-in)" dans le menu des assignements
- Détection automatique de l'écran intégré (bounds.x = 0 et bounds.y = 0)
- Implémentation d'une assignation virtuelle pour le trackpad dans `RobotEngine.ts`

### 4. Permissions Dynamouse

**Problème** : Dynamouse a accès aux préférences mais ne fonctionne pas correctement.

**Solution** :
- Amélioration de la gestion des permissions pour macOS Sonoma
- Ajout de méthodes de vérification silencieuse des permissions
- Utilisation de SQLite pour vérifier les permissions dans la base de données TCC
- Méthodes de fallback pour les cas où SQLite n'est pas disponible

## Nouvelles fonctionnalités

### Menu contextuel amélioré

1. **Section Touchscreen** :
   - Affichage des écrans tactiles détectés
   - Option pour activer/désactiver chaque écran tactile
   - Informations détaillées (vendor, product, résolution)
   - Détection spéciale des écrans ANMITE

2. **Section Assignements** :
   - Option "Trackpad (Built-in)" pour contrôler l'écran intégré
   - Assignations spécifiques pour les périphériques ANMITE
   - Interface améliorée pour la configuration des périphériques

### Détection intelligente des écrans tactiles

- Distinction entre écrans normaux et écrans tactiles
- Détection spécifique des écrans ANMITE
- Vérification des capacités tactiles via les APIs système
- Gestion des écrans externes vs intégrés

## Utilisation

### Pour contrôler ANMITE avec son écran tactile :

1. Ouvrir le menu contextuel de Dynamouse
2. Aller dans la section "Touchscreen"
3. Sélectionner l'écran ANMITE détecté
4. Cocher "Control with Touchscreen"

### Pour contrôler l'écran intégré avec le trackpad :

1. Ouvrir le menu contextuel de Dynamouse
2. Aller dans la section "Trackpad (Built-in)"
3. Cocher "Control [nom de l'écran intégré]"

### Vérification des permissions :

Les permissions sont automatiquement vérifiées au démarrage. Si des problèmes persistent :

1. Aller dans Préférences Système > Sécurité et confidentialité
2. Vérifier que Dynamouse a les permissions :
   - Accessibilité
   - Monitoring d'entrée
3. Redémarrer Dynamouse si nécessaire

## Notes techniques

- Les corrections sont compatibles avec macOS Sonoma
- Amélioration de la stabilité de la détection des périphériques
- Meilleure gestion des événements tactiles
- Optimisation des performances de détection

## Dépannage

Si les problèmes persistent :

1. Vérifier que Dynamouse a les permissions nécessaires
2. Redémarrer l'application
3. Vérifier que les écrans tactiles sont correctement connectés
4. Consulter les logs pour plus d'informations (option Debug > File Logging)