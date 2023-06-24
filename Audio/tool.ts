// 100
const HOURS = 3600
const MINUTES = 60

function replenish0 (num: number): string | number {
  if (num >= 10) return num
  return '0' + num
}

export function getTimeByStamp (timeStamp: number): string {
  let hours = replenish0(Math.floor(timeStamp / HOURS))
  let minutes = replenish0(Math.floor((timeStamp % HOURS) / MINUTES))
  let seconds = replenish0(Math.floor(timeStamp % MINUTES))
  if (hours === '00') return [minutes, seconds].join(':')
  return [hours, minutes, seconds].join(':')
}
