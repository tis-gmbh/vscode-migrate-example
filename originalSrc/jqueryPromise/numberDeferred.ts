import { deferredGenerator } from "./deferredGenerator";

export function uncoveredFunction(resolve: boolean): JQueryPromise<0> {
    return deferredGenerator(resolve).then(
        () => 0 as const,
        () => -1 as const
    );
}
