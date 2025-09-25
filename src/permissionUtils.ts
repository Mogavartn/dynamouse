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
  // This is a placeholder for a more sophisticated silent check
  // For now, we'll assume permissions are not granted to be safe
  return { accessibility: false, inputMonitoring: false };
};