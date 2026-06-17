import { useEffect, useState } from 'react'
import type { Project } from '../types';
import { Loader2Icon, TrashIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import api from '@/configs/axios';

const Community: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
      try {
        const { data} = await api.get('/api/project/published');
        setProjects(data.projects)
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
  };

    const deleteProject = async (projectId: string) => {
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
          <div className='flex items-center justify-between mb-12'>
            <h1 className='text-2xl font-medium text-white'>Published Projects</h1>
          </div>

          <div className='flex flex-wrap gap-3.5'>
            {projects.map((project) => (
              <div key={project.id} className='relative group w-72 max-sm:mx-auto cursor-pointer bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-indigo-700/30 hover:border-indigo-800/80 transition-all duration-300'>
                {/* Desktop-like Mini Preview   */}
                <div className='relative w-full h-40 bg-gray-900 overflow-hidden border-b border-gray-800'>
                  {project.current_code ? (
                    <iframe srcDoc={project.current_code} className='absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left pointer-events-none' sandbox='allow-scripts allow-same-origin'
                    style={{transform: 'scale(0.25)'}} />
                  ) : (
                    <div className='flex items-center justify-center h-full text-gray-500'>
                      <p>No Preview</p>
                    </div>
                  )}
                </div>
                  {/* Content */}
                  <div className='p-4 text-white bg-linear-180 from-transparent group-hover:from-indigo-950 to-transparent transition-colors'>
                    <div className='flex items-start justify-between'>
                      <h2 className='text-lg font-medium line-clamp-2'>{project.name}</h2>
                      <span className='project-badge mt-1 ml-2'>Website</span>
                    </div>
                      <p className='text-gray-400 mt-1 text-sm line-clamp-2'>{project.initial_prompt}</p>
                      <div onClick={(e)=>e.stopPropagation()} className='flex justify-between items-center mt-6'>
                      <span className='text-xs text-gray-500'>
                      {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <div className='flex gap-3 text-white text-sm'>
                        <button onClick={()=>navigate(`/preview/${project.id}`)} className='project-btn'>
                          Preview
                        </button>
                        </div>
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <TrashIcon className='absolute top-3 right-3 scale-0 group-hover:scale-100 bg-white p-1.5 size-7 rounded text-red-500 text-xl cursor-pointer transition-all'
                      onClick={()=>deleteProject(project.id)}/>
                    </div>
              </div>
            ))}
          </div> 
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center h-[80vh] text-center gap-6'>
          <h1 className='text-2xl sm:text-3xl font-bold text-white drop-shadow-md'>No published projects yet!</h1>
        </div>

      )}
      </div>
      <Footer />
    </div>
  );
};
export default Community