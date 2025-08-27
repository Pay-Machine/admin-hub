import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendWebhookNotification, formatProductForWebhook } from '@/utils/webhook';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar produtos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      setProducts([data, ...products]);
      
      // Enviar webhook para n8n
      await sendWebhookNotification(
        'product_created',
        formatProductForWebhook(data, 'create')
      );

      toast({
        title: 'Produto criado',
        description: `${data.name} foi adicionado com sucesso`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar produto',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(products.map(p => p.id === id ? data : p));
      
      // Enviar webhook para n8n
      await sendWebhookNotification(
        'product_updated',
        formatProductForWebhook(data, 'update')
      );

      toast({
        title: 'Produto atualizado',
        description: `${data.name} foi atualizado com sucesso`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return { error: 'Produto não encontrado' };

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      
      // Enviar webhook para n8n
      await sendWebhookNotification(
        'product_deleted',
        formatProductForWebhook(product, 'delete')
      );

      toast({
        title: 'Produto removido',
        description: `${product.name} foi removido com sucesso`,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao remover produto',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const toggleProductStatus = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return { error: 'Produto não encontrado' };

      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      
      const { data, error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(products.map(p => p.id === id ? data : p));
      
      // Enviar webhook para n8n
      await sendWebhookNotification(
        'product_status_changed',
        formatProductForWebhook(data, 'status_toggle')
      );

      toast({
        title: 'Status atualizado',
        description: `Produto ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    refetch: fetchProducts,
  };
};