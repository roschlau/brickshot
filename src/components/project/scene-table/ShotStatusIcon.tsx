import { ShotStatus } from '@/data-model/shot-status.ts'
import { Icon } from '@/ui-atoms/Icon.tsx'

export function ShotStatusIcon({ status }: { status: ShotStatus }) {
  return <Icon code={statusIconCode(status)} />
}

export function statusIconCode(status: ShotStatus): string {
  switch (status) {
  case 'unsure':
    return 'help_center'
  case 'default':
    return 'check_box_outline_blank'
  case 'wip':
    return 'filter_tilt_shift'
  case 'animated':
    return 'check_box'
  }
}
