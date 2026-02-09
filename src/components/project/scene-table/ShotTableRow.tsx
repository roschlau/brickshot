import {shotCode} from '../../../data-model/codes.ts'
import clipboard from 'clipboardy'
import toast from 'react-hot-toast'
import {nextStatus, statusTooltip} from '../../../data-model/shot-status.ts'
import {EditableTextCell} from './EditableTextCell.tsx'
import {useMutation, useQuery} from 'convex/react'
import {api} from '../../../../convex/_generated/api'
import {Id} from '../../../../convex/_generated/dataModel'
import {Skeleton} from '@/components/ui/skeleton.tsx'
import {
  ArrowDownIcon,
  ArrowDownUpIcon,
  ArrowUpIcon,
  CircleAlertIcon,
  EllipsisVerticalIcon, FileIcon, ImageIcon,
  ImagePlusIcon,
  LockIcon,
  PenIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react'
import {ShotStatusIcon} from '@/components/project/scene-table/ShotStatusIcon.tsx'
import {cn} from '@/lib/utils.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import {Button} from '@/components/ui/button.tsx'
import {ConfirmDeletionDialog} from '@/components/ui/ConfirmDeletionDialog.tsx'
import {useState} from 'react'
import {SimpleTooltip} from '@/components/ui/tooltip.tsx'
import {SelectFileButton} from '@/components/ui/select-file-button.tsx'

export function ShotTableRow({
  shotId,
  sceneNumber,
  shotNumber,
  showAddBeforeButton,
  showSwapButton,
  onAddBefore,
  onMoveUpClicked,
  onMoveDownClicked,
}: {
  shotId: Id<'shots'>
  sceneNumber: number,
  shotNumber: number,
  showAddBeforeButton: boolean,
  showSwapButton: boolean,
  onAddBefore: () => void,
  onMoveUpClicked?: () => void,
  onMoveDownClicked?: () => void,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const generateAttachmentUploadUrl = useMutation(api.shots.generateAttachmentUploadUrl)
  const addAttachment = useMutation(api.shots.addAttachment)

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

  const handleFileSelected = async (file: File) => {
    const uploadUrl = await generateAttachmentUploadUrl()
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    const { storageId } = await result.json()
    await addAttachment({ filename: file.name, shotId, storageId })
  }

  if (shot === null) {
    return (
      <div className={'col-start-1 col-span-full h-10 pl-4 gap-2 flex flex-row items-center text-destructive'}>
        <CircleAlertIcon size={20}/>
        Shot {shotId} could not be loaded.
      </div>
    )
  }

  return (
    !shot ? <LoadingShotTableRow/> : <>
      <div
        className={'col-start-1 grid grid-flow-col place-content-start items-center pl-2 group relative' + (shot.status === 'wip' ? ' bg-violet-900!' : '')}
      >
        {showAddBeforeButton && <button
          className={'absolute top-0 left-0 -translate-x-full -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'}
          onClick={onAddBefore}
        >
          <PlusIcon size={16} className={'m-0.5'}/>
        </button>}
        {showSwapButton && <button
          className={'absolute top-0 left-0 -translate-x-[200%] -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'}
          onClick={onMoveUpClicked}
        >
          <ArrowDownUpIcon size={16} className={'m-0.5'}/>
        </button>}
        <button
          onClick={() => void cycleStatus()}
          onContextMenu={event => {
            void onStatusRightClicked()
            event.preventDefault()
          }}
          className={cn(
            'translate-y-px',
            shot.status === 'wip' ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-slate-100',
          )}
          data-tooltip-id={'tooltip'}
          data-tooltip-html={statusTooltip(shot.status)}
          data-tooltip-place={'bottom'}
        >
          <ShotStatusIcon status={shot.status}/>
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
            <LockIcon
              size={14}
              className={'icon-size-20 opacity-0 group-hover:opacity-100 ml-1'}
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
            <PenIcon
              size={14}
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
      >
        <div className={'absolute right-0 top-0 flex flex-row items-center *:-ml-2'}>
          {shot.attachments?.map(attachment => (
            <SimpleTooltip text={`${attachment.filename} (${attachment.fileSizeDisplay})`}>
              <Button variant={'ghost'} className={'text-muted-foreground hover:text-foreground'} asChild>
                <a
                  className={'p-2 rounded hover:bg-muted'}
                  download={attachment.filename}
                  href={attachment.url}
                  target={'_blank'}
                >
                  {attachment.contentType?.startsWith('image') ? <ImageIcon size={16}/> : <FileIcon size={16}/>}
                </a>
              </Button>
            </SimpleTooltip>
          ))}
          <SimpleTooltip text={'Add attachment'}>
            <SelectFileButton
              aria-label={'Add attachment'}
              variant={'ghost'}
              className={'text-muted-foreground hover:text-foreground'}
              onFileSelected={handleFileSelected}
            >
              <ImagePlusIcon/>
            </SelectFileButton>
          </SimpleTooltip>
        </div>
      </EditableTextCell>
      <div className="col-start-6 self-stretch">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={'ghost'}>
              <EllipsisVerticalIcon/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={'end'}>
            <DropdownMenuItem
              variant={'default'}
              className={'no-default-focus-ring'}
              disabled={onMoveUpClicked === undefined}
              onSelect={() => onMoveUpClicked?.()}
            >
              <ArrowUpIcon/>
              Move Up
            </DropdownMenuItem>
            <DropdownMenuItem
              variant={'default'}
              className={'no-default-focus-ring'}
              disabled={onMoveDownClicked === undefined}
              onSelect={() => onMoveDownClicked?.()}
            >
              <ArrowDownIcon/>
              Move Down
            </DropdownMenuItem>
            <DropdownMenuItem
              variant={'destructive'}
              className={'no-default-focus-ring'}
              onSelect={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon/>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {<ConfirmDeletionDialog
          open={deleteDialogOpen}
          title={`Delete Shot '${shotFullCode}'?`}
          body={`The shot will be permanently deleted and can not be restored.`}
          onOpenChange={setDeleteDialogOpen}
          onDeleteClicked={() => void deleteShot({ shotId })}
        />}
      </div>
    </>
  )
}

export function LoadingShotTableRow() {
  return (<>
    <div className={'col-start-1 h-10 min-w-12 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'}/>
    </div>
    <div className={'col-start-3 h-10 min-w-12 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'}/>
    </div>
    <div className={'col-start-4 h-10 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'}/></div>
    <div className={'col-start-5 h-10 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'}/></div>
    <div className={'col-start-6 h-10 min-w-10 justify-self-stretch px-2 py-3'}><Skeleton className={'size-full'}/>
    </div>
  </>)
}
