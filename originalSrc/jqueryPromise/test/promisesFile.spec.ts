import { JSDOM } from "jsdom";
import { coveredFunction } from "../promisesFile";

const jsDom = new JSDOM();
const window = jsDom.window;
globalThis.$ = require("jquery")(window);

function preventBubbling<T>(originalPromise: JQueryPromise<T>): Promise<T | undefined> {
    return new Promise((res, rej) => originalPromise.then(res, rej));
}

describe("coveredFunction", () => {
    it("stays rejected even when modifying the rejection value", () => {
        return expect(preventBubbling(coveredFunction(false))).rejects.toEqual(false);
    });
});
