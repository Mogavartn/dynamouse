import { Display } from 'electron';
import { Config } from './ConfigEngine';
import { PointerDevice, PointerEngine } from './PointerEngine';
import { DisplayEngine } from './DisplayEngine';
import { BaseObserver } from './BaseObserver';
import { screen } from 'electron';
import { moveMouse } from '@jitsi/robotjs';
import { Logger } from 'winston';

export interface AssignmentListener {
  willActivate: () => any;
  disposed: () => any;
}

export class Assignment extends BaseObserver<AssignmentListener> {
  position_x: number | null = null;
  position_y: number | null = null;
  activated: boolean;
  moved: boolean;
  listener: () => any;
  private currentListener: Partial<AssignmentListener> | null = null;

  constructor(
    protected device: PointerDevice,
    protected display: Display
  ) {
    super();
    this.activated = false;
    this.moved = false;
    this.listener = device.registerListener({
      moved: () => {
        if (!this.activated) {
          this.iterateListeners((cb) => cb.willActivate?.());
        }
      }
    });
  }

  protected getListener(): Partial<AssignmentListener> | null {
    return this.currentListener;
  }

  protected setListener(listener: Partial<AssignmentListener>): void {
    this.currentListener = listener;
  }

  async init() {
    return this.device.connect();
  }

  contains(px: number, py: number) {
    if (px == null || py == null) {
      return false;
    }
    const { x, y, width, height } = this.display.bounds;
    const insideHorizontal = px > x && px < x + width;
    const insideVertical = py > y && py < y + height;
    return insideHorizontal && insideVertical;
  }

  async deactivate() {
    this.activated = false;
    const point = screen.getCursorScreenPoint();
    this.position_x = point.x;
    this.position_y = point.y;
    return this.device.connect();
  }

  async activate(prev?: Assignment) {
    if (this.activated) {
      return;
    }
    const { x, y, width, height } = this.display.bounds;
    let pos_x = this.position_x;
    let pos_y = this.position_y;

    if (pos_x == null || pos_y == null) {
      pos_x = x + width / 2;
      pos_y = y + height / 2;
    }

    // previous device cursor was on this display, just use it
    if (prev && this.contains(prev.position_x || 0, prev.position_y || 0)) {
      pos_x = prev.position_x || 0;
      pos_y = prev.position_y || 0;
    }

    // this device cursor was on a different screen, use center
    else if (!this.contains(pos_x, pos_y)) {
      pos_x = x + width / 2;
      pos_y = y + height / 2;
    }

    moveMouse(pos_x, pos_y);
    this.activated = true;
    return this.device.disconnect();
  }

  async dispose() {
    this.listener();
    await this.device.disconnect();
    this.iterateListeners((cb) => cb.disposed?.());
  }
}

export interface RobotEngineOptions {
  pointerEngine: PointerEngine;
  displayEngine: DisplayEngine;
  logger: Logger;
}

export class RobotEngine {
  assignments: Assignment[];
  lock: boolean;

  protected logger: Logger;

  constructor(protected options: RobotEngineOptions) {
    this.assignments = [];
    this.lock = false;
    this.logger = options.logger.child({ namespace: 'ROBOT' });
  }

  async setupAssignments(config: Config) {
    this.logger.debug('Re-initializing');
    await Promise.all(this.assignments.map((a) => a.dispose()));
    this.assignments = [];
    for (let key in config.devices) {
      const device = this.options.pointerEngine.getDevice(key);
      if (!config.devices[key].display) {
        continue;
      }
      const display = this.options.displayEngine.getDisplay(config.devices[key].display);
      if (!display || !device) {
        continue;
      }
      let assignment = new Assignment(device, display);
      const listener = assignment.registerListener({
        willActivate: async () => {
          if (this.lock) {
            return;
          }
          this.logger.debug(`Activating: ${device.product}`);
          this.lock = true;
          const activated = this.assignments.find((a) => a.activated);
          await activated?.deactivate();
          await assignment.activate(activated);
          this.lock = false;
        },
        disposed: () => {
          listener?.();
        }
      });
      this.assignments.push(assignment);
    }

    await Promise.all(this.assignments.map((a) => a.init()));
  }
}
