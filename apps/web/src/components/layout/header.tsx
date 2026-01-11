import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Moon, Sun } from "lucide-react"
import { AppSidebar } from "./app-sidebar"
import { UserNav } from "./user-nav"
import { useTheme } from "@/components/theme-provider"
import { useLocation } from "react-router-dom"

export default function Header() {
    const { setTheme, theme } = useTheme()
    const location = useLocation()

    // Simple breadcrumb logic
    const pathSegments = location.pathname.split("/").filter(Boolean)
    const currentPage = pathSegments[pathSegments.length - 1] || "Overview"

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[240px]">
                    <AppSidebar className="border-none" />
                </SheetContent>
            </Sheet>

            <div className="flex-1">
                <h1 className="text-lg font-semibold capitalize">{currentPage}</h1>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <UserNav />
            </div>
        </header>
    )
}
