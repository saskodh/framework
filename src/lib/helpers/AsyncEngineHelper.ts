/** Validates the yielded value. Immediate exit if it's not a promise. */
var promiseSafe = function (p: IteratorResult<Promise<any>>) {
  if (p.done === false && ! (p.value instanceof Promise)) {
      // TODO: Improve error reporting => user should see which yield statement cause it
      var error = new Error('Yield should be used only with promises.');
      console.error(error);
      process.exit(1);
      return null;
  } else {
      return p;
  }
};

var rotateCrankshaft = function (g: Iterator<Promise<any>>, p: IteratorResult<Promise<any>>, resolve, reject) {
    if (p.done === false) {
        p.value.then((value) => {
            rotateCrankshaft(g, promiseSafe(g.next(value)), resolve, reject);
        }).catch((error) => {
            try {
                rotateCrankshaft(g, promiseSafe(g.throw(error)), resolve, reject);
            } catch (error) {
                // NOTE: Unhandled error
                reject(error);
            }
        });
    } else {
        resolve(p.value);
    }
};

var runEngine = function (g: Iterator<Promise<any>>, p: IteratorResult<Promise<any>>) {
    return new Promise (function (resolve, reject) {
        rotateCrankshaft(g, p, resolve, reject);
    });
};

export class AsyncEngineHelper {

    private static SAMPLE_GENERATOR = function * () {};

    static runAsync(handler: Iterator<Promise<any>>): Promise<any> {
        return runEngine(handler, promiseSafe(handler.next()));
    }

    static isAsyncMethod(method): boolean {
        return this.SAMPLE_GENERATOR.constructor === method.constructor;
    }
}