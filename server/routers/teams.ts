import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { router, procedure } from '@/server/trpc'

const prisma = new PrismaClient();

const TeamCreateSchema = z.object({
    name: z.string().min(1),
    leadId: z.number(),
    memberIds: z.array(z.number()).optional()
});
  
const TeamUpdateSchema = z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    leadId: z.number().optional(),
    memberIds: z.array(z.number()).optional()
});

export const teamRouter = router({
    // Get all teams
    getTeams: procedure.query(async () => {
        return prisma.team.findMany({
            include: {
                lead: true,
                members: true,
                tasks: {
                    include: {
                        assignees: true,
                        tags: true
                    }
                }
            }
        });
    }),
  
    // Get team by ID
    getTeamById: procedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const team = await prisma.team.findUnique({
                where: { id: input.id },
                include: {
                    lead: true,
                    members: true,
                    tasks: {
                        include: {
                            assignees: true,
                            tags: true
                        }
                    }
                }
            });
            if (!team) {
                throw new Error('Team not found');
            }
  
            return team;
        }),
  
    // Create team
    createTeam: procedure
        .input(TeamCreateSchema)
        .mutation(async ({ input }) => {
            const { memberIds, ...teamData } = input;
        
            return prisma.team.create({
                data: {
                    ...teamData,
                    members: memberIds ? {
                        connect: memberIds.map(id => ({ id }))
                    } : undefined
                },
                include: {
                    lead: true,
                    members: true
                }
            });
        }),
  
    // Update team
    updateTeam: procedure
        .input(TeamUpdateSchema)
        .mutation(async ({ input }) => {
            const { id, memberIds, ...updateData } = input;
  
            return prisma.team.update({
                where: { id },
                data: {
                    ...updateData,
                    members: memberIds ? {
                        set: memberIds.map(id => ({ id }))
                    } : undefined
                },
                include: {
                    lead: true,
                    members: true
                }
            });
        }),
  
    // Delete team
    deleteTeam: procedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.team.delete({
                where: { id: input.id }
            });
        }),
  
    // Add member to team
    addTeamMember: procedure
        .input(z.object({ teamId: z.number(), userId: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.team.update({
                where: { id: input.teamId },
                data: {
                    members: {
                        connect: { id: input.userId }
                    }
                },
                include: {
                    members: true
                }
            });
        }),
  
    // Remove member from team
    removeTeamMember: procedure
        .input(z.object({ teamId: z.number(), userId: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.team.update({
                where: { id: input.teamId },
                data: {
                    members: {
                        disconnect: { id: input.userId }
                    }
                },
                include: {
                    members: true
                }
            });
        }),
});

