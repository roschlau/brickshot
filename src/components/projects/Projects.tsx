import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ProjectsEmptyState } from '@/components/projects/ProjectsEmptyState.tsx'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button.tsx'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { DownloadIcon, EllipsisVerticalIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { AccountControls } from '@/AccountControls.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import {
  AlertDialog,
  AlertDialogActionDestructive,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { useState } from 'react'
import { CreateProjectButton } from '@/components/projects/CreateProjectButton.tsx'
import toast from 'react-hot-toast'
import { saveFile } from '@/lib/files.ts'
import { displayFullTime, displayRelativeTime } from '@/lib/time.ts'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { byDesc } from '@/lib/sorting.ts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group.tsx'

export function Projects({
  onProjectSelected,
}: {
  onProjectSelected: (projectId: Id<'projects'>) => void
}) {
  const projects = useQuery(api.projects.getAll)
  const [searchQuery, setSearchQuery] = useState<string>('')

  if (!projects) {
    return <Spinner className={'size-12'} />
  }
  projects.sort(byDesc(project => project.lastOpenedTime ?? project._creationTime))

  return projects.length === 0
    ? <ProjectsEmptyState />
    : (
      <div className={'flex flex-col w-xl max-w-full gap-4 p-2'}>
        <div className={'flex flex-row items-center gap-2 mb-10'}>
          <h1 className={'text-3xl grow'}>
            Your Projects
          </h1>
          <AccountControls />
        </div>
        <div className={'flex flex-row items-center gap-2'}>
          <InputGroup>
            <InputGroupInput
              type={'text'}
              className={'no-default-focus-ring'}
              placeholder={'Search project name'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon/>
            </InputGroupAddon>
          </InputGroup>
          <CreateProjectButton text={'New'} />
        </div>
        <ul className={'flex flex-col gap-4'}>
          {projects.filter(project => !searchQuery || project.name.includes(searchQuery)).map(project => (
            <ProjectTile
              key={project._id}
              projectId={project._id}
              projectName={project.name}
              onOpenClicked={() => onProjectSelected(project._id)}
            />
          ))}
        </ul>
      </div>
    )
}

function ProjectTile({
  projectId,
  projectName,
  onOpenClicked,
}: {
  projectId: Id<'projects'>,
  projectName: string,
  onOpenClicked: () => void,
}) {
  const projectDetails = useQuery(api.projects.getDetails, { projectId })
  const deleteProject = useMutation(api.projects.deleteProject)
  const exportProject = useMutation(api.projects.exportProject)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportProjectClicked = () => toast.promise(async () => {
    try {
      setExporting(true)
      const data = await exportProject({ projectId })
      const filename = projectName.replace(/[^a-zA-Z0-9]/g, '_') + '.brickshot'
      saveFile(JSON.stringify(data), filename)
    } catch (error) {
      console.error('Error exporting project:', error)
    } finally {
      setExporting(false)
    }
  }, {
    loading: 'Exporting Project...',
    success: 'Project Exported!',
    error: 'Error Exporting Project!',
  })

  return (
    <li>
      <Item variant={'outline'}>
        <ItemContent>
          <ItemTitle>{projectName}</ItemTitle>
          {projectDetails
            ? <ItemDescription>
              <span>{projectDetails.scenesCount.toString()} Scene(s)</span>
              &nbsp;|&nbsp;
              <Tooltip>
                <TooltipTrigger asChild><span>{displayRelativeTime(projectDetails.lastOpenedTime ?? projectDetails._creationTime)}</span></TooltipTrigger>
                <TooltipContent>
                  {projectDetails.lastOpenedTime &&
                    <>Last Opened: {displayFullTime(projectDetails.lastOpenedTime)}<br /></>}
                  Created: {displayFullTime(projectDetails._creationTime)}
                </TooltipContent>
              </Tooltip>
            </ItemDescription>
            : <Skeleton className={'h-5.25 w-16 rounded-full'} />
          }
        </ItemContent>
        <ItemActions>
          <Button
            variant={'outline'}
            onClick={onOpenClicked}
          >
            Open
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'outline'}>
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={'end'}>
              <DropdownMenuItem
                disabled={exporting}
                className={'no-default-focus-ring'}
                onSelect={() => void exportProjectClicked()}
              >
                {exporting ? <Spinner /> : <DownloadIcon />}
                Export
              </DropdownMenuItem>
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
        </ItemActions>
        <DeleteProjectDialog
          open={deleteDialogOpen}
          projectName={projectName}
          onOpenChange={setDeleteDialogOpen}
          onDeleteClicked={() => void deleteProject({ projectId })}
        />
      </Item>
    </li>
  )
}

function DeleteProjectDialog({
  open,
  projectName,
  onOpenChange,
  onDeleteClicked,
}: {
  open: boolean,
  projectName: string,
  onOpenChange: (open: boolean) => void,
  onDeleteClicked: () => void,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project &apos;{projectName}&apos;?</AlertDialogTitle>
          <AlertDialogDescription>
            The project and its data will be permanently deleted and can not be restored.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogActionDestructive onClick={onDeleteClicked}>
            Delete
          </AlertDialogActionDestructive>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
