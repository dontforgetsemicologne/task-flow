import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { router, procedure } from '@/server/trpc';

const prisma = new PrismaClient();

const TagCreateSchema = z.object({
    name: z.string().min(1),
    color: z.string().optional()
});

const TagUpdateSchema = z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    color: z.string().optional()
});

export const tagRouter = router({
    // Get all tags
    getTags: procedure.query(async () => {
        return prisma.tag.findMany({
            include: {
                tasks: true
            }
        });
    }),
  
    // Get tag by ID
    getTagById: procedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const tag = await prisma.tag.findUnique({
                where: { id: input.id },
                    include: {
                        tasks: true
                    }
            });
            if (!tag) {
                throw new Error('Tag not found');
            }
    
            return tag;
        }),
  
    // Create tag
    createTag: procedure
        .input(TagCreateSchema)
        .mutation(async ({ input }) => {
            return prisma.tag.create({
                data: input,
                include: {
                    tasks: true
                }
            });
        }),
  
    // Update tag
    updateTag: procedure
        .input(TagUpdateSchema)
        .mutation(async ({ input }) => {
            const { id, ...updateData } = input;
  
            return prisma.tag.update({
                where: { id },
                data: updateData,
                include: {
                    tasks: true
                }
            });
        }),
  
    // Delete tag
    deleteTag: procedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.tag.delete({
                where: { id: input.id }
            });
        }),
  
    // Get tasks by tag
    getTasksByTag: procedure
        .input(z.object({ tagId: z.number() }))
        .query(async ({ input }) => {
            return prisma.task.findMany({
                where: {
                    tags: {
                        some: {
                            id: input.tagId
                        }
                    }
                },
                include: {
                    createdBy: true,
                    team: true,
                    assignees: true,
                    tags: true
                }
            });
        }),
});