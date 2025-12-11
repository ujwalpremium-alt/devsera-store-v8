import { useState } from 'react';
import { useAdminBundles } from '@/hooks/useBundles';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw,
  Percent,
  Calendar
} from 'lucide-react';

export function BundleManager() {
  const { toast } = useToast();
  const { bundles, isLoading, createBundle, updateBundle, deleteBundle, refetch } = useAdminBundles();
  const { products } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalPrice: '',
    salePrice: '',
    imageUrl: '',
    validUntil: '',
    productIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      originalPrice: '',
      salePrice: '',
      imageUrl: '',
      validUntil: '',
      productIds: [],
    });
    setEditingBundle(null);
  };

  const handleOpenDialog = (bundleId?: string) => {
    if (bundleId) {
      const bundle = bundles.find(b => b.id === bundleId);
      if (bundle) {
        setFormData({
          name: bundle.name,
          description: bundle.description,
          originalPrice: bundle.originalPrice.toString(),
          salePrice: bundle.salePrice.toString(),
          imageUrl: bundle.imageUrl,
          validUntil: bundle.validUntil ? new Date(bundle.validUntil).toISOString().slice(0, 16) : '',
          productIds: bundle.products.map(p => p.id),
        });
        setEditingBundle(bundleId);
      }
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.originalPrice || !formData.salePrice) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingBundle) {
        await updateBundle(editingBundle, {
          name: formData.name,
          description: formData.description,
          originalPrice: parseFloat(formData.originalPrice),
          salePrice: parseFloat(formData.salePrice),
          imageUrl: formData.imageUrl,
          validUntil: formData.validUntil || null,
          productIds: formData.productIds,
        });
        toast({ title: 'Bundle updated successfully' });
      } else {
        await createBundle({
          name: formData.name,
          description: formData.description,
          originalPrice: parseFloat(formData.originalPrice),
          salePrice: parseFloat(formData.salePrice),
          imageUrl: formData.imageUrl,
          validUntil: formData.validUntil || null,
          productIds: formData.productIds,
        });
        toast({ title: 'Bundle created successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;
    
    try {
      await deleteBundle(bundleId);
      toast({ title: 'Bundle deleted successfully' });
    } catch (error) {
      toast({
        title: 'Error deleting bundle',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (bundleId: string, isActive: boolean) => {
    try {
      await updateBundle(bundleId, { isActive });
      toast({ title: isActive ? 'Bundle activated' : 'Bundle deactivated' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const calculateDiscount = (original: number, sale: number) => {
    return Math.round(((original - sale) / original) * 100);
  };

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Offers Management
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border-2 border-black"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Bundle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Bundle Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Premium Entertainment Bundle"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Get Netflix, Spotify, and YouTube Premium at an unbeatable price!"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Original Price (₹) *</Label>
                      <Input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        placeholder="999"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Sale Price (₹) *</Label>
                      <Input
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="599"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Image URL</Label>
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/bundle-image.jpg"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Valid Until (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Select Products to Include</Label>
                      <div className="mt-2 border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                        {products.map((product) => (
                          <div key={product.id} className="flex items-center gap-3">
                            <Checkbox
                              id={product.id}
                              checked={formData.productIds.includes(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                            />
                            <label
                              htmlFor={product.id}
                              className="flex-1 text-sm cursor-pointer"
                            >
                              {product.name} - ₹{product.salePrice}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.productIds.length} products selected
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500">Loading bundles...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No bundles created yet</p>
            <p className="text-sm">Create your first bundle offer to attract more customers!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className={`border-2 rounded-xl p-4 transition-all ${
                  bundle.isActive 
                    ? 'border-purple-200 bg-purple-50/50' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {bundle.imageUrl ? (
                      <img
                        src={bundle.imageUrl}
                        alt={bundle.name}
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                          -{calculateDiscount(bundle.originalPrice, bundle.salePrice)}%
                        </Badge>
                        {!bundle.isActive && (
                          <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500 line-through">₹{bundle.originalPrice}</span>
                        <span className="font-bold text-purple-600">₹{bundle.salePrice}</span>
                        {bundle.validUntil && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Calendar className="h-3 w-3" />
                            Until {new Date(bundle.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bundle.products.map((product) => (
                          <Badge key={product.id} variant="outline" className="text-xs">
                            {product.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                      <Switch
                        checked={bundle.isActive}
                        onCheckedChange={(checked) => handleToggleActive(bundle.id, checked)}
                      />
                      <span className="text-xs text-gray-500">
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(bundle.id)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bundle.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
