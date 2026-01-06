import { getSceneNumber, nextShotAutoNumber } from '../../../data-model/codes.ts'
import { ShotData } from '../../../data-model/shot.ts'
import { LoadingShotTableRow, ShotTableRow } from './ShotTableRow.tsx'
import { Icon } from '../../../ui-atoms/Icon.tsx'
import { ShotStatus } from '../../../data-model/shot-status.ts'
import { Doc } from '../../../../convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { byOrder } from '@/lib/sorting.ts'
import { Skeleton } from '@/components/ui/skeleton.tsx'

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
  const shotTableRows = shotViewModels
    ?.filter(({ shotData }) => shotStatusFilter.length === 0 || shotStatusFilter.includes(shotData.status))
    .map(({ shotData, indexInScene, shotNumber }) => {
      const swapWithPrevious = async () => {
        if (!scene) {
          throw Error()
        }
        const newShotOrder = scene.shotOrder.slice()
        const previous = newShotOrder[indexInScene - 1]
        const current = newShotOrder[indexInScene]
        console.log('ROBIN', `swapWithPrevious`, indexInScene, previous, current, newShotOrder)
        if (current === undefined || previous === undefined) {
          throw Error()
        }
        newShotOrder[indexInScene - 1] = current
        newShotOrder[indexInScene] = previous
        console.log('ROBIN', `swapWithPrevious`, newShotOrder)
        await updateScene({ sceneId, data: { shotOrder: newShotOrder } })
      }
      return (
        <ShotTableRow
          key={shotData._id}
          shotId={shotData._id}
          sceneNumber={sceneNumber}
          shotNumber={shotNumber}
          showAddBeforeButton={shotStatusFilter.length === 0}
          showSwapButton={indexInScene > 0 && shotStatusFilter.length === 0}
          onAddBefore={() => void addNewShot(indexInScene)}
          onSwapWithPrevious={() => void swapWithPrevious()}
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
        <button
          className={'p-2 text-sm text-slate-500 hover:text-red-100 hover:bg-red-900 self-stretch'}
          onClick={() => void deleteScene({ sceneId })}
        >
          <Icon code={'delete_forever'} />
        </button>
      </div>
      {shotTableRows ?? <LoadingShotTableRow/>}
      <button
        className={'col-start-1 col-span-full mb-4 rounded-b-md p-2 pb-3 text-start text-slate-300 enabled:hover:text-slate-100 enabled:hover:bg-slate-700'}
        disabled={!shots}
        onClick={() => void addNewShot(shots?.length ?? 0)}
      >
        {shots ? '+ Add Shot' : <Skeleton className={'h-4 w-20'}/>}
      </button>
    </>
  )
}
