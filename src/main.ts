import { app, nativeImage, Tray } from 'electron';
import * as path from 'path';
import { DisplayEngine } from './DisplayEngine';
import { PointerEngine } from './PointerEngine';
import { ConfigEngine } from './ConfigEngine';
import { RobotEngine } from './RobotEngine';
import { TouchscreenEngine } from './TouchscreenEngine';
import AutoLaunch from 'auto-launch';
import { createLogger, transports } from 'winston';
import { buildLoadingMenu, buildMenu } from './menu';
import { waitForAllPermissions } from './permissions';

require('source-map-support').install();

const autolauncher = new AutoLaunch({
  name: 'DynaMouse'
});

const icon_mac = nativeImage.createFromPath(path.join(__dirname, '../media/icon-mac.png'));

const logger = createLogger();

logger.add(new transports.Console({ level: 'debug' }));

const displayEngine = new DisplayEngine();
const pointerEngine = new PointerEngine({ logger });
const configEngine = new ConfigEngine({ logger });
const touchscreenEngine = new TouchscreenEngine({ logger });
const robotEngine = new RobotEngine({
  logger,
  displayEngine,
  pointerEngine
});

app.on('ready', async () => {
  const tray = new Tray(
    icon_mac.resize({
      width: 16,
      height: 16
    })
  );
  buildLoadingMenu({ tray });

  // need to get some permissions before we can continue
  try {
    await waitForAllPermissions();
  } catch (error) {
    console.error('Failed to get permissions:', error);
    // Continue anyway - user can manually grant permissions later
    console.log('Continuing without permissions - user may need to grant them manually');
  }

  // can hide the dock at this point as permissions checks might need to icon so users can switch to the dialog
  app.dock.hide();

  const setupMovement = () => {
    return robotEngine.setupAssignments(configEngine.config);
  };

  const dispose = async () => {
    logger.debug('Disposing app');
    await pointerEngine.dispose();
    await touchscreenEngine.dispose();
  };

  const buildMenuWrapped = () => {
    buildMenu({
      tray,
      quit: async () => {
        await dispose();
        app.exit(0);
      },
      displayEngine,
      pointerEngine,
      configEngine,
      touchscreenEngine,
      autolauncher,
      rebuildMenu: () => {
        buildMenuWrapped();
      }
    });
  };

  const init = () => {
    pointerEngine.init();
    displayEngine.init();
    touchscreenEngine.init();

    configEngine.registerListener({
      configChanged: ({ devices }) => {
        buildMenuWrapped();

        // if devices changed, then also setupMovementAgain
        if (devices) {
          setupMovement();
        }
      }
    });

    pointerEngine.registerListener({
      devicesChanged: () => {
        buildMenuWrapped();
        setupMovement();
      }
    });

    touchscreenEngine.registerListener({
      deviceAdded: (device) => {
        logger.info(`Touchscreen device added: ${device.name}`);
        buildMenuWrapped();
      },
      deviceRemoved: (device) => {
        logger.info(`Touchscreen device removed: ${device.name}`);
        buildMenuWrapped();
      },
      touchDetected: (device, x, y) => {
        logger.debug(`Touch detected on ${device.name} at (${x}, ${y})`);
        // Ici on pourrait ajouter une logique pour gérer les événements tactiles
        // Par exemple, activer automatiquement un périphérique de pointage associé
      }
    });

    buildMenuWrapped();
    setupMovement();
  };

  configEngine.init();

  // useful for debugging
  if (configEngine.config.logFile) {
    logger.add(new transports.File({ filename: 'combined.log', dirname: app.getPath('logs'), level: 'debug' }));
  }

  // add a startup delay
  const delay = (configEngine.config.startupDelay || 0) * 1_000;
  if (delay > 0) {
    buildLoadingMenu({ tray, message: `...waiting ${delay}ms (startup delay)` });
    setTimeout(init, delay);
  } else {
    // doing this outside of a setTimeout may help with node event loops for some cases :shrug:
    init();
  }
});
