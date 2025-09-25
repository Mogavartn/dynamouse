import { BaseObserver } from './BaseObserver';
import { Logger } from 'winston';
import { screen } from 'electron';

export interface TouchscreenDevice {
  id: string;
  name: string;
  vendor: string;
  product: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isAnmite: boolean;
  isActive: boolean;
}

export interface TouchscreenListener {
  deviceAdded: (device: TouchscreenDevice) => void;
  deviceRemoved: (device: TouchscreenDevice) => void;
  touchDetected: (device: TouchscreenDevice, x: number, y: number) => void;
}

export interface TouchscreenEngineOptions {
  logger: Logger;
}

export class TouchscreenEngine extends BaseObserver<TouchscreenListener> {
  private devices: Map<string, TouchscreenDevice> = new Map();
  private logger: Logger;
  private isMonitoring: boolean = false;
  private currentListener: Partial<TouchscreenListener> | null = null;

  constructor(protected options: TouchscreenEngineOptions) {
    super();
    this.logger = options.logger.child({ namespace: 'TOUCHSCREEN' });
  }

  protected getListener(): Partial<TouchscreenListener> | null {
    return this.currentListener;
  }

  protected setListener(listener: Partial<TouchscreenListener>): void {
    this.currentListener = listener;
  }

  init() {
    this.logger.info('Initializing Touchscreen Engine');
    this.detectTouchscreenDevices();
    this.startMonitoring();
  }

  private detectTouchscreenDevices() {
    const displays = screen.getAllDisplays();
    
    // Clear existing devices first
    this.devices.clear();
    
    displays.forEach((display, index) => {
      // Only create touchscreen devices for displays that are actually touchscreens
      const isAnmite = this.isAnmiteDevice(display);
      const isTouchscreen = this.isTouchscreenDevice(display);
      
      // Only add if it's actually a touchscreen or ANMITE device
      if (isAnmite || isTouchscreen) {
        const deviceId = `touchscreen_${display.id}`;
        
        const touchscreenDevice: TouchscreenDevice = {
          id: deviceId,
          name: isAnmite ? `ANMITE Touchscreen ${index + 1}` : `Touchscreen ${index + 1}`,
          vendor: isAnmite ? 'ANMITE' : 'Generic',
          product: isAnmite ? 'ANMITE Touch Display' : 'Touch Display',
          bounds: display.bounds,
          isAnmite,
          isActive: true
        };

        this.devices.set(deviceId, touchscreenDevice);
        this.logger.info(`Detected touchscreen: ${touchscreenDevice.name}`, {
          bounds: touchscreenDevice.bounds,
          isAnmite,
          displayId: display.id
        });

        this.iterateListeners((cb) => cb.deviceAdded?.(touchscreenDevice));
      } else {
        this.logger.debug(`Skipping non-touchscreen display: ${display.label}`);
      }
    });
  }

  private isAnmiteDevice(display: any): boolean {
    // Détection spécifique pour les écrans ANMITE
    // Les écrans ANMITE ont souvent des caractéristiques spécifiques
    const displayInfo = display.toString();
    
    // Vérification des marqueurs typiques des écrans ANMITE
    const anmiteIndicators = [
      'ANMITE',
      'anmite',
      'Touch',
      'TOUCH'
    ];

    return anmiteIndicators.some(indicator => 
      displayInfo.includes(indicator) || 
      display.label?.includes(indicator)
    );
  }

  private isTouchscreenDevice(display: any): boolean {
    // Détection générale des écrans tactiles
    // Vérifier si l'écran a des capacités tactiles
    const displayInfo = display.toString();
    const label = display.label || '';
    
    // Marqueurs génériques pour les écrans tactiles
    const touchscreenIndicators = [
      'touch',
      'Touch',
      'TOUCH',
      'Touchscreen',
      'Touch Screen',
      'Multi-touch',
      'Capacitive',
      'Resistive'
    ];

    // Vérifier dans les informations d'affichage et le label
    const hasTouchscreenIndicators = touchscreenIndicators.some(indicator => 
      displayInfo.toLowerCase().includes(indicator.toLowerCase()) || 
      label.toLowerCase().includes(indicator.toLowerCase())
    );

    // Vérifier si c'est un écran externe (pas l'écran intégré du Mac)
    const isExternalDisplay = display.bounds.x !== 0 || display.bounds.y !== 0;
    
    // Pour macOS Sonoma, on peut aussi vérifier les propriétés spécifiques
    const hasTouchCapabilities = display.touchSupport === 'available' || 
                                display.touchSupport === 'unknown';

    return hasTouchscreenIndicators || (isExternalDisplay && hasTouchCapabilities);
  }

