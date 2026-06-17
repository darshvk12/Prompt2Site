import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home.tsx'
import Pricing from './pages/Pricing.tsx'
import Projects from './pages/Projects.tsx'
import MyProjects from './pages/MyProjects.tsx'
import Preview from './pages/Preview.tsx'
import Community from './pages/Community.tsx'
import View from './pages/View'
import Navbar from './components/Navbar'
import Loader from './components/Loader'
import { Toaster } from 'sonner'
import AuthPage from './pages/auth/AuthPage.tsx'
import { Settings as SettingsIcon } from 'lucide-react'
import { Settings } from './pages/Settings.tsx'
import Loading from './pages/Loading'

const App = () => {
  const [pageLoading, setPageLoading] = useState(true)
  const location = useLocation()
  const { pathname } = useLocation()
  const hideNavbar = pathname.startsWith('/projects/') && pathname !== '/projects' 
          || pathname.startsWith('/view/')
          || pathname.startsWith('/preview/')

  useEffect(() => {
    // hide loader after route change or initial load settled
    const t = setTimeout(() => setPageLoading(false), 150)
    return () => clearTimeout(t)
  }, [location])

  if (pageLoading) {
    return <Loader />
  }

  return (
    <div>
      <Toaster />
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/pricing' element={<Pricing />} />
        <Route path='/projects/:projectId' element={<Projects />} />
        <Route path='/projects' element={<MyProjects />} />
        <Route path='/preview/:projectId' element={<Preview />} />
        <Route path='/preview/:projectId/:versionId' element={<Pricing />} />
        <Route path='/community' element={<Community />} />
        <Route path='/view/:projectId' element={<View />} />
        <Route path="/auth/:pathname" element={<AuthPage />} />
        <Route path="/account/settings" element={<Settings />} />
        <Route path='/loading' element={<Loading />} />
      </Routes>
    </div>
  )
}

export default App