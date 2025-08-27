import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Menu } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-warm">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border shadow-card">
            <div className="flex items-center h-16 px-6">
              <SidebarTrigger className="mr-4 p-2 hover:bg-accent rounded-md transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-foreground">
                Vending Machine Admin
              </h1>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}