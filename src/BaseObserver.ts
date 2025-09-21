import { v1 } from 'uuid';

export interface BaseObserverInterface<T> {
  registerListener(listener: Partial<T>): () => any;
  iterateListeners(cb: (listener: Partial<T>) => any): void;
}

export abstract class BaseObserver<T> {
  private listeners: Array<() => any> = [];

  iterateListeners(cb: (listener: Partial<T>) => any): void {
    this.listeners.forEach((unsubscribe) => {
      const listener = this.getListener();
      if (listener) {
        cb(listener);
      }
    });
  }

  registerListener(listener: Partial<T>): () => any {
    const unsubscribe = () => {
      const index = this.listeners.indexOf(unsubscribe);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
    this.listeners.push(unsubscribe);
    this.setListener(listener);
    return unsubscribe;
  }

  protected abstract getListener(): Partial<T> | null;
  protected abstract setListener(listener: Partial<T>): void;
}
