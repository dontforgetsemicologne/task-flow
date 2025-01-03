import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { router, procedure } from '@/server/trpc'

const prisma = new PrismaClient();

const UserCreateSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    role: z.string(),
    department: z.string().optional(),
    avatar: z.string().url().optional(),
    preferences: z.record(z.any()).optional(),
});

const UserUpdateSchema = UserCreateSchema.partial().extend({
    id: z.number()
});
  
const UserIdSchema = z.object({
    id: z.number()
});

export const userRouter = router({
    //Gets all users
    getUsers: procedure.query(async () => {
        return prisma.user.findMany({
            include: {
                assignedTasks: true,
                createdTasks: true,
                teamLeading: true,
                teamMemberships: true
            }
        });
    }),

    //Get user by ID
    getUserById: procedure
        .input(UserIdSchema)
        .query(async ({ input }) => {
            const user = prisma.user.findUnique({ 
                where: { 
                    id: input.id 
                }, 
                include: {
                    assignedTasks: true,
                    createdTasks: true,
                    teamLeading: true,
                    teamMemberships: true
                }
            });
            if(!user) {
                throw new Error('User not found');
            }

            return user;
        }),

    //Create new user
    addUser: procedure
        .input(UserCreateSchema)
        .mutation(async({ input }) => {
            return prisma.user.create({
                data: input,
            });
        }),

    //Update user
    updateUser: procedure
        .input(UserUpdateSchema)
        .mutation(async({ input }) => {
            const { id, ...data } = input;
            return prisma.user.update({
                where: { id },
                data,
            });
        }),

    //Delete user
    deleteUser: procedure
        .input(UserIdSchema)
        .mutation(async({ input }) => {
            return prisma.user.delete({ 
                where: { id: input.id } 
            });
        }),

    //Get user's assigned tasks
    getUserTasks: procedure
        .input(UserIdSchema)
        .query(async({ input }) =>{
            return prisma.task.findMany({
                where: {
                    assignees: {
                        some: {
                            id: input.id
                        }
                    }
                },
                include: {
                    team: true,
                    tags: true,
                    comments: true,
                }
            });
        }),
    
    //Get teams led by User
    getUserTeamsLed: procedure
        .input(UserIdSchema)
        .query(async({ input }) => {
            return prisma.team.findMany({
                where: {
                    leadId: input.id
                },
                include: {
                    members: true,
                    tasks: true
                }
            })
        }),

    //Get user's team memberships
    getUserTeams: procedure
        .input(UserIdSchema)
        .query(async({ input }) => {
            return prisma.team.findMany({
                where: {
                    members: {
                        some: {
                            id: input.id
                        }
                    }
                },
                include: {
                    lead: true,
                    tasks: true
                }
            });
        }),   
})