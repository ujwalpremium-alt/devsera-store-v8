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
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Bundle Offers
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border-2 border-black h-8 sm:h-9 px-2 sm:px-3"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Create</span> Bundle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Bundle Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Premium Entertainment Bundle"
                        className="mt-1 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Get Netflix, Spotify, and YouTube Premium at an unbeatable price!"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Original Price (₹) *</Label>
                      <Input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        placeholder="999"
                        className="mt-1 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Sale Price (₹) *</Label>
                      <Input
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="599"
                        className="mt-1 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Image URL</Label>
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/bundle-image.jpg"
                        className="mt-1 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Valid Until (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="mt-1 h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Select Products to Include</Label>
                      <div className="mt-2 border rounded-lg p-3 sm:p-4 max-h-[150px] sm:max-h-[200px] overflow-y-auto space-y-2">
                        {products.map((product) => (
                          <div key={product.id} className="flex items-center gap-2 sm:gap-3">
                            <Checkbox
                              id={product.id}
                              checked={formData.productIds.includes(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                            />
                            <label
                              htmlFor={product.id}
                              className="flex-1 text-xs sm:text-sm cursor-pointer truncate"
                            >
                              {product.name} - ₹{product.salePrice}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.productIds.length} products selected
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 sm:pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      {editingBundle ? 'Update' : 'Create'} Bundle
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {isLoading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading bundles...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No bundles created yet</p>
            <p className="text-xs">Create your first bundle offer!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className={`border-2 rounded-xl p-3 sm:p-4 transition-all ${
                  bundle.isActive 
                    ? 'border-purple-200 bg-purple-50/50' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {bundle.imageUrl ? (
                      <img
                        src={bundle.imageUrl}
                        alt={bundle.name}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg object-cover border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{bundle.name}</h3>
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] sm:text-xs">
                          -{calculateDiscount(bundle.originalPrice, bundle.salePrice)}%
                        </Badge>
                        {!bundle.isActive && (
                          <Badge variant="outline" className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{bundle.description}</p>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-gray-500 dark:text-gray-400 line-through">₹{bundle.originalPrice}</span>
                        <span className="font-bold text-purple-600">₹{bundle.salePrice}</span>
                        {bundle.validUntil && (
                          <span className="flex items-center gap-1 text-amber-600 text-[10px] sm:text-xs">
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">Until</span> {new Date(bundle.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bundle.products.slice(0, 3).map((product) => (
                          <Badge key={product.id} variant="outline" className="text-[10px] sm:text-xs">
                            {product.name}
                          </Badge>
                        ))}
                        {bundle.products.length > 3 && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            +{bundle.products.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    <div className="flex items-center gap-1.5 sm:gap-2 mr-1 sm:mr-2">
                      <Switch
                        checked={bundle.isActive}
                        onCheckedChange={(checked) => handleToggleActive(bundle.id, checked)}
                      />
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(bundle.id)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bundle.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
