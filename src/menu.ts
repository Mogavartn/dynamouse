import { Menu, MenuItem, Tray } from 'electron';
import { DisplayEngine } from './DisplayEngine';
import { PointerEngine } from './PointerEngine';
import { ConfigEngine } from './ConfigEngine';
import { TouchscreenEngine } from './TouchscreenEngine';
import AutoLaunch from 'auto-launch';

export interface BuildMenuOptions {
  autolauncher: AutoLaunch;
  pointerEngine: PointerEngine;
  displayEngine: DisplayEngine;
  configEngine: ConfigEngine;
  touchscreenEngine: TouchscreenEngine;
  rebuildMenu: () => any;
  quit: () => any;
  tray: Tray;
}

export const buildLoadingMenu = (options: { tray: Tray; message?: string }) => {
  const { tray, message } = options;
  const menu = new Menu();
  menu.append(
    new MenuItem({
      type: 'normal',
      label: message || 'loading...'
    })
  );
  tray.setContextMenu(menu);
  return menu;
};

export const buildMenu = async (options: BuildMenuOptions) => {
  const { tray } = options;
  const menu = new Menu();

  // assignments
  buildAssignmentMenus(options).forEach((m) => {
    menu.append(m);
  });

  // touchscreen assignments
  buildTouchscreenMenus(options).forEach((m) => {
    menu.append(m);
  });

  // eveything else
  menu.append(new MenuItem({ type: 'separator' }));
  menu.append(await buildStartupMenu(options));
  menu.append(buildDebugMenu(options));
  menu.append(new MenuItem({ type: 'separator' }));
  menu.append(
    new MenuItem({
      label: 'Quit',
      click: async () => {
        options.quit();
      }
    })
  );

  tray.setContextMenu(menu);

  return menu;
};

export const buildDebugMenu = (options: BuildMenuOptions) => {
  const { configEngine } = options;
  const menu = new Menu();

  menu.append(
    new MenuItem({
      label: 'File Logging',
      type: 'checkbox',
      checked: !!configEngine.config.logFile,
      click: () => {
        configEngine.update({
          logFile: !configEngine.config.logFile
        });
      }
    })
  );

  return new MenuItem({
    label: 'Debug',
    submenu: menu
  });
};

export const buildAssignmentMenus = (options: BuildMenuOptions) => {
  const { pointerEngine, displayEngine, configEngine, tray } = options;
  const devices = pointerEngine.getDevices();
  
  // Ajouter une option spéciale pour le trackpad intégré
  const trackpadMenuItem = new MenuItem({
    label: 'Trackpad (Built-in)',
    submenu: (() => {
      const submenu = new Menu();
      
      // Trouver l'écran intégré (généralement celui avec bounds.x = 0 et bounds.y = 0)
      const builtInDisplay = displayEngine.displays.find(display => 
        display.bounds.x === 0 && display.bounds.y === 0
      );
      
      if (builtInDisplay) {
        submenu.append(
          new MenuItem({
            label: `Control ${builtInDisplay.label}`,
            type: 'checkbox',
            checked: configEngine.config.devices?.['Trackpad']?.display === builtInDisplay.label,
            click: () => {
              const currentConfig = configEngine.config.devices?.['Trackpad'];
              const newDisplay = currentConfig?.display === builtInDisplay.label ? null : builtInDisplay.label;
              
              configEngine.update({
                devices: {
                  ...configEngine.config.devices,
                  'Trackpad': { display: newDisplay }
                }
              });
            }
          })
        );
      }
      
      submenu.append(new MenuItem({ type: 'separator' }));
      submenu.append(
        new MenuItem({
          label: 'None (uncontrolled)',
          type: 'checkbox',
          checked: configEngine.config.devices?.['Trackpad']?.display == null,
          click: () => {
            configEngine.update({
              devices: {
                ...configEngine.config.devices,
                'Trackpad': { display: null }
              }
            });
          }
        })
      );
      
      return submenu;
    })()
  });
  
  const deviceMenus = devices.map((device) => {
    const submenu = new Menu();
    const deviceProduct = device.product || 'Unknown Device';
    
    displayEngine.displays.forEach((display) => {
      submenu.append(
        new MenuItem({
          label: display.label,
          type: 'radio',
          checked: configEngine.config.devices?.[deviceProduct]?.display === display.label,
          click: () => {
            configEngine.update({
              devices: {
                ...configEngine.config.devices,
                [deviceProduct]: { display: display.label }
              }
            });
          }
        })
      );
    });
    submenu.append(new MenuItem({ type: 'separator' }));
    submenu.append(
      new MenuItem({
        type: 'radio',
        label: 'None (uncontrolled)',
        checked: configEngine.config.devices?.[deviceProduct]?.display == null,
        click: () => {
          configEngine.update({
            devices: {
              ...configEngine.config.devices,
              [deviceProduct]: { display: null }
            }
          });
        }
      })
    );

    return new MenuItem({ label: deviceProduct, submenu: submenu });
  });
  
  // Retourner le menu trackpad en premier, puis les autres périphériques
  return [trackpadMenuItem, ...deviceMenus];
};

