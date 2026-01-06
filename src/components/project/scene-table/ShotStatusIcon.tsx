import { ShotStatus } from '@/data-model/shot-status.ts'
import { CircleQuestionMarkIcon, LucideProps, SquareCheckIcon, SquareDotIcon, SquareIcon } from 'lucide-react'
import * as react from 'react'

export function ShotStatusIcon({
  status,
  size = 20,
  ...props
}: { status: ShotStatus } & Omit<LucideProps, "ref"> & react.RefAttributes<SVGSVGElement>) {
  const Comp = statusIconCode(status)
  return <Comp size={size} {...props}/>
}

function statusIconCode(status: ShotStatus) {
  switch (status) {
  case 'unsure':
    return CircleQuestionMarkIcon
  case 'default':
    return SquareIcon
  case 'wip':
    return SquareDotIcon
  case 'animated':
    return SquareCheckIcon
  }
}
