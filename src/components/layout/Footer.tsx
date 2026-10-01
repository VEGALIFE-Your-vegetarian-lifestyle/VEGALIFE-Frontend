import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = ["Plant-Based Mains", "Raw & Wholesome", "High-Protein Vegan", "Farm-to-Table Bowls", "Dairy-Free Bakery"];
const quickLinks = [
    "Seasonal Produce Guide",
    "Meal Planner Suite",
    "Local Farmer Markets",
    "Community Stories",
    "Sustainability Report",
];

export function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-dark">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vegan-green-light">
                                <Leaf className="h-5 w-5 text-vegan-green" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">VEGALIFE</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your Vegetarian Lifestyle. Khám phá công thức thực vật, địa điểm xanh và dinh dưỡng cá nhân hoá.
                        </p>
                        <span className="inline-block rounded-full bg-vegan-green-light px-3 py-1 text-xs font-medium text-vegan-green">
                            100% Plant-Powered & Sustainable
                        </span>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-dark">Categories</h4>
                        <ul className="space-y-2">
                            {categories.map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-sm text-muted-foreground hover:text-vegan-green">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-dark">Quick Links</h4>
                        <ul className="space-y-2">
                            {quickLinks.map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-sm text-muted-foreground hover:text-vegan-green">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-dark">Newsletter</h4>
                        <p className="mb-3 text-sm text-muted-foreground">Nhận công thức và mẹo dinh dưỡng mỗi tuần.</p>
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-dark placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-vegan-green"
                            />
                            <Button type="submit" size="sm">
                                Join
                            </Button>
                        </form>
                        <p className="mt-2 text-xs text-muted-foreground">Zero spam policy</p>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
                    <p className="text-xs text-muted-foreground">© 2025 VEGALIFE Inc. All rights reserved.</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <a href="#" className="hover:text-vegan-green">Privacy Policy</a>
                        <a href="#" className="hover:text-vegan-green">Terms of Service</a>
                        <a href="#" className="hover:text-vegan-green">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
