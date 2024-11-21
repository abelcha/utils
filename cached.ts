// JSON BIGINT ISSUEE:
BigInt.prototype.toJSON = function () {
  return this.toString()
}
import { cyrb64Hash } from "./hash"
import { SqliteStore } from "./bun-sqlite-cache"
import { RamCacheStore } from "./cache-store"

const runtimeStores = {

}
const ensureFnStore = (key: string) => {
  if (!runtimeStores[key]) {
    runtimeStores[key] = new SqliteStore({
      database: `/tmp/cache-fn-store-${key}.sqlite`,
      defaultTtlMs: 1000 * 60 * 60 * 24 * 7,
    })
  }
  return runtimeStores[key] as SqliteStore
}

export const nocached = (fn: Function) => {
  return fn
}
export const cached = (fn: Function) => {
  const sfn = fn.toString()
  const hashedFN = cyrb64Hash(sfn)
  return async (...params) => {
  const skey = JSON.stringify(params)
  const hashedKey = cyrb64Hash(skey)
    // const cacheFile = Bun.file(`/tmp/${hashedFN}:${hashedKey}.json`)
    const cacheStore = ensureFnStore(hashedFN)
    const val = cacheStore.get(hashedKey)
    if (val) {
      return val.response
    }
    const response = await fn(...params)
    // console.log('writing to ', cacheFile)
    cacheStore.put(hashedKey, { sfn, response })

    return response
  }
}

export const cachedSync = (fn: Function) => {
  const sfn = fn.toString()
  const hashedFN = cyrb64Hash(sfn)
  const cacheStore = ensureFnStore(hashedFN)
  return (...params) => {
    const skey = JSON.stringify(params)
    const hashedKey = cyrb64Hash(skey)
    // const cacheFile = Bun.file(`/tmp/${hashedFN}:${hashedKey}.json`)
    const val = cacheStore.get(hashedKey)
    if (val) {
      return val.response
    }
    const response = fn(...params)
    // console.log('writing to ', cacheFile)
    cacheStore.put(hashedKey, { sfn, skey, response })

    return response
  }
}

export const cachedLocalStore = (fn: Function) => {
  const sfn = fn.toString()
  const hashedFN = cyrb64Hash(sfn)
  const cacheStore = new RamCacheStore({ path: '/tmp/ram-cache-store/', filename: hashedFN })
  const skey = ""
  return (...params) => {
    const hashedKey = cyrb64Hash(skey)
    // const cacheFile = Bun.file(`/tmp/${hashedFN}:${hashedKey}.json`)
    const val = cacheStore.get(hashedKey)
    if (val) {
      return val.response
    }
    const response = fn(...params)
    // console.log('writing to ', cacheFile)
    cacheStore.put(hashedKey, { sfn, response })

    return response
  }
}




// export const cachedNMap = (fn: Function) => {
//   const sfn = fn.toString()
//   const hashedFN = cyrb64Hash(sfn)
//   const cacheStore = new RamCacheStore({ path: '/tmp/ram-cache-store/', filename: hashedFN })
//   return (...params) => {
//     const skey = JSON.stringify(params)
//     const hashedKey = cyrb64Hash(skey)
//     // const cacheFile = Bun.file(`/tmp/${hashedFN}:${hashedKey}.json`)
//     const val = cacheStore.get(hashedKey)
//     if (val) {
//       return val.response
//     }
//     const response = fn(...params)
//     // console.log('writing to ', cacheFile)
//     cacheStore.put(hashedKey, { sfn, skey, response })

//     return response
//   }
// } 
