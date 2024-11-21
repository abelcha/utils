
// @ts-ignore-next-line
import stringify from 'json-stringify-safe';
import get from 'lodash/get'
import isString from 'lodash/isString'

// cacheMap maps every function to a map with caches
const cacheMap = new Map<
  (...args: any) => any,
  {
    functionCacheMap: Map<string, CacheObject>;
    resolver?: (...args: any[]) => string | number;
  }
>();
// instanceMap maps every instance to a unique id
// const instanceMap = new Map<PropertyDescriptor, number>();
// let instanceIdCounter = 1;

export interface Config {
  resolver?: (...args: any[]) => string | number;
  ok?: string;
}

interface CacheObject {
  result: any;
  timeout: number;
}

export function cache(
  config: Config = {}
): (
  target: object,
  propertyName: string,
  propertyDescriptor: PropertyDescriptor
) => PropertyDescriptor {
  return function (
    target: object,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const prop = propertyDescriptor.value ? "value" : "get";

    const originalFunction = propertyDescriptor[prop];

    // functionCacheMap maps every instance plus arguments to a CacheObject
    const functionCacheMap = new Map<string, CacheObject>();
    // console.log('INININNIT', { prop })
    propertyDescriptor[prop] = async function (...args: any[]) {
      // console.log('PROP DES', { args, propertyDescriptor, target, propertyName })
      // let instanceId = instanceMap.get(this);

      // if (!instanceId) {
      //   instanceId = ++instanceIdCounter;
      //   instanceMap.set(this, instanceId);
      // }

      const key = config.resolver
        ? config.resolver.apply(this, args)
        : (isString(args[0]) ? args[0] : stringify(args));

      const cacheKey = `${propertyName}:${key}`;

      // const cachedValue = await this.store.get(cacheKey);
      // if (cachedValue) {
      //   // console.log('CACHED', cachedValue)
      //   const rtn = JSON.parse(cachedValue)
      //   Object.defineProperty(rtn, '__cache', { value: true, enumerable: false, writable: false });
      //   return rtn
      // }
      const newResult = await originalFunction.apply(this, args);
      const okVal = config.ok ? get(newResult, config.ok) : true
      // console.log({ config, okVal })
      if (okVal) {
        this.store.put(cacheKey, stringify(newResult))
      }
      // console.log('LIVE')
      return newResult;
    };

    cacheMap.set(propertyDescriptor[prop], {
      functionCacheMap,
      resolver: config.resolver,
    });

    return propertyDescriptor;
  };
}

// // Clear all caches for a specific function for all instances
// export function clearFunction(fn: (...args: any) => any) {
//   const functionCache = cacheMap.get(fn);

//   if (functionCache) {
//     functionCache.functionCacheMap.clear();
//   }
// }

// // Clear the cache for an instance and for specific arguments
// export function clear(
//   instance: object,
//   fn: (...args: any) => any,
//   ...args: any[]
// ) {
//   const functionCache = cacheMap.get(fn);
//   const instanceId = instanceMap.get(instance);
//   if (!functionCache || !instanceId) {
//     return;
//   }

//   const key = functionCache.resolver
//     ? functionCache.resolver.apply(instance, args)
//     : stringify(args);

//   const cacheKey = `${instanceId}:${key}`;

//   functionCache.functionCacheMap.delete(cacheKey);
// }
