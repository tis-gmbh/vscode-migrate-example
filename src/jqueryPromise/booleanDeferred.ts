import { deferredGenerator } from "./deferredGenerator";

export function booleanDeferred(resolve: boolean): JQueryPromise<true> {
    return deferredGenerator(resolve).then(
        () => { return true as const; },
        () => { return false as const; }
    );
}

export function invertedBooleanDeferred(resolve: boolean): JQueryPromise<false> {
    return deferredGenerator(resolve).then(
        () => { return false as const; },
        () => { return true as const; }
    );
}
