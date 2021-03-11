import { TaskThenable } from "../../src/utils/task-thenable";
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

  test("should catch an error, when reject an error value ", async () => {
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
          count++;
          total = total + 2;
          resolve(total);
        });
      })
      .then((value) => {
        count++;
        total = value + 3;
        return total;
      });
    const value = task.getResult();
    expect(value).toBeInstanceOf(Promise);
    expect(count).toBe(2);
    expect(total).toBe(3);

    const lastTotal = await task.getResult();
    expect(count).toBe(3);
    expect(total).toBe(6);
    expect(lastTotal).toBe(6);
  });
});
