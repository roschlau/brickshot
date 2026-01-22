import { Id } from '../../../convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState } from 'react'
import { ShotStatus } from '@/data-model/shot-status.ts'
import { SceneTable } from '@/components/project/scene-table/SceneTable.tsx'
import { getSceneNumber } from '@/data-model/codes.ts'
import { Button } from '@/components/ui/button.tsx'
import { StatusFilterSelector } from '@/StatusFilterSelector.tsx'

export function Project({
  projectId,
  onCloseProjectClicked,
}: {
  projectId: Id<'projects'>,
  onCloseProjectClicked: () => void,
}) {
  const project = useQuery(api.projects.getDetails, { projectId })
  const projectScenes = useQuery(api.scenes.getForProjectWithShots, { projectId }) ?? []
  const createScene = useMutation(api.scenes.create)

  const [statusFilter, setStatusFilter] = useState<ShotStatus[]>([])

  // Scenes
  const addScene = async () => {
    await createScene({ projectId })
  }

  const scenes = projectScenes.map((scene, sceneIndex) => {
    return (
      <SceneTable
        key={getSceneNumber(scene, sceneIndex)}
        sceneId={scene._id}
        sceneIndex={sceneIndex}
        shotStatusFilter={statusFilter}
      />
    )
  })

  // Scene Links
  const sceneLinks = projectScenes.map((scene, sceneIndex) => {
    const sceneNumber = getSceneNumber(scene, sceneIndex)
    const hasWipShots = !!scene.shots.find(shot => shot.status === 'wip')
    const isDone = scene.shots.every(shot => shot.status === 'animated')
    return (
      <a
        key={sceneNumber}
        href={'#scene-' + sceneNumber.toString()}
        className={'py-1 px-2 rounded-sm ' +
          (isDone ? 'text-slate-500' : 'text-slate-200') + ' hover:text-slate-100 ' +
          (hasWipShots ? 'bg-primary/50 hover:bg-primary/30' : 'hover:bg-foreground/20')}
        data-tooltip-id={'tooltip'}
        data-tooltip-content={scene.description || ('Scene ' + sceneNumber.toString())}
      >
        {sceneNumber}
      </a>
    )
  })

  return (
    <>
      <div className={'w-full max-w-(--breakpoint-xl) top-0 sticky z-10 flex flex-col px-6 pb-4 items-start'}>
        <div className={'w-full flex flex-row items-center mb-4 gap-2'}>
          <h1 className="text-3xl my-4 grow">
            {project?.name}
          </h1>
          <Button
            variant={'outline'}
            onClick={onCloseProjectClicked}
          >
            Back to Projects
          </Button>
        </div>
        <div className={'self-stretch flex flex-row items-center'}>
          <div className={'grow flex flex-row items-center'}>
            <span className={'mr-1'}>Scenes:</span>
            {sceneLinks}
          </div>
          <div className={'flex flex-row items-center'}>
            <StatusFilterSelector selected={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>
      </div>
      <div
        className="w-full max-w-(--breakpoint-xl) grid mb-10
                   justify-stretch justify-items-stretch items-stretch
                   px-6 gap-px *:bg-card"
        style={{ gridTemplateColumns: 'auto auto auto 1fr 1fr auto' }}
      >
        {scenes}
        <button
          className={'col-start-1 col-span-full mt-4 rounded-md text-start p-2 text-slate-300 hover:text-slate-100 hover:bg-background'}
          onClick={() => void addScene()}
        >
          + Add Scene
        </button>
      </div>
    </>
  )
}
