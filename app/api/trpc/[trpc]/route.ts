import { appRouter } from "@/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) => {
    fetchRequestHandler({
        endpoint: '/api/trpc',
        router: appRouter,
        req,
        createContext: () => ({}),
    }); 
};

export { handler as GET, handler as POST };