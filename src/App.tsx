import { useState } from 'react'
import './App.css'
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { Projects } from '@/components/projects/Projects.tsx'
import { Project } from '@/components/project/Project.tsx'

function App() {
  const [openedProjectId, setOpenedProjectId] = useState(null as Id<'projects'> | null)
  const markOpened = useMutation(api.projects.markOpened)
  const openProject = async (projectId: Id<'projects'>) => {
    await markOpened({ projectId })
    setOpenedProjectId(projectId)
  }
  if (openedProjectId) {
    return <Project
      projectId={openedProjectId}
      onCloseProjectClicked={() => setOpenedProjectId(null)}
    />
  } else {
    return <Projects onProjectSelected={(id) => void openProject(id)}/>
  }
}

export default App
