import { StandaloneDecoratorMetadata } from "../common/DecoratorMetadata";

export interface CacheConfigItem {
    cacheName: string;
    method: string;
    key?: string;
    allEntries?: boolean;
}

export interface ICacheConfigCache {
    cacheName: string;
    key?: string;
}

export interface ICacheConfigEvict {
    cacheName: string;
    key?: string;
    allEntries?: boolean;
}

export class CacheDecoratorMetadata extends StandaloneDecoratorMetadata<CacheDecoratorMetadata> {
    methods: Array<CacheConfigItem> = [];
}