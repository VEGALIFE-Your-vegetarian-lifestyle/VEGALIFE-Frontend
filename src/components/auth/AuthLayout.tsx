import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Leaf, MapPin, Utensils } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

const AUTH_BG_IMAGE = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600&auto=format&fit=crop";

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen w-full bg-surface">
            {/* Left side - featured content */}
            <div className="relative hidden w-1/2 overflow-hidden lg:block">
                <img
                    src={AUTH_BG_IMAGE}
                    alt="Vegan food background"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-vegan-green/90 via-vegan-green/70 to-vegan-green/30" />

                <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <Leaf className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">VEGALIFE</span>
                        </Link>
                    </div>

                    <div className="max-w-md">
                        <h2 className="mb-4 text-4xl font-bold leading-tight">
                            Eat Well. <br /> Live Green.
                        </h2>
                        <p className="mb-8 text-lg text-white/90">
                            Khám phá hàng nghìn công thức thực vật, địa điểm ăn chay và trợ lý dinh dưỡng AI cá nhân hoá.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                                <Utensils className="mb-2 h-6 w-6 text-white/80" />
                                <p className="text-2xl font-bold">10,000+</p>
                                <p className="text-sm text-white/70">Plant Recipes</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                                <MapPin className="mb-2 h-6 w-6 text-white/80" />
                                <p className="text-2xl font-bold">450+</p>
                                <p className="text-sm text-white/70">Green Spots</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-white/60">
                        © 2025 VEGALIFE Inc.
                    </div>
                </div>
            </div>

            {/* Right side - form */}
            <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-16">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8 lg:hidden">
                        <Link to="/" className="flex items-center justify-center gap-2 text-dark">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light">
                                <Leaf className="h-5 w-5 text-vegan-green" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">VEGALIFE</span>
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-dark sm:text-3xl">{title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
