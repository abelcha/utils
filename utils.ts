// export 'lodash' as 
import _ from 'lodash'

export function sql(strings: TemplateStringsArray, ...keys: any[]) {
    return strings.reduce((acc, str, i) => {
        return acc + str + (keys[i] || '')
    }, '')
}

export const camelizeKeys = (obj: any) => {
    if (Array.isArray(obj)) {
        return obj.map(camelizeKeys)
    } else if (typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = _.camelCase(key)
            acc[camelKey] = camelizeKeys(obj[key])
            return acc
        }, {} as any)
    } else {
        return obj
    }
}
export const every = _.every
export const camelCase = _.camelCase
export const toLower = _.toLower
export const get = _.get
export const set = _.set
export const deburr = _.deburr
export const last = _.last
export const countBy = _.countBy
export const zipObject = _.zipObject
export const pickBy = _.pickBy

export default _;
