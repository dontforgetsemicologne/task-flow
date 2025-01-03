import { router } from '@/server/trpc'
import { userRouter } from '@/server/routers/users';
import { taskRouter } from '@/server/routers/tasks';
import { teamRouter } from '@/server/routers/teams';
import { tagRouter } from '@/server/routers/tags';

export const appRouter = router({
    userRouter,
    taskRouter,
    teamRouter,
    tagRouter
});

export type AppRouter = typeof appRouter;