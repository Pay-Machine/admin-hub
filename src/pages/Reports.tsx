import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Package, DollarSign } from "lucide-react"

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Relatórios</h2>
        <p className="text-muted-foreground">
          Análises e métricas do sistema de gerenciamento de produtos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              +0% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0</div>
            <p className="text-xs text-muted-foreground">
              vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produto Mais Vendido</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">-</div>
            <p className="text-xs text-muted-foreground">
              nenhuma venda registrada
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0%</div>
            <p className="text-xs text-muted-foreground">
              taxa de vendas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Vendas por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              Gráfico de vendas por produto será exibido aqui quando houver dados
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Evolução de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              Gráfico de evolução de vendas será exibido aqui quando houver dados
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Relatórios Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Esta seção será desenvolvida para incluir:</p>
            <ul className="list-disc list-inside mt-4 text-left max-w-md mx-auto space-y-2">
              <li>Relatório de vendas por período</li>
              <li>Análise de produtos mais populares</li>
              <li>Relatório de estoque baixo</li>
              <li>Análise de receita e lucro</li>
              <li>Exportação de dados em PDF/Excel</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}