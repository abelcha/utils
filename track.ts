import { get, mapValues, set, toPairs } from 'lodash'
import { round, sumBy } from 'remeda'
import { fblue, fmagenta } from './clog'
import { unique } from 'moderndash'


export class LoopTimer {
    data: Record<string, { start: number, average: number, index: number }> = {}
    start(id) {
        if (!this.data[id]) {
            this.data[id] = {
                start: Bun.nanoseconds(),
                average: 0,
                index: 1,
            }
        } else {
            this.data[id].start = Bun.nanoseconds()
            this.data[id].index++
        }
    }
    end(id) {
        const { index, start, average } = this.data[id]
        const timerNs = Number(Bun.nanoseconds() - start)
        this.data[id].average += (timerNs - average) / index
    }
    dump() {
        const totalSpend = sumBy(Object.values(this.data), e => e.average * e.index / 1000000)
        const totalAvg = sumBy(Object.values(this.data), e => e.average)
        const formatSec = (sec: number) => fmagenta((sec).toFixed(2) + ' ms')
        const formatUq = (u: number) => fblue(u.toFixed(0) + ' µs');
        const mapped = mapValues(this.data, (e, k) => {
            let spent = e.average * e.index / 1000000
            const percent = ((spent / totalSpend) * 100).toFixed(2) + ' %'
            return {
                uavg: formatUq(e.average),
                percent,
                spentSec: formatSec(spent),
                index: e.index,
            }
        })
        mapped.total = {
            uavg: formatUq(totalAvg),
            percent: undefined,
            spentSec: formatSec(totalSpend),
            index: undefined
        }
        console.table(mapped)
    }
}



export class Tracker {
    public stats: { [key: string]: number } = {}
    track(key: string, value = 1) {
        const prev = get(this.stats, key) || 0
        set(this.stats, key, prev + value)
    }
    trackGroup(groupID: string, key: string | null, value = 1) {
        this.track(`${groupID}.${key}`, value)
    }

    prettyDump(id, group: Record<string, number>, formatId: (name: string) => string = (e) => e) {
        const total = sumBy(Object.values(group), e => e)
        const sortedArr = Object.entries(group)
            .map(([key, value]) => ({
                [id]: formatId(key),
                value,
                percent: ((value / total) * 100).toFixed(2) + ' %',
            }))
            .toSorted((a, b) => b.value - a.value)
            .concat({})
            .concat({
                [id]: 'Total',
                value: '',
                percent: total,
            })
        console.table(sortedArr)
    }

    dumpGroup(groupID: string, formatId: (name: string) => string = (e) => e) {
        const group = get(this.stats, groupID)
        if (!group) {
            return console.error('Group not found:', groupID)
        }
        this.prettyDump(groupID, group)
    }
    dumpAll() {
        const groups = unique(Object.keys(this.stats).map(e => e.split('.')[0]))
        .toSorted()
        .map(gid => this.dumpGroup(gid))
    }
    dump() {
        return this.stats
    }
}
// const track = (key: string, value = 1) => {

// }