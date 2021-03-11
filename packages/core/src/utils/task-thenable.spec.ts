import { TaskThenable } from "./task-thenable";
// import Zone from 'zone.js'
// require('zone.js/dist/zone-node.js');
// import 'zone.js'
// require('zone.js')
// require('zone.js/dist/zone-node.js')

describe("sync-thenable", () => {
  test("should async ", async () => {
    let count = 0;
    let total = 0;
    const totalPromise = new Promise<any>((resolve, reject) => {
      count++;
      total = total + 1;
      resolve(total);
    }).then((value) => {
      count++;
      total = value + 2;
      return total;
    });

    expect(count).toBe(1);
    expect(total).toBe(1);

    expect(await totalPromise).toBe(3);
  });

  test("the value should return a plain value, when execute sync task", async () => {
    let count = 0;
    let total = 0;
    const task = new TaskThenable<any>((resolve, reject) => {
      count++;
      total = total + 1;
      resolve(total);
    }).then((value) => {
      count++;
      total = value + 2;
      return total;
    });

    expect(count).toBe(2);
    expect(total).toBe(3);
  });

  test("should get the sub sync task return value ", async () => {
    const task = new TaskThenable<any>((resolve, reject) => {
      resolve(
        new TaskThenable<any>((resolve1, reject1) => {
          resolve1("hello");
        })
      );
    });
    const msg = await task.getResult();
    expect(msg).toBe("hello");
  });

  test("should get the sub sync task return value 111", async () => {
    const task = new TaskThenable<any>((resolve, reject) => {
      resolve(
        new Promise((resolve1) => {
          setTimeout(() => {
            resolve1("hello");
          }, 10);
        })
      );
    });
    const msg = await task.getResult();
    expect(msg).toBe("hello");
  });

  test("should catch an error, when reject an error value, in sync task", async () => {
    const task = new TaskThenable<any>((resolve, reject) => {
      reject("error");
    }).then((value) => {
      return value;
    });
    let hasError = false;
    try {
      const value = task.getResult();
    } catch (e) {
      expect(e).toBe("error");
      hasError = true;
    }
    expect(hasError).toBe(true);
  });

  test("should catch an error, when an error occurred at the sub async task", async () => {
    const task = new TaskThenable<any>((resolve, reject) => {
      resolve(
        new TaskThenable((resolve1, reject1) => {
          resolve1(
            new Promise((resolve2, reject2) => {
              setTimeout(() => {
                reject2("error");
              }, 100);
            })
          );
        })
      );
    }).then((value) => {
      return value;
    });

    let hasError = false;
    try {
      const value = await task.getResult();
    } catch (e) {
      expect(e).toBe("error");
      hasError = true;
    }
    expect(hasError).toBe(true);
  });

  test("should catch an error, when throw an error in executor", async () => {
    let expectErr: any = null;
    const task = new TaskThenable<any>((resolve, reject) => {
      throw new Error("err");
    }).then(
      (value) => {
        Promise.reject("should not be here");
      },
      (err) => {
        expectErr = err;
      }
    );

    expect(expectErr).not.toBe(null);
    expect(expectErr?.message).toBe("err");
  });

  test("should catch an error, when reject an error value in Promise", async () => {
    const task = new TaskThenable<any>((resolve, reject) => {
      resolve("success");
    }).then((value) => {
      return Promise.reject("error");
    });

    let hasError = false;
    try {
      const value = await task.getResult();
    } catch (e) {
      expect(e).toBe("error");
      hasError = true;
    }
    expect(hasError).toBe(true);
  });

  test("the value should return a promise object, when execute async task", async () => {
    let count = 0;
    let total = 0;

    const task = new TaskThenable<any>((resolve, reject) => {
      count++;
      total = total + 1;
      resolve(total);
    })
      .then((value) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            count++;
            total = value + 2;
            resolve(total);
          }, 10);
        });
      })
      .then((value: any) => {
        count++;
        total = value + 3;
        return total;
      });
    expect(task.isSync).toBeFalsy();
    const value = task.getResult();
    expect(value).toBeInstanceOf(Promise);
    expect(count).toBe(1);
    expect(total).toBe(1);

    const lastTotal = await task.getResult();
    expect(count).toBe(3);
    expect(total).toBe(6);
    expect(lastTotal).toBe(6);
  });

  test("the task should changed as async, then sub task return a promise", async () => {
    let count = 0;

    const task = new TaskThenable<any>((resolve, reject) => {
      const subTask = new Promise((resolve, reject) => {
        setTimeout(() => {
          count++;
        }, 10);
      });
      resolve(subTask);
    });
    expect(task.isSync).toBeFalsy();
    const value = task.getResult();
    expect(value).toBeInstanceOf(Promise);
  });

  test("the task should changed as async, then embed sub task is async", async () => {
    let count = 0;
    let total = 0;

    const task = new TaskThenable<any>((resolve, reject) => {
      count++;
      total = total + 1;
      resolve(total);
    }).then((value) => {
      return new TaskThenable((resolve, reject) => {
        const embedTask = new Promise((resolve, reject) => {
          setTimeout(() => {
            count++;
            total = value + 2;
            resolve(total);
          }, 10);
        });
        resolve(embedTask);
      });
    });

    expect(task.isSync).toBeFalsy();
    const value = task.getResult();
    expect(value).toBeInstanceOf(Promise);
    expect(count).toBe(1);
    expect(total).toBe(1);

    const lastTotal = await value;
    expect(count).toBe(2);
    expect(total).toBe(3);
    expect(lastTotal).toBe(3);
  });
});