  private startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting touchscreen monitoring');

    // Écoute des changements d'affichage
    screen.on('display-added', () => {
      this.logger.info('Display added, re-detecting touchscreens');
      this.detectTouchscreenDevices();
    });

    screen.on('display-removed', () => {
      this.logger.info('Display removed, re-detecting touchscreens');
      this.detectTouchscreenDevices();
    });

    // Simulation de détection tactile (à adapter selon les besoins réels)
    this.simulateTouchDetection();
  }

  private simulateTouchDetection() {
    // Cette méthode simule la détection tactile
    // Dans une implémentation réelle, cela nécessiterait des drivers spécifiques
    // ou des APIs système pour détecter les événements tactiles
    
    // Pour macOS Sonoma, nous devons utiliser des méthodes plus avancées
    // pour détecter les événements tactiles réels
    this.setupRealTouchDetection();
  }

  private setupRealTouchDetection() {
    // Configuration pour la détection tactile réelle sur macOS Sonoma
    // Utilisation des APIs système pour détecter les événements tactiles
    
    // Écoute des événements de souris sur les écrans tactiles
    // Cela peut capturer les événements tactiles convertis en événements de souris
    const { screen } = require('electron');
    
    // Pour les écrans ANMITE, nous pouvons utiliser des méthodes spécifiques
    this.devices.forEach((device) => {
      if (device.isAnmite && device.isActive) {
        this.logger.info(`Setting up ANMITE touch detection for ${device.name}`);
        this.setupAnmiteTouchDetection(device);
      }
    });
  }

  private setupAnmiteTouchDetection(device: TouchscreenDevice) {
    // Configuration spécifique pour la détection tactile ANMITE
    // Les écrans ANMITE peuvent nécessiter des drivers ou APIs spécifiques
    
    // Pour l'instant, nous utilisons une approche basée sur les événements de souris
    // qui peuvent être générés par les écrans tactiles
    const { screen } = require('electron');
    
    // Écoute des changements de position de la souris dans la zone de l'écran ANMITE
    const checkMousePosition = () => {
      const cursorPoint = screen.getCursorScreenPoint();
      const { x, y, width, height } = device.bounds;
      
      // Vérifier si le curseur est dans la zone de l'écran ANMITE
      if (cursorPoint.x >= x && cursorPoint.x <= x + width &&
          cursorPoint.y >= y && cursorPoint.y <= y + height) {
        
        // Convertir les coordonnées globales en coordonnées locales de l'écran
        const localX = cursorPoint.x - x;
        const localY = cursorPoint.y - y;
        
        this.logger.debug(`ANMITE touch detected at (${localX}, ${localY})`);
        this.iterateListeners((cb) => cb.touchDetected?.(device, localX, localY));
      }
    };
    
    // Vérifier périodiquement la position de la souris
    setInterval(checkMousePosition, 100); // Vérifier toutes les 100ms
  }

  getDevices(): TouchscreenDevice[] {
    return Array.from(this.devices.values());
  }

  getAnmiteDevices(): TouchscreenDevice[] {
    return this.getDevices().filter(device => device.isAnmite);
  }

  getDevice(id: string): TouchscreenDevice | undefined {
    return this.devices.get(id);
  }

  setDeviceActive(id: string, active: boolean): boolean {
    const device = this.devices.get(id);
    if (device) {
      device.isActive = active;
      this.logger.info(`Touchscreen ${device.name} ${active ? 'activated' : 'deactivated'}`);
      return true;
    }
    return false;
  }

  dispose() {
    this.isMonitoring = false;
    this.devices.clear();
    this.logger.info('Touchscreen Engine disposed');
  }
}