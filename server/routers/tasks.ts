import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { router, procedure } from '@/server/trpc'

const prisma = new PrismaClient();

const TaskCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).default('PENDING'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    deadline: z.date().optional(),
    createdById: z.number(),
    teamId: z.number(),
    assigneeIds: z.array(z.number()).optional(),
    tagIds: z.array(z.number()).optional(),
});

const TaskUpdateSchema = z.object({
    id: z.number(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    deadline: z.date().optional(),
    assigneeIds: z.array(z.number()).optional(),
    tagIds: z.array(z.number()).optional(),
});
  
const TaskIdSchema = z.object({
    id: z.number(),
});
  
const CommentCreateSchema = z.object({
    taskId: z.number(),
    userId: z.number(),
    content: z.string().min(1),
});

export const taskRouter = router({
    //Get all tasks
    getTasks: procedure.query(async() => {
        return prisma.task.findMany({
            include: {
                createdBy: true,
                team: true,
                assignees: true,
                tags: true,
                comments: {
                    include: {
                        task: true
                    }
                }
            }
        });
    }),

    //Get task by ID
    getTaskById: procedure
        .input(TaskIdSchema)
        .query(async({ input }) => {
            const task = prisma.task.findUnique({
                where: { id: input.id },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true,
                    comments: {
                        include: {
                            task: true
                        }
                    }
                }
            });

            if(!task) {
                throw new Error('Task not found');
            }

            return task;
        }),

    //Create new task
    createTask: procedure
        .input(TaskCreateSchema)
        .mutation(async({ input }) => {
            const { assigneeIds, tagIds, ...taskData } = input;

            return prisma.task.create({
                data: {
                    ...taskData,
                    assignees: assigneeIds ? {
                        connect: assigneeIds.map(id => ({ id }))
                    } : undefined,
                    tags: tagIds ? {
                        connect: tagIds.map(id => ({ id }))
                    } : undefined
                },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true,
                }
            });
        }),

    //Update task
    updateTask: procedure
        .input(TaskUpdateSchema)
        .mutation(async ({ input }) => {
            const { id, assigneeIds, tagIds, ...updateData } = input;

            return prisma.task.update({
                where: { id },
                data: {
                    ...updateData,
                    assignees: assigneeIds ? {
                        set: assigneeIds.map(id => ({ id }))
                    } : undefined,
                    tags: tagIds ? {
                        set: tagIds.map(id => ({ id }))
                    } : undefined,
                },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true
                }
            });
        }),

    // Delete task
    deleteTask: procedure
        .input(TaskIdSchema)
        .mutation(async ({ input }) => {
            return prisma.task.delete({
                where: { id: input.id }
            });
        }),

    // Add comment to task
    addComment: procedure
        .input(CommentCreateSchema)
        .mutation(async ({ input }) => {
            return prisma.comment.create({
                data: input,
                include: {
                    task: true
                }
            });
        }),

    // Get task comments
    getTaskComments: procedure
        .input(TaskIdSchema)
        .query(async ({ input }) => {
            return prisma.comment.findMany({
                where: {
                    taskId: input.id
                },
                include: {
                    task: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }),

    // Get tasks by status
    getTasksByStatus: procedure
        .input(z.enum(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']))
        .query(async ({ input }) => {
            return prisma.task.findMany({
                where: {
                    status: input
                },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true
                }
            });
        }),

    // Get tasks by priority
    getTasksByPriority: procedure
        .input(z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']))
        .query(async ({ input }) => {
            return prisma.task.findMany({
                where: {
                    priority: input
                },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true
                }
            });
        }),

    // Get tasks by team
    getTasksByTeam: procedure
        .input(z.object({ teamId: z.number() }))
        .query(async ({ input }) => {
            return prisma.task.findMany({
                where: {
                    teamId: input.teamId
                },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true
                }
            });
        }),

    // Update task status
    updateTaskStatus: procedure
        .input(z.object({
            id: z.number(),
            status: z.enum(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
        }))
        .mutation(async ({ input }) => {
            return prisma.task.update({
                where: { id: input.id },
                data: { status: input.status },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true
                }
            });
        }),
})