export const buildTouchscreenMenus = (options: BuildMenuOptions) => {
  const { touchscreenEngine, configEngine, pointerEngine, displayEngine } = options;
  const touchscreenDevices = touchscreenEngine.getDevices();
  
  if (touchscreenDevices.length === 0) {
    return [];
  }

  return touchscreenDevices.map((device) => {
    const submenu = new Menu();
    
    // Option pour activer/désactiver l'écran tactile
    submenu.append(
      new MenuItem({
        label: 'Active',
        type: 'checkbox',
        checked: device.isActive,
        click: () => {
          touchscreenEngine.setDeviceActive(device.id, !device.isActive);
          options.rebuildMenu();
        }
      })
    );
    
    submenu.append(new MenuItem({ type: 'separator' }));
    
    // Options de contrôle spécifiques pour ANMITE
    if (device.isAnmite) {
      submenu.append(
        new MenuItem({
          label: 'Control with Touchscreen',
          type: 'checkbox',
          checked: configEngine.config.devices?.[`ANMITE_${device.id}`]?.display === device.name,
          click: () => {
            const currentConfig = configEngine.config.devices?.[`ANMITE_${device.id}`];
            const newDisplay = currentConfig?.display === device.name ? null : device.name;
            
            configEngine.update({
              devices: {
                ...configEngine.config.devices,
                [`ANMITE_${device.id}`]: { display: newDisplay }
              }
            });
            options.rebuildMenu();
          }
        })
      );
      
      submenu.append(new MenuItem({ type: 'separator' }));
    }
    
    // Information sur l'écran tactile
    submenu.append(
      new MenuItem({
        label: `Vendor: ${device.vendor}`,
        enabled: false
      })
    );
    
    submenu.append(
      new MenuItem({
        label: `Product: ${device.product}`,
        enabled: false
      })
    );
    
    submenu.append(
      new MenuItem({
        label: `Resolution: ${device.bounds.width}x${device.bounds.height}`,
        enabled: false
      })
    );
    
    if (device.isAnmite) {
      submenu.append(new MenuItem({ type: 'separator' }));
      submenu.append(
        new MenuItem({
          label: 'ANMITE Touchscreen Detected',
          enabled: false
        })
      );
    }

    return new MenuItem({ 
      label: `${device.name}${device.isAnmite ? ' (ANMITE)' : ''}`, 
      submenu: submenu 
    });
  });
};

export const buildStartupMenu = async (options: {
  autolauncher: AutoLaunch;
  rebuildMenu: () => any;
  configEngine: ConfigEngine;
}) => {
  const { autolauncher, rebuildMenu, configEngine } = options;

  const autoLaunchEnabled = await autolauncher.isEnabled();
  const startupMenu = new Menu();
  startupMenu.append(
    new MenuItem({
      label: 'Enabled',
      type: 'checkbox',
      checked: autoLaunchEnabled,
      click: async () => {
        if (autoLaunchEnabled) {
          await autolauncher.disable();
        } else {
          await autolauncher.enable();
        }
        rebuildMenu();
      }
    })
  );
  startupMenu.append(new MenuItem({ type: 'separator' }));

  const currentDelay = configEngine.config.startupDelay || 0;
  let intervals = [0, 2, 5, 10];
  intervals.forEach((i) => {
    startupMenu.append(
      new MenuItem({
        label: `Startup delay ${i}s`,
        type: 'checkbox',
        checked: i == currentDelay,
        click: async () => {
          configEngine.update({
            startupDelay: i
          });
          rebuildMenu();
        }
      })
    );
  });

  return new MenuItem({
    label: 'Launch on startup',
    submenu: startupMenu
  });
};
