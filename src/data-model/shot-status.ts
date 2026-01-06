export const shotStatusValues = [
  'default',
  'unsure',
  'wip',
  'animated',
] as const

export type ShotStatus = typeof shotStatusValues[number]

export function nextStatus(current: ShotStatus): ShotStatus {
  switch (current) {
    case 'unsure':
      return 'default'
    case 'default':
      return 'wip'
    case 'wip':
      return 'animated'
    case 'animated':
      return 'animated'
  }
}

export function statusTooltip(status: ShotStatus): string {
  switch (status) {
    case 'unsure':
      return 'Click to unmark as Unsure'
    case 'default':
      return 'Click to mark as WIP<br>Right-click to mark as Unsure'
    case 'wip':
      return 'Click to mark as Animated'
    case 'animated':
      return 'Right-click to unmark as Animated'
  }
}
