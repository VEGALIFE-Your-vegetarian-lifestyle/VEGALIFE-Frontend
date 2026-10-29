import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface GoogleCodeResponse {
    code?: string;
    scope?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
}

export interface GoogleCodeClientConfig {
    client_id: string;
    scope?: string;
    ux_mode?: "popup" | "redirect";
    redirect_uri?: string;
    callback: (response: GoogleCodeResponse) => void;
    error_callback?: (error: unknown) => void;
    select_account?: boolean;
}

export interface GoogleCodeClient {
    requestCode: () => void;
}

declare global {
    interface Window {
        google?: {
            accounts?: {
                oauth2?: {
                    initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
                };
            };
        };
    }
}

interface UseGoogleLoginOptions {
    onSuccess: (code: string) => void;
    onError?: (error: unknown) => void;
    scope?: string;
}

export function useGoogleLogin({ onSuccess, onError, scope = "openid email profile" }: UseGoogleLoginOptions) {
    const { t } = useTranslation("auth");
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim() || "http://localhost:5173/login";
    const uxMode = (import.meta.env.VITE_GOOGLE_UX_MODE?.trim() || "redirect") as "popup" | "redirect";

    const [isScriptLoaded, setIsScriptLoaded] = useState(
        typeof window !== "undefined" && Boolean(window.google?.accounts?.oauth2),
    );
    const clientRef = useRef<GoogleCodeClient | null>(null);

    // Only load GIS script if popup mode is explicitly requested
    useEffect(() => {
        if (uxMode !== "popup") return;
        if (typeof window === "undefined" || window.google?.accounts?.oauth2) return;

        const handleLoad = () => setIsScriptLoaded(true);

        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[src="https://accounts.google.com/gsi/client"]',
        );

        if (existingScript) {
            existingScript.addEventListener("load", handleLoad);
            return () => existingScript.removeEventListener("load", handleLoad);
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = handleLoad;
        document.head.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [uxMode]);

    // Initialize GIS code client only when popup mode is used
    useEffect(() => {
        if (uxMode !== "popup" || !isScriptLoaded || !clientId || !window.google?.accounts?.oauth2) return;

        try {
            clientRef.current = window.google.accounts.oauth2.initCodeClient({
                client_id: clientId,
                scope,
                ux_mode: "popup",
                callback: (response: GoogleCodeResponse) => {
                    if (response.error) {
                        const err = new Error(response.error_description || response.error);
                        onError?.(err);
                        return;
                    }
                    if (response.code) {
                        onSuccess(response.code);
                    }
                },
                error_callback: (err: unknown) => {
                    onError?.(err);
                },
            });
        } catch (error) {
            console.error("Failed to initialize Google Code Client:", error);
        }
    }, [uxMode, isScriptLoaded, clientId, scope, onSuccess, onError]);

    const login = useCallback(() => {
        if (!clientId) {
            toast.error(t("googleNotConfigured"));
            return;
        }

        if (uxMode === "redirect") {
            const effectiveRedirectUri =
                redirectUri && redirectUri !== "postmessage"
                    ? redirectUri
                    : `${window.location.origin}/login`;

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: effectiveRedirectUri,
                response_type: "code",
                scope,
                access_type: "offline",
                prompt: "select_account",
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            if (typeof window !== "undefined") {
                if (typeof window.location.assign === "function") {
                    window.location.assign(authUrl);
                } else {
                    window.location.href = authUrl;
                }
            }
            return;
        }

        // Popup mode
        if (!clientRef.current) {
            if (window.google?.accounts?.oauth2) {
                try {
                    const client = window.google.accounts.oauth2.initCodeClient({
                        client_id: clientId,
                        scope,
                        ux_mode: "popup",
                        callback: (response: GoogleCodeResponse) => {
                            if (response.error) {
                                const err = new Error(response.error_description || response.error);
                                onError?.(err);
                                return;
                            }
                            if (response.code) {
                                onSuccess(response.code);
                            }
                        },
                        error_callback: (err: unknown) => {
                            onError?.(err);
                        },
                    });
                    clientRef.current = client;
                    client.requestCode();
                    return;
                } catch (error) {
                    toast.error(t("googleFailed"));
                    onError?.(error);
                    return;
                }
            }
            toast.error(t("googleFailed"));
            return;
        }

        clientRef.current.requestCode();
    }, [clientId, redirectUri, uxMode, scope, onSuccess, onError, t]);

    return {
        login,
        isReady: uxMode === "redirect" ? Boolean(clientId) : Boolean(isScriptLoaded && clientId),
    };
}
