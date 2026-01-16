import { useEffect, useState } from 'react'
import type { Project } from '../types';
import { Loader2Icon, TrashIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dummyProjects } from '../assets/assets';
import Footer from '../components/Footer';

const Community: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    // TODO: replace with real API call
    setProjects(dummyProjects)
      setTimeout(()=>{
setLoading(false)
      },1000)
      
    
  };

    const deleteProject = async (projectId: string) => {
      // Simple client-side delete; replace with API interaction as needed
      if (!confirm('Delete this project?')) return;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className='relative min-h-screen'>
      <div aria-hidden className="fixed inset-0 -z-10 hero-bg" />
      <div className='px-4 md:px-16 lg:px-24 xl:px-32'>
      {loading ? (
        <div className='flex items-center justify-center h-[80vh]'>
          <Loader2Icon className='h-7 w-7 animate-spin text-indigo-200' />
        </div>
      ) : projects.length > 0 ? (
        <div className='py-10 min-h-[80vh]'>
          <div className='flex items-center justify-between mb-8'>
            <h1 className='text-3xl font-semibold text-white'>Published Projects</h1>
          </div>

          {/* Grid: responsive 1-4 columns like the screenshot */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {projects.map((project) => (
              <Link key={project.id} to={`/view/${project.id}`} target='_blank' className='group relative block rounded-xl overflow-hidden border border-gray-800 bg-gradient-to-b from-[#0b0920]/60 to-[#0b0515]/60 hover:-translate-y-1 transition-transform duration-300'>

                {/* Preview */}
                <div className='relative w-full h-44 bg-gray-900/40 border-b border-gray-800 overflow-hidden'>
                  {project.current_code ? (
                    <iframe
                      srcDoc={project.current_code}
                      className='absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left pointer-events-none'
                      sandbox='allow-scripts allow-same-origin'
                      style={{ transform: 'scale(0.22)', transformOrigin: 'top left' }}
                    />
                  ) : (
                    <div className='flex items-center justify-center h-full text-gray-500'>
                      <p>No Preview</p>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className='p-4 pb-5 bg-transparent'>
                  <div className='flex items-start justify-between gap-3'>
                    <h2 className='text-lg font-semibold text-white line-clamp-2'>{project.name}</h2>
                    <span className='project-badge'>Website</span>
                  </div>
                  <p className='text-gray-400 mt-2 text-sm line-clamp-2'>{project.initial_prompt}</p>

                  <div className='flex items-center justify-between mt-4'>
                    <span className='text-xs text-gray-400'>{new Date(project.createdAt).toLocaleDateString()}</span>
                    <div className='flex items-center gap-3'>
                      <button onClick={(e)=>{e.stopPropagation(); navigate(`/preview/${project.id}`)}} className='project-btn'>Preview</button>
                      <button onClick={(e)=>{e.stopPropagation(); navigate(`/projects/${project.id}`)}} className='project-btn'>Open</button>
                    </div>
                  </div>

                  <div className='mt-4 flex items-center justify-between'>
                    <div></div>
                    <div>
                      <span className='project-badge'>{project.user?.name ?? 'SiteBuilder'}</span>
                    </div>
                  </div>
                </div>
                    <div onClick={e => e.stopPropagation()}>
                      <TrashIcon className='absolute top-3 right-3 scale-0 group-hover:scale-100 bg-white p-1.5 size-7 rounded text-red-500 text-xl cursor-pointer transition-all'
                      onClick={()=>deleteProject(project.id)}/>



                    </div>
              </Link>
            ))}
          </div>
          {/* render projects here */}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center h-[80vh] text-center gap-6'>
          <h1 className='text-2xl sm:text-3xl font-bold text-white drop-shadow-md'>You have no projects yet!</h1>

          <button
            onClick={() => navigate('/projects/new')}
            className='px-4 py-2 mt-3 rounded-md bg-[#6670FF] text-white text-base font-medium hover:brightness-105 active:scale-95 transition-transform'
          >
            Create New
          </button>
        </div>

      )}
      </div>
      <Footer />
    </div>
  );
};
export default Community