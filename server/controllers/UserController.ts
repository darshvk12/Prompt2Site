import { Request, Response } from "express";
import prisma from "../lib/prisma";
import groq from '../configs/openai.js';
import Stripe from 'stripe';

// Get user Credits 
export const  getUserCredits = async (req: Request, res: Response) => {
    try{
            const userId = req.userId;
            if(!userId){
                return res.status(401).json({ message: 'Unauthorized'});
            }

            const user = await prisma.user.findUnique({
                where: {id: userId}
            })

            res.json({credits: user?.credits})
    }
    catch (error : any){
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message});
    }
}

// Controller function to create new project 
export const  createUserProject = async (req: Request, res: Response) => {
    const userId = req.userId;
    try{
            const { initial_prompt} = req.body;
            if(!userId){
                return res.status(401).json({ message: 'Unauthorized'});
            }

            const user = await prisma.user.findUnique({
                where: {id: userId}
            })

            if(user && user.credits < 5){
                return res.status(403).json({ message: 'add credits to create more projects'});
            }

            // Create a new project
            const project = await prisma.websiteProject.create({
                data: {
                    name: initial_prompt.length > 50 ? initial_prompt.substring(0,47) 
                    + '...' : initial_prompt,
                    initial_prompt,
                    userId
                }
            })

            // Update User's Total Creation
            await prisma.user.update({
            where: {id:userId},
            data: {totalCreation: {increment: 1}}
            })

            await prisma.conversation.create({
                data: {
                    role: 'user',
                    content: initial_prompt,
                    projectId: project.id
                }
            })

            await prisma.user.update({
                where: {id: userId},
                data: {credits: {decrement: 5}}
            })


            // send project id immediately and return to prevent header conflicts
            res.json({projectId: project.id});
            
            // run the remaining logic in the background so that any errors
            // don't attempt to send another response
            (async () => {
                try {
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
                                    content: `User's Website Request: "${initial_prompt}"\n\nPlease create a detailed, comprehensive prompt that will result in a complete, professional website with all requested features fully implemented.`
                                }
                            ]
                        })

                        const  enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

                        await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
                                projectId:  project.id
                            }
                        })

                         await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: 'now generating your website...',
                                projectId:  project.id
                            }
                        })

                        // Generate Website code
                        const codeGenerationResponse = await groq.chat.completions.create({
                            model: 'openai/gpt-oss-20b',
                            messages: [
                                {
                                role: 'system',
                                content: `You are an expert web developer creating high-quality, feature-complete websites.

CRITICAL REQUIREMENTS:
- Output ONLY valid, complete HTML code
- Use Tailwind CSS (v4) for ALL styling - NO custom CSS
- Include: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Use Tailwind classes for styling, animations, and responsiveness
- Create fully interactive JavaScript functionality in <script> tags
- Include proper meta tags, charset, viewport configuration
- Use semantic HTML structure with proper heading hierarchy
- Use professional placeholder images from https://placehold.co/1200x600 or https://placehold.co/600x400
- Implement responsive design with sm:, md:, lg:, xl: Tailwind breakpoints
- Add animations, transitions, and hover effects using Tailwind
- Include accessible form inputs, buttons, and interactive elements
- Ensure all mentioned features are FULLY IMPLEMENTED in the code

FEATURE IMPLEMENTATION REQUIREMENTS:
- Implement EVERY section and feature mentioned in the request
- Add proper navigation between sections
- Include interactive elements (buttons, forms, modals) that actually work
- Ensure visual hierarchy using typography and spacing
- Use Tailwind gradient classes for backgrounds and accents
- Create a cohesive, professional design

OUTPUT RULES:
1. Output ONLY the HTML code - nothing else
2. No explanations, comments, or markdown formatting
3. No code fences or triple backticks
4. Direct HTML output ready to render
5. All content must be visible and functional`
                                },
                                {
                                    role: 'user',
                                    content: `Create a complete website based on this detailed specification:\n\n${enhancedPrompt || ''}`
                                }
                            ]
                        })

                        const code = codeGenerationResponse.choices[0].message.content || '';
                        
                        if(!code){
                            await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: "Unable to generate the code, please try again",
                                projectId: project.id
                            }
                        })
                        await prisma.user.update({
                            where: {id: userId},
                        data: {credits: {increment: 5}}
                    })
                        return;

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
                                content: "Unable to generate valid website code, please try again",
                                projectId: project.id
                            }
                        })
                        await prisma.user.update({
                            where: {id: userId},
                        data: {credits: {increment: 5}}
                    })
                        return;
                        }
                        // Create Version for the Project
                        const version = await prisma.version.create({
                            data: {
                                code: cleanCode,
                                description: 'Initial version',
                                projectId: project.id                        
                            }
                        })

                        await prisma.conversation.create({
                            data: {
                                role: 'assistant',
                                content: "I've created your website! You can now preview it and request any changes.",
                                projectId: project.id
                            }
                        })

                        await prisma.websiteProject.update({
                            where: {id: project.id},
                            data: {
                                    current_code: cleanCode,
                                current_version_index: version.id
                            }
                        })

    }
    catch (error : any){
        try{
            await prisma.user.update({
                where: {id: userId},
                data: {credits: {increment: 5}}
            })
        }catch(e){
            // ignore restore failure
        }
        console.log((error && (error.code || error.message)) || error);
        // Don't send response - headers already sent
    }
            })();
    } catch (error: any) {
        console.log((error && (error.code || error.message)) || error);
        res.status(500).json({ message: error?.message || 'Internal server error'});
    }
}

