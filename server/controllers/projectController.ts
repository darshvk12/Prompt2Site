import { Request, Response} from 'express'
import prisma from '../lib/prisma.js'
import groq from '../configs/openai.js'

// Controller Function to Make Revision
export const  makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;
    try{
            const {projectId} = req.params;
            const {message} = req.body;

            const user = await prisma.user.findUnique({
                where: {id: userId}
            })

            if(!userId || !user){
                return res.status(401).json({ message: 'Unauthorized'});
            }

            if(user.credits < 5){
                return res.status(403).json({message: 'add more credits to make changes'});
            }

            if(!message || message.trim() === ''){
                return res.status(400).json({message: 'Please Enter a valid prompt'});
            }
            

            const currentProject = await prisma.websiteProject.findFirst({
                where: {id: projectId, userId},
                include: {versions: true}
            })

            if(!currentProject){
                return res.status(404).json({message: 'Project not found'});
            }

            await prisma.conversation.create({
                data: {
                    role: 'user',
                    content: message,
                    projectId
                }
            })

            await prisma.user.update({
                where: {id: userId},
                data: {credits: {decrement: 5}}
            })

        // Enhance User Prompt 
                        const promptEnhanceResponse = await groq.chat.completions.create({
                            model: 'openai/gpt-oss-20b',
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are a prompt enhancement specialist for web design. Your task is to expand user requests into comprehensive, detailed specifications that will guide perfect website creation.

ENHANCEMENT RULES:
1. Add specific design details: layout structure, color palette, typography, spacing
2. Define ALL sections/pages: header, hero, content, features, footer, etc.
3. Specify interactive elements: buttons, forms, navigation, animations
4. Detail user experience flows and interactions
5. Include modern web design best practices and UX principles
6. Specify responsive design requirements for mobile, tablet, desktop
7. Add visual hierarchy, branding elements, and professional styling
8. Include any missing important features or sections
9. Be very specific about content and functionality

IMPORTANT:
- Make the enhanced prompt detailed and actionable for a web developer
- Include specific color schemes, layouts, and component descriptions
- Ensure EVERY detail mentioned will be implemented in the final website
- Write 2-4 detailed paragraphs with concrete specifications
- Return ONLY the enhanced prompt, no explanations or commentary`
                                },
                                {
                                    role: 'user',
                                    content: `User's Website Request: "${message}"\n\nPlease create a detailed, comprehensive prompt that will result in a complete, professional website with all requested features fully implemented.`
                                }
                            ]
                        })

                        const  enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

                        await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
                                projectId
                            }
                        })

                        await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: 'Now making changes to your website...',
                                projectId: projectId
                            }
                        })

                        // Generate Website Code
                        const codeGenerationResponse = await groq.chat.completions.create({
                            model: 'openai/gpt-oss-20b',
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are an expert web developer specializing in applying design updates to websites.

CRITICAL REQUIREMENTS:
- Output ONLY valid, complete HTML code (the entire updated website)
- Use Tailwind CSS for ALL styling - NO custom CSS
- Include Tailwind script: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Use Tailwind utility classes for styling, animations, and responsiveness
- Include all interactive JavaScript functionality in <script> tags
- Maintain semantic HTML structure with proper heading hierarchy
- Use responsive design with Tailwind breakpoints (sm:, md:, lg:, xl:)
- Add animations and transitions using Tailwind classes
- Implement EVERY change and enhancement mentioned in the request

OUTPUT RULES:
1. Return ONLY complete HTML code
2. No explanations, comments, or markdown
3. No code fences, triple backticks, or extra formatting
4. Code must be ready to render immediately
5. All changes must be visible and functional`
                                },
                                {
                                    role: 'user',
                                    content: `Update this website HTML with the following changes/enhancements:\n\n${enhancedPrompt}\n\nMake sure to implement ALL the requested changes and maintain the overall structure while improving the design and functionality as requested.`
                                }
                            ]
                        })

                        const code = codeGenerationResponse.choices[0].message.content || ``;

                        if(!code){
                             await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: 'Unable to apply changes to your website. Please try again.',
                                projectId: projectId
                            }
                        })
                        await prisma.user.update({
                            where: {id: userId},
                            data: {credits: {increment: 5}}
                        })
                        return res.status(500).json({message: 'Unable to generate website changes'});
                        }

                        // Clean HTML - remove markdown, code fences, and extra formatting
                        const cleanCode = code
                            .replace(/^```(?:html|HTML)?\n?/gm, '')
                            .replace(/\n?```$/gm, '')
                            .replace(/^```(?:html|HTML)?$/gm, '')
                            .replace(/^'''$/gm, '')
                            .trim();
                        
                        if(!cleanCode){
                             await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: 'Unable to generate valid website code. Please try again.',
                                projectId: projectId
                            }
                        })
                        await prisma.user.update({
                            where: {id: userId},
                            data: {credits: {increment: 5}}
                        })
                        return res.status(500).json({message: 'Unable to generate valid website code'});
                        }

                        const version = await prisma.version.create({
                            data: {
                                code: cleanCode,
                                description: 'changes made',
                                projectId
                            }
                        })

                        await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: 'I have made the changes to your website? You can now preview it',
                                projectId: projectId
                            }
                        })

                        await prisma.websiteProject.update({
                            where: {id: projectId},
                            data: {
                                current_code: cleanCode,
                                current_version_index: version.id

                            }
                        })

                        res.json({message: 'Changes made successfully'})
    }
    catch (error : any){
         await prisma.user.update({
                where: {id: userId},
                data: {credits: {increment: 5}}
            })
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message});
    }
}

// Controller Function to rollback to a specific version
export const rollbackToVersion = async (req: Request, res: Response) => {
try{
    const userId = req.userId   
    if(!userId){
        return res.status(401).json({message: 'Unauthorized'});
    }
    const { projectId, versionId} = req.params;

    const project = await prisma.websiteProject.findFirst({
        where: {id: projectId, userId},
        include: {versions: true}
    })
    if(!project){
        return res.status(404).json({message: 'Project not found'});
    }

    const version = project.versions.find((version)=>version.id === versionId);

    if(!version){
        return res.status(404).json({message: 'Version not found'});
    }
    await prisma.websiteProject.update({
        where: {id: projectId},
        data: {
            current_code: version.code,
            current_version_index: version.id
        }
    })

    await prisma.conversation.create({
       data: {
        role: 'assistant',
        content: "I've rolled back your website to selected version. You can now preview it",
        projectId
       } 
    })

    res.json({message: 'Version rolled back'});

}

    catch(error: any){
        console.log(error.code || error.message );
        res.status(500).json({ message: error.message});

    }
}

// Controller Function to Delete a Project
export const deleteProject = async (req: Request, res: Response) =>{
    try{
       const userId = req.userId;
       const { projectId} = req.params;

       const project = await prisma.websiteProject.findFirst({
         where: {id: projectId, userId}
       })

       if(!project){
         return res.status(404).json({message: 'Project not found'});
       }

       await prisma.websiteProject.delete({
        where: {id: project.id},
       })

       res.json({message: 'Project deleted successfully'});
    }
    catch(error: any){
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});

    }
}

// Controller for getting project code for preview 
export const getProjectPreview = async (req: Request, res: Response) => {
    try {
         const userId = req.userId;
       const { projectId} = req.params;

       if(!userId){
        return res.status(401).json({ message: 'Unauthorized'});
       }

       const project = await prisma.websiteProject.findFirst({
        where: {id: projectId, userId},
        include: {versions: true}
       })

       if(!project){
        return res.status(404).json({ message: 'Project not found'});
       }

       res.json({ project });
    }
    catch(error: any){
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Get Published Projects
export const getPublishedProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.websiteProject.findMany({
            where: {isPublished: true},
            include: {user: true}
                 
        })
        res.json({projects})
    } catch (error: any){
         console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Get a single project by id 
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { projectId} = req.params;
        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId},
                 
        })

        if(!project || project.isPublished === false || !project?.current_code ){
            return res.status(404).json({ message : 'Project not found'});
        }


        res.json({code: project.current_code})
    } catch (error: any){
         console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Controller to save project code 
export const saveProjectCode = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { projectId} = req.params;
        const {code} = req.body;

        if(!userId){
            return res.status(401).json({message: 'Unauthorized'});
        }

        if(!code){
         return res.status(400).json({message: 'Code is required'});   
        }

        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId, userId}
        })

        if(!project){
           return res.status(404).json({ message : 'Project not found'});  
        }

        await prisma.websiteProject.update({
            where: {id: projectId},
            data: {current_code: code, current_version_index: ''}
        }) 
        res.json({message: 'Project saved successfully'})
    } catch (error: any){
         console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}