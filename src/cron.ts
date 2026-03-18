export const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'First of month', value: '0 0 1 * *' },
]

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function parseCron(expr: string): { valid: boolean; description?: string; error?: string } {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    return { valid: false, error: `Expected 5 fields, got ${parts.length}. Format: minute hour day-of-month month day-of-week` }
  }

  const [minute, hour, dom, month, dow] = parts

  if (!isValidField(minute, 0, 59)) return { valid: false, error: 'Invalid minute field' }
  if (!isValidField(hour, 0, 23)) return { valid: false, error: 'Invalid hour field' }
  if (!isValidField(dom, 1, 31)) return { valid: false, error: 'Invalid day-of-month field' }
  if (!isValidField(month, 1, 12)) return { valid: false, error: 'Invalid month field' }
  if (!isValidField(dow, 0, 7)) return { valid: false, error: 'Invalid day-of-week field' }

  const desc: string[] = []

  // Minute
  if (minute === '*') {
    desc.push('Every minute')
  } else if (minute.startsWith('*/')) {
    desc.push(`Every ${minute.slice(2)} minutes`)
  } else {
    desc.push(`At minute ${minute}`)
  }

  // Hour
  if (hour === '*') {
    // nothing extra
  } else if (hour.startsWith('*/')) {
    desc.push(`every ${hour.slice(2)} hours`)
  } else {
    const h = parseInt(hour)
    if (!isNaN(h)) {
      const ampm = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      desc.push(`past ${ampm}`)
    } else {
      desc.push(`past hour ${hour}`)
    }
  }

  // Day of month
  if (dom !== '*') {
    if (dom.startsWith('*/')) {
      desc.push(`every ${dom.slice(2)} days`)
    } else {
      desc.push(`on day ${dom} of the month`)
    }
  }

  // Month
  if (month !== '*') {
    if (month.startsWith('*/')) {
      desc.push(`every ${month.slice(2)} months`)
    } else {
      const nums = month.split(',').map(m => {
        const n = parseInt(m)
        return MONTH_NAMES[n] || m
      })
      desc.push(`in ${nums.join(', ')}`)
    }
  }

  // Day of week
  if (dow !== '*') {
    if (dow.includes('-')) {
      const [a, b] = dow.split('-').map(Number)
      desc.push(`on ${DOW_NAMES[a]} through ${DOW_NAMES[b]}`)
    } else if (dow.includes(',')) {
      const names = dow.split(',').map(d => DOW_NAMES[parseInt(d)] || d)
      desc.push(`on ${names.join(' and ')}`)
    } else {
      const n = parseInt(dow)
      desc.push(`on ${DOW_NAMES[n === 7 ? 0 : n] || dow}`)
    }
  }

  return { valid: true, description: desc.join(', ') }
}

function isValidField(field: string, min: number, max: number): boolean {
  if (field === '*') return true
  if (/^\*\/\d+$/.test(field)) {
    const step = parseInt(field.slice(2))
    return step >= 1 && step <= max
  }
  // Handle lists: 1,15
  const parts = field.split(',')
  for (const part of parts) {
    // Handle ranges: 1-5
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      if (isNaN(a) || isNaN(b) || a < min || b > max || a > b) return false
    } else {
      const n = parseInt(part)
      if (isNaN(n) || n < min || n > max) return false
    }
  }
  return true
}

function expandField(field: string, min: number, max: number): number[] {
  if (field === '*') {
    return Array.from({ length: max - min + 1 }, (_, i) => i + min)
  }
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2))
    const result: number[] = []
    for (let i = min; i <= max; i += step) result.push(i)
    return result
  }
  const result: number[] = []
  for (const part of field.split(',')) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      for (let i = a; i <= b; i++) result.push(i)
    } else {
      result.push(parseInt(part))
    }
  }
  return result
}

export function getNextRuns(expr: string, count: number): string[] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const [mf, hf, domf, monthf, dowf] = parts
  const minutes = expandField(mf, 0, 59)
  const hours = expandField(hf, 0, 23)
  const doms = expandField(domf, 1, 31)
  const months = expandField(monthf, 1, 12)
  const dows = expandField(dowf, 0, 6).map(d => d === 7 ? 0 : d)

  const results: string[] = []
  const now = new Date()
  const check = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0)

  const maxIterations = 525600 // 1 year of minutes
  for (let i = 0; i < maxIterations && results.length < count; i++) {
    const m = check.getMinutes()
    const h = check.getHours()
    const d = check.getDate()
    const mo = check.getMonth() + 1
    const wd = check.getDay()

    if (minutes.includes(m) && hours.includes(h) && doms.includes(d) && months.includes(mo) &&
        (dowf === '*' || dows.includes(wd))) {
      results.push(check.toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }))
    }

    check.setMinutes(check.getMinutes() + 1)
  }

  return results
}
