export interface JwtPayload {
    sub?: string;
    role?: string;
    status?: string;
    exp?: number;
    [key: string]: unknown;
}

export function decodeJwt<T = JwtPayload>(token: string): T | null {
    try {
        const base64 = token.split(".")[1];
        if (!base64) return null;
        const payload = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(payload) as T;
    } catch {
        return null;
    }
}
