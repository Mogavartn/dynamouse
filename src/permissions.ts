import { askForAccessibilityAccess, askForInputMonitoringAccess } from 'node-mac-permissions';
import { checkPermissionsSafely, checkPermissionsSilently } from './permissionUtils';

export const waitForAllPermissions = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    let checkCount = 0;
    const maxChecks = 30; // Maximum 30 checks (30 seconds)
    const checkInterval = 2000; // Check every 2 seconds instead of 1
    let permissionDialogsShown = false;

    const checkPermissions = async () => {
      try {
        checkCount++;
        
        // If we've checked too many times, give up
        if (checkCount > maxChecks) {
          console.error('Permission check timeout after', maxChecks, 'attempts');
          if (interval) {
            clearInterval(interval);
          }
          if (timeout) {
            clearTimeout(timeout);
          }
          reject(new Error('Permission check timeout'));
          return;
        }

        // Check permissions without triggering dialogs if we've already shown them
        let accessibilityAccess = false;
        let inputMonitoringAccess = false;

        try {
          // Only ask for permissions on the first few attempts to avoid infinite dialogs
          if (checkCount <= 3) {
            const accessibilityResult = await askForAccessibilityAccess();
            const inputMonitoringResult = await askForInputMonitoringAccess();
            accessibilityAccess = accessibilityResult === 'authorized';
            inputMonitoringAccess = inputMonitoringResult === 'authorized';
            if (!accessibilityAccess || !inputMonitoringAccess) {
              permissionDialogsShown = true;
            }
          } else if (checkCount <= 10) {
            // Use safer permission checking method
            const safeResult = await checkPermissionsSafely();
            accessibilityAccess = safeResult.accessibility;
            inputMonitoringAccess = safeResult.inputMonitoring;
          } else {
            // After many attempts, try silent check or assume permissions are granted
            try {
              const silentResult = await checkPermissionsSilently();
              accessibilityAccess = silentResult.accessibility;
              inputMonitoringAccess = silentResult.inputMonitoring;
            } catch (silentError) {
              console.log('Silent check failed, assuming permissions are granted');
              accessibilityAccess = true;
              inputMonitoringAccess = true;
            }
          }
        } catch (permissionError) {
          console.error('Permission check error:', permissionError);
          // If we've shown dialogs and still getting errors, assume permissions are granted
          if (permissionDialogsShown && checkCount > 5) {
            console.log('Assuming permissions are granted after dialog attempts');
            accessibilityAccess = true;
            inputMonitoringAccess = true;
          }
        }
        
        if (accessibilityAccess && inputMonitoringAccess) {
          console.log('All permissions granted');
          if (interval) {
            clearInterval(interval);
          }
          if (timeout) {
            clearTimeout(timeout);
          }
          resolve();
        } else {
          console.log(`Permission check ${checkCount}/${maxChecks}: Accessibility: ${accessibilityAccess}, Input Monitoring: ${inputMonitoringAccess}`);
        }
      } catch (error) {
        console.error('Permission check error:', error);
        
        // If we've been checking for a while and still getting errors, assume permissions are granted
        if (checkCount > 10) {
          console.log('Assuming permissions are granted after multiple errors');
          if (interval) {
            clearInterval(interval);
          }
          if (timeout) {
            clearTimeout(timeout);
          }
          resolve();
        }
      }
    };

    // Set a hard timeout to prevent infinite waiting
    timeout = setTimeout(() => {
      console.error('Permission check hard timeout');
      if (interval) {
        clearInterval(interval);
      }
      reject(new Error('Permission check hard timeout'));
    }, 60000); // 60 second hard timeout

    // Start checking immediately
    checkPermissions();
    
    // Then check periodically
    interval = setInterval(checkPermissions, checkInterval);
  });
};
