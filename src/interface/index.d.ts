import { JwtPayload } from "jsonwebtoken";

declare global{
    namespace Express{
        interface Request{
            user: JwtPayload
            locale?: string;
            t?: (key: string, fallback?: string) => string;
        }
    }
}