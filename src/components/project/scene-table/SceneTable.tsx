import { getSceneNumber, nextShotAutoNumber } from '../../../data-model/codes.ts'
import { ShotData } from '../../../data-model/shot.ts'
import { LoadingShotTableRow, ShotTableRow } from './ShotTableRow.tsx'
import { ShotStatus } from '../../../data-model/shot-status.ts'
import { Doc } from '../../../../convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { byOrder } from '@/lib/sorting.ts'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { EllipsisVerticalIcon, TrashIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useState } from 'react'
import { ConfirmDeletionDialog } from '@/components/ui/ConfirmDeletionDialog.tsx'

interface ShotViewModel {
  indexInScene: number,
  shotNumber: number,
  shotData: ShotData
}

export function SceneTable({ sceneId, sceneIndex, shotStatusFilter }: {
  sceneId: Doc<'scenes'>['_id']
  sceneIndex: number,
  shotStatusFilter: ShotStatus[],
}) {
  const scene = useQuery(api.scenes.get, { id: sceneId })
  const shots = useQuery(api.shots.getForScene, { sceneId })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  if (scene && shots) {
    shots.sort(byOrder(scene.shotOrder, shot => shot._id))
  }
  const createShot = useMutation(api.shots.create)
  const updateScene = useMutation(api.scenes.update).withOptimisticUpdate(
    (localStore, { sceneId, data }) => {
      const currentValue = localStore.getQuery(api.scenes.get, { id: sceneId })
      if (!currentValue) {
        return
      }
      localStore.setQuery(api.scenes.get, { id: sceneId }, {
        ...currentValue,
        lockedNumber: data.lockedNumber ?? currentValue.lockedNumber,
        description: data.description ?? currentValue.description,
      })
    },
  )
  const deleteScene = useMutation(api.scenes.deleteScene)

  const lockedShotNumbers = shots
      ?.map(it => it.lockedNumber).filter((it): it is number => it !== null)
    ?? []
  const shotNumbers: Record<number, number> = {}
  const sceneNumber = getSceneNumber(scene ?? { lockedNumber: null }, sceneIndex)
  const addNewShot = async (index: number) => {
    const shotId = await createShot({
      sceneId,
      atIndex: index,
      shot: { location: (shots?.[index - 1] ?? shots?.[index])?.location ?? undefined },
    })
    if (!shotId) {
      throw Error('Shot could not be created')
    }
  }
  const shotViewModels = shots
    ?.map((shot, shotIndex) => {
      const shotNumber = shot.lockedNumber ?? nextShotAutoNumber(shotNumbers[shotIndex - 1] ?? 0, lockedShotNumbers)
      shotNumbers[shotIndex] = shotNumber
      return {
        indexInScene: shotIndex,
        shotNumber,
        shotData: shot,
      } satisfies ShotViewModel
    })

  const swapShots = async (aIndex: number, bIndex: number) => {
    if (!scene) {
      throw Error()
    }
    if (aIndex >= scene.shotOrder.length || bIndex >= scene.shotOrder.length || aIndex < 0 || bIndex < 0) {
      throw Error(`swapShots: Indices ${aIndex}, ${bIndex} not in range 0..${scene.shotOrder.length - 1}`)
    }
    const newShotOrder = scene.shotOrder.slice()
    const aId = newShotOrder[aIndex]
    const bId = newShotOrder[bIndex]
    if (bId === undefined || aId === undefined) {
      throw Error()
    }
    newShotOrder[aIndex] = bId
    newShotOrder[bIndex] = aId
    await updateScene({ sceneId, data: { shotOrder: newShotOrder } })
  }

  const shotTableRows = shotViewModels
    ?.filter(({ shotData }) => shotStatusFilter.length === 0 || shotStatusFilter.includes(shotData.status))
    .map(({ shotData, indexInScene, shotNumber }) => {
      return (
        <ShotTableRow
          key={shotData._id}
          shotId={shotData._id}
          sceneNumber={sceneNumber}
          shotNumber={shotNumber}
          showAddBeforeButton={shotStatusFilter.length === 0}
          showSwapButton={indexInScene > 0 && shotStatusFilter.length === 0}
          onAddBefore={() => void addNewShot(indexInScene)}
          onMoveUpClicked={indexInScene > 0 ? () => void swapShots(indexInScene, indexInScene - 1) : undefined}
          onMoveDownClicked={scene && indexInScene < (scene.shotOrder.length - 1) ? () => void swapShots(indexInScene, indexInScene + 1) : undefined}
        />
      )
    })
  return shotTableRows?.length === 0 && shots?.length !== 0 ? null : (
    <>
      <div
        id={'scene-' + sceneNumber.toString()}
        className="col-start-1 col-span-full rounded-t-md pl-3 pr-0 flex flex-row gap-2 items-center overflow-hidden"
      >
        <span className={'font-bold text-lg'}>
          #{sceneNumber}
        </span>
        <input
          type={'text'}
          className={'grow self-stretch my-0.5 p-2 font-bold text-lg rounded-sm bg-transparent border-none placeholder-muted-foreground placeholder:font-normal'}
          value={scene?.description ?? ''}
          placeholder={'Scene ' + sceneNumber.toString()}
          onChange={(event) => void updateScene({ sceneId, data: { description: event.target.value } })}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={'ghost'}>
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={'end'}>
            <DropdownMenuItem
              variant={'destructive'}
              className={'no-default-focus-ring'}
              onSelect={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {scene && <ConfirmDeletionDialog
          open={deleteDialogOpen}
          title={`Delete Scene '${scene.description || sceneNumber.toString()}'?`}
          body={`The scene will be permanently deleted and can not be restored.`}
          onOpenChange={setDeleteDialogOpen}
          onDeleteClicked={() => void deleteScene({ sceneId })}
        />}
      </div>
      {shotTableRows ?? <LoadingShotTableRow />}
      <button
        className={'col-start-1 col-span-full mb-4 rounded-b-md p-2 pb-3 text-start text-slate-300 enabled:hover:text-slate-100 enabled:hover:bg-slate-700'}
        disabled={!shots}
        onClick={() => void addNewShot(shots?.length ?? 0)}
      >
        {shots ? '+ Add Shot' : <Skeleton className={'h-4 w-20'} />}
      </button>
    </>
  )
}
