export abstract class DecoratorMetadata<T> {

    abstract mergeMetadata(decoratorMetadata: T);
}

export abstract class StandaloneDecoratorMetadata<T> extends DecoratorMetadata<T> {

    mergeMetadata(decoratorMetadata: T) {
        // TBD
    }
}