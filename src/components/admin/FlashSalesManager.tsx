import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useFlashSale, FlashSaleConfig } from '@/hooks/useFlashSale';
import { mockProducts } from '@/data/mockData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Clock, Flame, RefreshCw, Package, IndianRupee } from 'lucide-react';

// Fixed discount amounts in rupees
const DISCOUNT_AMOUNTS = [50, 100, 150, 200, 250, 300, 350];

interface FlashSaleProduct {
  productId: string;
  discountAmount: number; // Fixed discount in rupees
}

export function FlashSalesManager() {
  const { toast } = useToast();
  const { products: dbProducts, isLoading: productsLoading } = useProducts();
  const { config: savedConfig, saveConfig, isExpired, loadConfig } = useFlashSale();
  const products = isSupabaseConfigured && dbProducts.length > 0 ? dbProducts : mockProducts;
  
  const [config, setConfig] = useState<FlashSaleConfig>({
    enabled: true,
    duration_hours: 6,
    min_discount_percent: 10,
    max_products: 5,
    product_ids: [],
    flash_sale_products: [],
    end_time: undefined
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<FlashSaleProduct[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load config from hook - only on initial load
  useEffect(() => {
    if (savedConfig && !initialLoadDone) {
      setConfig(savedConfig);
      setSelectedProducts(savedConfig.flash_sale_products || []);
      setInitialLoadDone(true);
    }
  }, [savedConfig, initialLoadDone]);

  // Check if flash sale has expired
  const isFlashSaleExpired = () => {
    if (!config.end_time) return false;
    return new Date() > new Date(config.end_time);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Calculate end time based on duration
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + config.duration_hours);
      
      const newConfig: FlashSaleConfig = {
        ...config,
        product_ids: selectedProducts.map(p => p.productId),
        flash_sale_products: selectedProducts,
        end_time: endTime.toISOString()
      };
      
      // Save using the hook (saves to both localStorage and Supabase)
      await saveConfig(newConfig);
      
      setConfig(newConfig);
      toast({
        title: 'Flash Sale Started!',
        description: `Flash sale will run for ${config.duration_hours} hours with ${selectedProducts.length} products.`,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStopFlashSale = async () => {
    const newConfig: FlashSaleConfig = {
      ...config,
      enabled: false,
      end_time: new Date().toISOString() // Set end time to now
    };
    
    try {
      await saveConfig(newConfig);
      setConfig(newConfig);
      toast({
        title: 'Flash Sale Stopped',
        description: 'Prices have been reverted to original.',
      });
    } catch (error) {
      toast({
        title: 'Error stopping flash sale',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      if (existing) {
        return prev.filter(p => p.productId !== productId);
      }
      if (prev.length >= config.max_products) {
        toast({
          title: 'Maximum products reached',
          description: `You can only select up to ${config.max_products} products for flash sale.`,
          variant: 'destructive',
        });
        return prev;
      }
      // Default discount of ₹100
      return [...prev, { productId, discountAmount: 100 }];
    });
  };

  const updateProductDiscount = (productId: string, discountAmount: number) => {
    setSelectedProducts(prev => 
      prev.map(p => 
        p.productId === productId 
          ? { ...p, discountAmount } 
          : p
      )
    );
  };

  const getProductDiscount = (productId: string): number => {
    const product = selectedProducts.find(p => p.productId === productId);
    return product?.discountAmount || 100;
  };

  const isProductSelected = (productId: string): boolean => {
    return selectedProducts.some(p => p.productId === productId);
  };

  return (
    <Card className="border-2 border-gray-200 shadow-lg">
      <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Flash Sales Manager</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set fixed discounts on products for limited time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {config.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {config.enabled && config.end_time && !isFlashSaleExpired() && (
              <Button
                onClick={handleStopFlashSale}
                variant="destructive"
                size="sm"
              >
                Stop Sale
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              Duration (hours)
            </Label>
            <Input
              type="number"
              value={config.duration_hours}
              onChange={(e) => setConfig(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 6 }))}
              min={1}
              max={72}
              className="border-2 border-gray-200 focus:border-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              Max Products
            </Label>
            <Input
              type="number"
              value={config.max_products}
              onChange={(e) => setConfig(prev => ({ ...prev, max_products: parseInt(e.target.value) || 5 }))}
              min={1}
              max={10}
              className="border-2 border-gray-200 focus:border-orange-400"
            />
          </div>
          <div className="flex items-end">
            <Badge variant="outline" className="w-full justify-center py-2 border-orange-300 text-orange-600">
              <IndianRupee className="h-4 w-4 mr-1" />
              {selectedProducts.length} products selected
            </Badge>
          </div>
        </div>

        {/* Discount Amount Info */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IndianRupee className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Fixed Discount System</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select products and choose a fixed discount amount (₹50 - ₹350). 
                The discount will be applied during the flash sale period. 
                When the timer ends, prices automatically revert to original.
              </p>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Select Products & Set Discounts</h3>
            <Badge variant="outline" className="w-fit border-orange-300 text-orange-600">
              {selectedProducts.length} / {config.max_products} selected
            </Badge>
          </div>
          
          {productsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No products available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Add products to enable flash sales</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-1">
              {products.filter(p => p.isActive !== false).map((product) => {
                const isSelected = isProductSelected(product.id);
                const currentDiscount = getProductDiscount(product.id);
                const flashPrice = Math.max(0, product.salePrice - currentDiscount);
                
                return (
                  <div
                    key={product.id}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=100&q=80'}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                        onClick={() => toggleProductSelection(product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold text-gray-900 dark:text-white text-sm truncate cursor-pointer"
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">₹{product.salePrice}</span>
                          {product.originalPrice > product.salePrice && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>
                        
                        {/* Discount Selector */}
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleProductSelection(product.id)}
                            className={isSelected ? "bg-orange-500 hover:bg-orange-600" : ""}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                          
                          {isSelected && (
                            <Select
                              value={currentDiscount.toString()}
                              onValueChange={(value) => updateProductDiscount(product.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-28 h-8 text-sm border-orange-300">
                                <SelectValue placeholder="Discount" />
                              </SelectTrigger>
                              <SelectContent>
                                {DISCOUNT_AMOUNTS.map((amount) => (
                                  <SelectItem 
                                    key={amount} 
                                    value={amount.toString()}
                                    disabled={product.salePrice <= amount}
                                  >
                                    -₹{amount}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        
                        {/* Flash Sale Price Preview */}
                        {isSelected && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-red-600 font-medium">Flash Sale Price:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm line-through text-gray-400 dark:text-gray-500">₹{product.salePrice}</span>
                                <span className="text-lg font-bold text-red-600">₹{flashPrice}</span>
                              </div>
                            </div>
                            <Badge className="mt-1 bg-red-500 text-white text-xs">
                              Save ₹{currentDiscount}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedProducts.length > 0 
              ? `Total savings: ₹${selectedProducts.reduce((sum, p) => sum + p.discountAmount, 0)} across ${selectedProducts.length} products`
              : 'Select products to start flash sale'
            }
          </p>
          <Button
            onClick={handleSaveConfig}
            disabled={isSaving || selectedProducts.length === 0}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 mr-2" />
                Start Flash Sale
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
