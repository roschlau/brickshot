const shortTime = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
})

const shortDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'short',
})

const shortDateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function displayRelativeTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  if (diff < 1000 * 60) {
    return 'just now'
  }
  if (diff < 1000 * 60 * 60) {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes.toString()} minutes ago`
  }
  if (diff < 1000 * 60 * 60 * 24 && now.getDay() === date.getDay()) {
    return shortTime.format(date)
  }
  return shortDate.format(date)
}

export function displayFullTime(timestamp: number): string {
  return shortDateTime.format(new Date(timestamp))
}
