export const I_CACHE_PROVIDER_TOKEN = Symbol('i_cache_provider_token');
// TODO: add cacheName as first parameter
export interface ICacheProvider {
    get(key: string, cacheName: string): Promise<any>;
    set(key: string, value: any, cacheName: string): Promise<any>;
    flushdb(cacheName: string): Promise<any>;
    del(key: string, cacheName: string): Promise<any>;
}