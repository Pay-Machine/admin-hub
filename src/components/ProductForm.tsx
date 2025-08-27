import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import { useProducts, Product } from "@/hooks/useProducts"

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { createProduct, updateProduct } = useProducts()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    status: product?.status || "active",
    image_url: product?.image_url || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    if (product) {
      await updateProduct(product.id, formData)
    } else {
      await createProduct(formData)
    }
    
    setIsLoading(false)
    onClose()
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          className="border-border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {product ? "Editar Produto" : "Novo Produto"}
          </h2>
          <p className="text-muted-foreground">
            {product ? "Modifique as informações do produto" : "Adicione um novo produto ao catálogo"}
          </p>
        </div>
      </div>

      <Card className="bg-card shadow-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome do Produto*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ex: Chopp 300ml"
                  required
                  className="bg-input border-border focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-foreground">Estoque*</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleChange("stock", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                  className="bg-input border-border focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descreva o produto..."
                rows={3}
                className="bg-input border-border focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-foreground">Preço (R$)*</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                  className="bg-input border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url" className="text-foreground">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url || ""}
                  onChange={(e) => handleChange("image_url", e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="bg-input border-border focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="status" className="text-foreground font-medium">
                  Produto Ativo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Produto aparecerá na lista do sistema
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => handleChange("status", checked ? 'active' : 'inactive')}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-border hover:bg-accent"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : (product ? "Salvar Alterações" : "Criar Produto")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}