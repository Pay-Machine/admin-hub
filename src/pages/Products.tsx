import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Package, Loader2 } from "lucide-react"
import { ProductForm } from "@/components/ProductForm"
import { useProducts, Product } from "@/hooks/useProducts"
import { useLocation, useNavigate } from "react-router-dom"

export default function Products() {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  
  const { products, loading, toggleProductStatus, deleteProduct } = useProducts()

  // Verificar se deve abrir o formulário automaticamente
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('action') === 'add') {
      setShowForm(true)
      // Limpar o parâmetro da URL
      navigate('/products', { replace: true })
    }
  }, [location.search, navigate])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await deleteProduct(id)
  }

  const handleToggleStatus = async (id: string) => {
    await toggleProductStatus(id)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onClose={handleCloseForm}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie os produtos disponíveis na máquina de venda
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="bg-card shadow-card hover:shadow-amber transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-foreground">{product.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                </div>
                <Badge 
                  variant={product.status === 'active' ? "default" : "secondary"}
                  className={product.status === 'active' ? "bg-primary text-primary-foreground" : ""}
                >
                  {product.status === 'active' ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Preço:</span>
                  <span className="text-lg font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estoque:</span>
                  <span className="text-sm font-medium text-foreground">{product.stock} unidades</span>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(product.id)}
                    className="flex-1"
                  >
                    {product.status === 'active' ? (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="bg-card shadow-card">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro produto ao sistema
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-amber text-primary-foreground shadow-amber"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}