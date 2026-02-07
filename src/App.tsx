import {Projects} from '@/components/projects/Projects.tsx'
import {Project} from '@/components/project/Project.tsx'
import {useSearchParams} from 'react-router'
import {Id} from '../convex/_generated/dataModel'

function App() {
  const [params] = useSearchParams()
  const openedProjectId = params.get('p') as Id<'projects'> | null
  if (openedProjectId) {
    return <Project projectId={openedProjectId}/>
  } else {
    return <Projects/>
  }
}

export default App
