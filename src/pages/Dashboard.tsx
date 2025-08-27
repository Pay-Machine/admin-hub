import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ToggleLeft, ToggleRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/hooks/useProducts"
import { NavLink } from "react-router-dom"

export default function Dashboard() {
  const { products, loading } = useProducts()

  // Calcular estatísticas reais dos produtos
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(product => product.status === 'active').length,
    inactiveProducts: products.filter(product => product.status === 'inactive').length,
  }

  // Produtos recentes (últimos 3 criados)
  const recentProducts = products
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema de gerenciamento de produtos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card shadow-card hover:shadow-amber transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : stats.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card hover:shadow-amber transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <ToggleRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : stats.activeProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              disponíveis no WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card hover:shadow-amber transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Inativos</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {loading ? "..." : stats.inactiveProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              temporariamente desabilitados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Produtos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
              ) : recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.status === 'active' ? (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhum produto cadastrado ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              asChild 
              className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
            >
              <NavLink to="/products?action=add">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Produto
              </NavLink>
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                asChild 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <NavLink to="/products">
                  Ver Todos os Produtos
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="border-border hover:bg-accent">
                <NavLink to="/reports">
                  Relatórios
                </NavLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}