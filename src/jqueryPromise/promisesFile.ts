export function coveredFunction(resolve: boolean): JQueryPromise<true> {
    return deferredGenerator(resolve).then(
        () => { return true as const; },
        () => { return false as const; }
    );
}

export function uncoveredFunction(resolve: boolean): JQueryPromise<0> {
    return deferredGenerator(resolve).then(
        () => 0 as const,
        () => -1 as const
    );
}

function deferredGenerator(resolve: boolean): JQueryDeferred<void> {
    if (resolve) {
        return $.Deferred<void>().resolve();
    }
    return $.Deferred<void>().reject();
}
