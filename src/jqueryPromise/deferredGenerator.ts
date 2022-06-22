export function deferredGenerator(resolve: boolean): JQueryDeferred<void> {
    if (resolve) {
        return $.Deferred<void>().resolve();
    }
    return $.Deferred<void>().reject();
}
