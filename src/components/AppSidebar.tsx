import { Beer, Package, BarChart3, User, LogOut, Users, FileText } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const baseNavItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Produtos", url: "/products", icon: Package },
]

const superAdminNavItems = [
  { title: "Gerenciar Usuários", url: "/users", icon: Users },
]

// const reportsNavItems = [
//   { title: "Relatórios", url: "/reports", icon: FileText },
// ]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setUserProfile(data);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const navItems = userProfile?.user_role === 'superadmin' 
    ? [...baseNavItems, ...superAdminNavItems]
    : baseNavItems;

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-amber p-2 rounded-lg shadow-amber">
              <Beer className="h-6 w-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  Vending Admin
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestão de Produtos
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-sidebar-foreground/70">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-amber text-foreground shadow-amber border border-primary/20"
                            : "text-foreground bg-card/50 shadow-card border border-border/50 hover:bg-primary/10 hover:shadow-amber hover:border-primary/30"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-muted p-2 rounded-full">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            {!isCollapsed && (
              <div className="text-sm flex-1">
                <p className="font-medium">{userProfile?.full_name || 'Administrador'}</p>
                <p className="text-muted-foreground truncate">{user?.email}</p>
                {userProfile?.user_role === 'superadmin' && (
                  <p className="text-xs text-purple-600 font-medium">Superadmin</p>
                )}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full border-border hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}