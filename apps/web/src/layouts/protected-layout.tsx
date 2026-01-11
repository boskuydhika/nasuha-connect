import { Navigate, Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/layout/app-sidebar"
import Header from "@/components/layout/header"

export default function ProtectedLayout() {
    const token = localStorage.getItem("token")

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="relative min-h-screen md:flex">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block md:w-64">
                <AppSidebar />
            </div>

            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
