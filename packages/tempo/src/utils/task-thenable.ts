export type ThenableResult<T> = T | Promise<T>;

export class TaskThenable<T = any> {
  private _state: boolean = null;
  private _value: T | Promise<T> = null;
  private _isSync = true;
  private nextTasks: TaskThenable[] = [];
  private delegating = false;
  private deferreds = [];

  public then(onFulfilled: any, onRejected?: any): TaskThenable<T> {
    const nextTask = new TaskThenable((resolve, reject) => {
      this.handle({
        onFulfilled: onFulfilled,
        onRejected: onRejected,
        resolve: resolve,
        reject: reject,
      });
    }, this._isSync);
    this.nextTasks.push(nextTask);
    return nextTask;
  }

  public getResult(): T | Promise<T> {
    if (this._isSync) {
      if (this._state) {
        return this._value;
      } else {
        throw this._value;
      }
    } else {
      return new Promise((resolve1, reject1) => {
        this.handle({ resolve: resolve1, reject: reject1 });
      });
    }
  }

  public get state() {
    return this._state;
  }

  public get isSync() {
    return this._isSync;
  }

  public setAsync() {
    this._isSync = false;
    for (let i = 0, len = this.nextTasks.length; i < len; i++) {
      this.nextTasks[i].setAsync();
    }
  }

  private handle(deferred) {
    if (this._state === null) {
      this.deferreds.push(deferred);
      return;
    }
    const cb = this._state ? deferred.onFulfilled : deferred.onRejected;
    if (typeof cb !== "function") {
      (this._state ? deferred.resolve : deferred.reject)(this._value);
      return;
    }
    let ret;
    try {
      ret = cb(this._value);
    } catch (e) {
      deferred.reject(e);
      return;
    }
    deferred.resolve(ret);
  }

  constructor(fn, isSync = true) {
    if (!(this instanceof TaskThenable)) return new TaskThenable<T>(fn, isSync);
    if (typeof fn !== "function") throw new TypeError("not a function");
    this._isSync = isSync;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    function resolve(newValue) {
      if (self.delegating) return;
      resolve_(newValue);
    }

    function resolve_(newValue) {
      if (self._state !== null) return;
      try {
        //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self)
          throw new TypeError("A promise cannot be resolved with itself.");
        if (
          newValue &&
          (typeof newValue === "object" || typeof newValue === "function")
        ) {
          const then = newValue.then;
          if (typeof then === "function") {
            self.delegating = true;
            if (newValue instanceof Promise) {
              self.setAsync();
              self._value = newValue;
            }
            then.call(newValue, resolve_, reject_);
            return;
          }
        }
        self._state = true;
        self._value = newValue;
        finale();
      } catch (e) {
        reject_(e);
      }
    }

    function reject(newValue) {
      if (self.delegating) return;
      reject_(newValue);
    }

    function reject_(newValue) {
      if (self._state !== null) return;
      self._state = false;
      self._value = newValue;
      finale();
    }

    function finale() {
      for (let i = 0, len = self.deferreds.length; i < len; i++) {
        self.handle(self.deferreds[i]);
      }
      self.deferreds = null;
    }

    try {
      fn(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  static all(arr) {
    // TODO: this polyfill only supports array-likes
    //       it should support all iterables
    const args = Array.prototype.slice.call(arr);

    let isPreTaskSync = true;
    for (let i = 0; i < args.length; i++) {
      const t = args[i];
      if (t instanceof TaskThenable && !t.isSync) {
        isPreTaskSync = false;
        break;
      }
    }

    return new TaskThenable(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      let remaining = args.length;

      function res(i, val) {
        if (val && (typeof val === "object" || typeof val === "function")) {
          const then = val.then;
          if (typeof then === "function") {
            const p = new TaskThenable(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      }

      for (let i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    }, isPreTaskSync);
  }

  static resolve(value) {
    return new TaskThenable(function (resolve) {
      resolve(value);
    });
  }
}
