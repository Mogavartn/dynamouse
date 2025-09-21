import { askForAccessibilityAccess, askForInputMonitoringAccess } from 'node-mac-permissions';

export const waitForAllPermissions = async (): Promise<void> => {
  return new Promise((resolve) => {
    let interval: NodeJS.Timeout;

    const checkPermissions = async () => {
      try {
        const accessibilityAccess = await askForAccessibilityAccess();
        const inputMonitoringAccess = await askForInputMonitoringAccess();
        
        if (accessibilityAccess && inputMonitoringAccess) {
          if (interval) {
            clearInterval(interval);
          }
          resolve();
        }
      } catch (error) {
        // Continue checking if there's an error
        console.error('Permission check error:', error);
      }
    };

    checkPermissions();
    interval = setInterval(checkPermissions, 1000);
  });
};
