import { shotCode } from '../../../data-model/codes.ts'
import clipboard from 'clipboardy'
import toast from 'react-hot-toast'
import { nextStatus, statusIconCode, statusTooltip } from '../../../data-model/shot-status.ts'
import { Icon } from '../../../ui-atoms/Icon.tsx'
import { EditableTextCell } from './EditableTextCell.tsx'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { CircleAlertIcon } from 'lucide-react'

export function ShotTableRow({
  shotId,
  sceneNumber,
  shotNumber,
  showAddBeforeButton,
  showSwapButton,
  onAddBefore,
  onSwapWithPrevious,
}: {
  shotId: Id<'shots'>
  sceneNumber: number,
  shotNumber: number,
  showAddBeforeButton: boolean,
  showSwapButton: boolean,
  onAddBefore: () => void,
  onSwapWithPrevious: () => void,
}) {
  const shot = useQuery(api.shots.get, { id: shotId })
  const updateShot = useMutation(api.shots.update).withOptimisticUpdate(
    (localStore, { shotId, data }) => {
      const currentValue = localStore.getQuery(api.shots.get, { id: shotId })
      if (!currentValue) {
        return
      }
      localStore.setQuery(api.shots.get, { id: shotId }, {
        ...currentValue,
        status: data.status ?? currentValue.status,
        lockedNumber: data.lockedNumber ?? currentValue.lockedNumber,
        description: data.description ?? currentValue.description,
        location: data.location ?? currentValue.location,
        notes: data.notes ?? currentValue.notes,
      })
    },
  )
  const deleteShot = useMutation(api.shots.deleteShot)

  const shotFullCode = shotCode(sceneNumber, shotNumber)

  const lockAndCopyShotCode = async () => {
    if (!shot) throw Error('Shot not loaded')
    if (shot.lockedNumber === null) {
      await updateShot({ shotId, data: { lockedNumber: shotNumber } })
    }
    const copyPromise = clipboard.write(shotFullCode)
    void toast.promise(copyPromise, {
      loading: 'Copying...',
      success: 'Shotcode copied to clipboard!',
      error: 'Failed to copy shotcode to clipboard',
    })
  }

  const editShotCode = async () => {
    if (!shot) throw Error('Shot not loaded')
    if (shot.lockedNumber === null) {
      throw Error('Shotcode not locked')
    }
    const newShotCode = window.prompt('Enter new shot code. Clear and Confirm to unlock shot code.', shot.lockedNumber.toString())
    if (newShotCode !== null) {
      if (newShotCode.trim().length === 0) {
        await updateShot({ shotId, data: { lockedNumber: null } })
        return
      }
      const parsed = parseInt(newShotCode)
      if (isNaN(parsed)) {
        throw Error('Invalid shotcode: ' + newShotCode)
      }
      if (parsed !== shot.lockedNumber) {
        await updateShot({ shotId, data: { lockedNumber: parsed } })
      }
      void clipboard.write(sceneNumber.toString() + '-' + parsed.toString())
    }
  }

  const cycleStatus = async () => {
    if (!shot) throw Error('Shot not loaded')
    const next = nextStatus(shot.status)
    const lockedNumber = (next === 'animated' || next === 'wip') && shot.lockedNumber === null
      ? shotNumber
      : shot.lockedNumber
    await updateShot({ shotId, data: { status: next, lockedNumber } })
  }

  const onStatusRightClicked = async () => {
    if (!shot) throw Error('Shot not loaded')
    const status = shot.status === 'animated'
      ? 'default'
      : shot.status === 'unsure'
        ? 'default'
        : 'unsure'
    await updateShot({ shotId, data: { status } })
  }

  if (shot === null) {
    return (
      <div className={'col-start-1 col-span-full h-10 pl-4 gap-2 flex flex-row items-center text-destructive'}>
        <CircleAlertIcon size={20} />
        Shot {shotId} could not be loaded.
      </div>
    )
  }

  return (
    !shot ? <LoadingShotTableRow /> : <>
      <div
        className={'col-start-1 grid grid-flow-col place-content-start items-center pl-2 group relative' + (shot.status === 'wip' ? ' bg-violet-900!' : '')}
      >
        {showAddBeforeButton && <button
          className={'absolute top-0 left-0 -translate-x-full -translate-y-1/2 opacity-0 group-hover:opacity-100'}
          onClick={onAddBefore}
        >
          <Icon code={'add'} />
        </button>}
        {showSwapButton && <button
          className={'absolute top-0 left-0 -translate-x-[200%] -translate-y-1/2 opacity-0 group-hover:opacity-100'}
          onClick={onSwapWithPrevious}
        >
          <Icon code={'swap_vert'} />
        </button>}
        <button
          onClick={() => void cycleStatus()}
          onContextMenu={event => {
            void onStatusRightClicked()
            event.preventDefault()
          }}
          className={shot.status === 'wip' ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-slate-100'}
          data-tooltip-id={'tooltip'}
          data-tooltip-html={statusTooltip(shot.status)}
          data-tooltip-place={'bottom'}
        >
          <Icon code={statusIconCode(shot.status)} />
        </button>
        <button
          onClick={() => void lockAndCopyShotCode()}
          className={'p-2 pr-0 text-sm flex flex-row items-center ' + (shot.lockedNumber != null ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-slate-100')}
          data-tooltip-id={'tooltip'}
          data-tooltip-content={'Click to copy'}
          data-tooltip-place={'bottom'}
        >
          {shotFullCode}
          {shot.lockedNumber === null &&
            <Icon
              code={'lock'}
              className={'icon-size-20 opacity-0 group-hover:opacity-100 pl-1'}
            />
          }
        </button>
        {shot.lockedNumber !== null &&
          <button
            onClick={() => void editShotCode()}
            className={'p-2 pl-1 flex flex-row items-center opacity-0 group-hover:opacity-100'}
            data-tooltip-id={'tooltip'}
            data-tooltip-content={'Edit Shotcode'}
            data-tooltip-place={'bottom'}
          >
            <Icon
              code={'edit'}
              className={'icon-size-20 text-slate-500 hover:text-slate-100'}
            />
          </button>
        }
      </div>
      <EditableTextCell
        column={'col-start-3'}
        value={shot.location ?? ''}
        placeholder={'Add Location'}
        className={shot.status === 'animated' ? 'opacity-50' : ''}
        onUpdate={value => void updateShot({ shotId, data: { location: value.trim() === '' ? null : value } })}
      />
      <EditableTextCell
        column={'col-start-4'}
        value={shot.description}
        placeholder={'Add Description'}
        className={shot.status === 'animated' ? 'opacity-50' : ''}
        onUpdate={value => void updateShot({ shotId, data: { description: value } })}
      />
      <EditableTextCell
        column={'col-start-5'}
        value={shot.notes}
        placeholder={'Add Notes'}
        className={shot.status === 'animated' ? 'opacity-50' : ''}
        onUpdate={value => void updateShot({ shotId, data: { notes: value } })}
      />
      <div className="col-start-6 self-stretch hover:bg-red-900">
        <button
          onClick={() => void deleteShot({ shotId })}
          className={'p-2 text-sm text-slate-500 hover:text-red-100 h-full'}
        >
          <Icon code={'delete_forever'} />
        </button>
      </div>
    </>
  )
}

export function LoadingShotTableRow() {
  return (<>
    <div className={'col-start-1 h-10 min-w-12 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'} /></div>
    <div className={'col-start-3 h-10 min-w-12 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'} /></div>
    <div className={'col-start-4 h-10 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'} /></div>
    <div className={'col-start-5 h-10 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'} /></div>
    <div className={'col-start-6 h-10 min-w-10 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'} /></div>
  </>)
}