// Controller Function to Get A Single User Project
export const getUserProject = async (req: Request, res: Response)=> {
    try{
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized'}); 
        }

        const {projectId} = req.params;

        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId, userId},
            include: {
                conversation: {
                    orderBy: {timestamp: 'asc'}
                },
                versions: {orderBy: {timestamp: 'asc'}}
            }
        })

        res.json({project})
    }
     catch (error : any){
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message});
    }
}

// Controller Function to Get All Users Projects
export const getUserProjects = async (req: Request, res: Response)=> {
    try{
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized'}); 
        }

        const projects = await prisma.websiteProject.findMany({
            where: {userId},
            orderBy: { updatedAt: 'desc' }
        })

        res.json({projects})
    }
     catch (error : any){
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message});
    }
}   

// Controller Function to Toggle Project Publish
export const togglePublish = async (req: Request, res: Response)=> {
    try{
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized'}); 
        }


        const {projectId} = req.params;

        const project = await prisma.websiteProject.findFirst({
            where: {id: projectId, userId}
        })

        if(!project){
            return res.status(404).json({message: 'Project not found'});
        }

        await prisma.websiteProject.update({
            where: {id: projectId},
            data: {isPublished: !project.isPublished}
        })

        res.json({message: project.isPublished ? 'Project Unpublished' : 'Project Published Successfully'})
    }
     catch (error : any){
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message});
    }
}

// Controller Function to Purchase Credits 
export const purchaseCredits = async (req: Request, res: Response)=> {
    try {
        interface Plan {
            credits: number;
            amount: number;
        }

        const plans = {
            basic: {credits:  100, amount: 5},
            pro: {credits:  400, amount: 19},
            enterprise: {credits:  1000, amount: 49},

        }
        const userId = req.userId;
        const {planId} = req.body as {planId: keyof typeof plans}
        const origin = req.headers.origin as string;

        const plan: Plan = plans[planId]

        if(!plan){
            return res.status(404).json({ message: 'Plan not found'});
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: userId!,
                planId: req.body.planId,
                amount: plan.amount,
                credits: plan.credits
            }
        })

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/loading`,
            cancel_url: `${origin}`,
            line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `SiteBuilder - ${plan.credits} credits`
                    },
                        unit_amount: Math.floor(transaction.amount) * 100
                },
                quantity: 1 
            },
        ],
            mode: 'payment',
            metadata: {
                transactionId: transaction.id,
                appId: 'SiteBuilder'
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
            });

            res.json({payment_link: session.url})

    } catch (error: any) {
        console.log(error.code || error.message );
        res.status(500).json({message: error.message});
    }
}
