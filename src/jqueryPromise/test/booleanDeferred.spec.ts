import { JSDOM } from "jsdom";
import { booleanDeferred, invertedBooleanDeferred } from "../booleanDeferred";

const jsDom = new JSDOM();
const window = jsDom.window;
globalThis.$ = require("jquery")(window);

function preventBubbling<T>(originalPromise: JQueryPromise<T>): Promise<T | undefined> {
    return new Promise((res, rej) => originalPromise.then(res, rej));
}

describe("booleanDeferred", () => {
    it("stays rejected even when modifying the rejection value", () => {
        return expect(preventBubbling(booleanDeferred(false))).rejects.toEqual(false);
    });

    it("(inverted) stays rejected even when modifying the rejection value", () => {
        return expect(preventBubbling(invertedBooleanDeferred(false))).rejects.toEqual(true);
    });
});
