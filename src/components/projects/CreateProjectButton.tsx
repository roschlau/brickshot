import { api } from '../../../convex/_generated/api'
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ChevronDownIcon, FolderUpIcon, PlusIcon, UploadIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { useMutation } from 'convex/react'
import { ChangeEvent, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Input } from '@/components/ui/input.tsx'
import { ImportableProject } from '@/data-model/project-import.ts'
import { Spinner } from '@/components/ui/spinner.tsx'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field.tsx'

export function CreateProjectButton({ text }: {
  text: string,
}) {
  const createProject = useMutation(api.projects.create)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  return (
    <ButtonGroup>
      <Button
        variant={'default'}
        onClick={() => void createProject()}
      >
        <PlusIcon />
        {text}
      </Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={'default'}
            className="pl-2.5!"
          >
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="no-default-focus-ring"
            onSelect={() => setImportDialogOpen(true)}
          >
            <UploadIcon />
            Import Project...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportProjectDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}/>
    </ButtonGroup>
  )
}

export function ImportProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const importProject = useMutation(api.projects.importProject)
  const [project, setProject] = useState(null as null | ImportableProject)
  const [invalidProjectFile, setInvalidProjectFile] = useState(false)
  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInvalidProjectFile(false)
    const parseFile = async () => {
      try {
        return ImportableProject.parse(JSON.parse(await file.text()))
      } catch (e) {
        console.error('Error opening file', e)
        return null
      }
    }
    const fileContent = await parseFile()
    if (!fileContent) {
      setInvalidProjectFile(true)
      setProject(null)
      return
    }
    setProject(fileContent)
  }
  const [importing, setImporting] = useState(false)
  const importClicked = async () => {
    if (!project) return
    setImporting(true)
    await importProject({ project })
    setImporting(false)
    setProject(null)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Select a file on your computer to import it into BrickShot.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>Project File</FieldLabel>
          <Input
            type={'file'}
            aria-invalid={invalidProjectFile}
            onChange={e => void onFileSelected(e)}
            accept={'.brickshot,.json'}
          />
          {invalidProjectFile
            ? <FieldError>This file could not be loaded as a BrickShot project. Please try another file.</FieldError>
            : (project && <FieldDescription>{project.name ? 'Project Name: ' + project.name : 'Unnamed Project'}</FieldDescription>)}
        </Field>
        <DialogFooter>
          <Button
            disabled={!project}
            onClick={() => void importClicked()}
          >
            {importing ? <Spinner/> : <FolderUpIcon/>}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
