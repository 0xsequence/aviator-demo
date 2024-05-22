export class Signal{
    listeners = [];
    listen(listener) {
      this.listeners.push(listener);
    }
    oneTimeListeners = [];
    listenOnce(listener) {
      this.oneTimeListeners.push(listener);
    }
    emit(value) {
      for (const listener of this.listeners) {
        listener(value);
      }
      for (const listener of this.oneTimeListeners) {
        listener(value);
      }
      this.oneTimeListeners.length = 0;
    }
}