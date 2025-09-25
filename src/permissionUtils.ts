import { askForAccessibilityAccess, askForInputMonitoringAccess } from 'node-mac-permissions';

/**
 * Alternative permission checking method that avoids infinite loops on macOS Sonoma
 * This method uses a more conservative approach to permission checking
 */
export const checkPermissionsSafely = async (): Promise<{ accessibility: boolean; inputMonitoring: boolean }> => {
  let accessibility = false;
  let inputMonitoring = false;

  try {
    // Try to check permissions with a timeout
    const permissionPromise = Promise.all([
      askForAccessibilityAccess(),
      askForInputMonitoringAccess()
    ]);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Permission check timeout')), 5000);
    });

    const [accessibilityResult, inputMonitoringResult] = await Promise.race([
      permissionPromise,
      timeoutPromise
    ]);

    // Convert PermissionType to boolean
    accessibility = accessibilityResult === 'authorized';
    inputMonitoring = inputMonitoringResult === 'authorized';
  } catch (error) {
    console.error('Safe permission check failed:', error);
    // Return false for both permissions if check fails
    accessibility = false;
    inputMonitoring = false;
  }

  return { accessibility, inputMonitoring };
};

/**
 * Check if permissions are already granted without triggering system dialogs
 * This is a best-effort check that may not be 100% accurate on all macOS versions
 */
export const checkPermissionsSilently = async (): Promise<{ accessibility: boolean; inputMonitoring: boolean }> => {
  try {
    // Pour macOS Sonoma, nous pouvons utiliser des méthodes plus avancées
    // pour vérifier les permissions sans déclencher de dialogues
    
    // Vérification de l'accessibilité via les APIs système
    const accessibility = await checkAccessibilityPermissionSilently();
    
    // Vérification du monitoring d'entrée via les APIs système
    const inputMonitoring = await checkInputMonitoringPermissionSilently();
    
    return { accessibility, inputMonitoring };
  } catch (error) {
    console.error('Silent permission check failed:', error);
    // En cas d'erreur, assumer que les permissions ne sont pas accordées
    return { accessibility: false, inputMonitoring: false };
  }
};

/**
 * Vérification silencieuse de la permission d'accessibilité
 */
const checkAccessibilityPermissionSilently = async (): Promise<boolean> => {
  try {
    // Pour macOS Sonoma, nous pouvons utiliser des méthodes spécifiques
    // pour vérifier les permissions d'accessibilité
    
    // Méthode 1: Vérifier via les APIs système
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      // Utiliser sqlite3 pour vérifier les permissions dans la base de données système
      const { stdout } = await execAsync(
        'sqlite3 ~/Library/Application\\ Support/com.apple.TCC/TCC.db "SELECT auth_value FROM access WHERE service=\'kTCCServiceAccessibility\' AND client=\'projectstorm.dynamouse\';"'
      );
      
      // auth_value = 2 signifie autorisé
      return stdout.trim() === '2';
    } catch (sqliteError) {
      // Si sqlite3 n'est pas disponible ou échoue, utiliser une méthode alternative
      console.log('SQLite check failed, using alternative method');
      
      // Méthode alternative: vérifier via les APIs Electron
      const { app } = require('electron');
      if (app && app.isAccessibilitySupportEnabled) {
        return app.isAccessibilitySupportEnabled();
      }
      
      return false;
    }
  } catch (error) {
    console.error('Accessibility permission check failed:', error);
    return false;
  }
};

/**
 * Vérification silencieuse de la permission de monitoring d'entrée
 */
const checkInputMonitoringPermissionSilently = async (): Promise<boolean> => {
  try {
    // Pour macOS Sonoma, vérifier les permissions de monitoring d'entrée
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      // Vérifier les permissions de monitoring d'entrée
      const { stdout } = await execAsync(
        'sqlite3 ~/Library/Application\\ Support/com.apple.TCC/TCC.db "SELECT auth_value FROM access WHERE service=\'kTCCServiceInputMonitoring\' AND client=\'projectstorm.dynamouse\';"'
      );
      
      // auth_value = 2 signifie autorisé
      return stdout.trim() === '2';
    } catch (sqliteError) {
      console.log('Input monitoring SQLite check failed, using alternative method');
      
      // Méthode alternative: vérifier via les APIs système
      // Pour l'instant, retourner false par sécurité
      return false;
    }
  } catch (error) {
    console.error('Input monitoring permission check failed:', error);
    return false;
  }
};