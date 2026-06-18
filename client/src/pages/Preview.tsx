import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Version } from "../types";
import { toast } from 'sonner';
import api from '@/configs/axios';
import { authClient } from "@/lib/auth-client";
const Preview = () => {
    const { data: session, isPending} = authClient.useSession()
    const { projectId, versionId} = useParams()
    const [ code, setCode] = useState('');
    const [ loading, setLoading] = useState(true);

    const fetchCode = async () => {
        try{
                const {data} = await api.get(`/api/project/preview/${projectId}`)
                console.log('API Response:', data);
                const projectData = data.project || data;
                console.log('Project Data:', projectData);
                const codeToSet = projectData.current_code || projectData.code || '';
                console.log('Code to set:', codeToSet.substring(0, 100));
                setCode(codeToSet)
                if(versionId && projectData.versions){
                    projectData.versions.forEach((version: Version)=>{
                        if(version.id === versionId){
                            setCode(version.code)
                        }
                    })
                }
                setLoading(false)
        }
        catch(error: any){
            console.error('Error fetching code:', error);
            toast.error(error?.response?.data?.message || error.message);
        }
        }

    useEffect(()=>{
        if(!isPending && session?.user){
            fetchCode()
        }
    },[session?.user])

    if(loading){
        return (
            <div className='flex items-center justify-center h-screen'>
                <Loader2Icon className='size-7 animate-spin text-indigo-200' />
            </div>
        )
    }


    return (
        <div className="h-screen w-full">
            {code ? (
                <ProjectPreview project={{
                    id: '',
                    name: '',
                    initial_prompt: '',
                    current_code: code,
                    createdAt: '',
                    updatedAt: '',
                    userId: '',
                    conversation: [],
                    versions: [],
                    current_version_index: ''
                }}
                    isGenerating={false} showEditorPanel={false}
                
                /> 
            ) : (
                <div className='flex items-center justify-center h-full'>
                    <p className='text-gray-400'>No preview available</p>
                </div>
            )}
        </div>
    )
}

export default Preview
