import { useState, useEffect, useMemo } from 'react';
import { Crown, Plus, Edit, Trash2, Loader2, Gift, Zap, BookOpen, Tag, Search, ChevronLeft, ChevronRight, Percent, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { usePremium } from '@/hooks/usePremium';
import { useProducts } from '@/hooks/useProducts';
import { PremiumContent, PremiumContentType } from '@/types';

const ITEMS_PER_PAGE = 8;

export default function PremiumContentManager() {
  const { toast } = useToast();
  const { 
    premiumProducts, 
    premiumContent, 
    fetchPremiumProducts, 
    fetchPremiumContent,
    addPremiumProduct,
    removePremiumProduct,
    addPremiumContent,
    updatePremiumContent,
    deletePremiumContent,
  } = usePremium();
  const { products } = useProducts();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [productsPage, setProductsPage] = useState(1);
  const [contentPage, setContentPage] = useState(1);
  
  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isFreeForPremium, setIsFreeForPremium] = useState(false);
  const [premiumDiscountPercent, setPremiumDiscountPercent] = useState(0);
  const [premiumOnly, setPremiumOnly] = useState(false);
  
  // Content modal state
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState<PremiumContent | null>(null);
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [contentType, setContentType] = useState<PremiumContentType>('trick');
  const [contentBody, setContentBody] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [contentActive, setContentActive] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchPremiumProducts(), fetchPremiumContent()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPremiumProducts, fetchPremiumContent]);

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      toast({ title: 'Please select a product', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      await addPremiumProduct(selectedProductId, isFreeForPremium, premiumDiscountPercent, premiumOnly);
      toast({ title: 'Premium product added successfully' });
      setShowProductModal(false);
      resetProductForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveProduct = async (premiumProductId: string) => {
    if (!confirm('Remove this product from premium?')) return;
    
    try {
      await removePremiumProduct(premiumProductId);
      toast({ title: 'Product removed from premium' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove',
        variant: 'destructive',
      });
    }
  };

  const handleSaveContent = async () => {
    if (!contentTitle || !contentType) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      if (editingContent) {
        await updatePremiumContent(editingContent.id, {
          title: contentTitle,
          description: contentDescription,
          content_type: contentType,
          content_body: contentBody,
          content_url: contentUrl,
          is_active: contentActive,
        });
        toast({ title: 'Content updated successfully' });
      } else {
        await addPremiumContent({
          title: contentTitle,
          description: contentDescription,
          content_type: contentType,
          content_body: contentBody,
          content_url: contentUrl,
          is_active: contentActive,
        });
        toast({ title: 'Content added successfully' });
      }
      setShowContentModal(false);
      resetContentForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Delete this content?')) return;
    
    try {
      await deletePremiumContent(contentId);
      toast({ title: 'Content deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const resetProductForm = () => {
    setSelectedProductId('');
    setIsFreeForPremium(false);
    setPremiumDiscountPercent(0);
    setPremiumOnly(false);
  };

  const resetContentForm = () => {
    setEditingContent(null);
    setContentTitle('');
    setContentDescription('');
    setContentType('trick');
    setContentBody('');
    setContentUrl('');
    setContentActive(true);
  };

  const openEditContent = (content: PremiumContent) => {
    setEditingContent(content);
    setContentTitle(content.title);
    setContentDescription(content.description || '');
    setContentType(content.content_type);
    setContentBody(content.content_body || '');
    setContentUrl(content.content_url || '');
    setContentActive(content.is_active);
    setShowContentModal(true);
  };

  const getContentIcon = (type: PremiumContentType) => {
    const icons = {
      trick: Zap,
      guide: BookOpen,
      offer: Tag,
      resource: Gift,
    };
    return icons[type] || Gift;
  };

  const availableProducts = products.filter(
    p => !premiumProducts.some(pp => pp.product_id === p.id)
  );

  // Filter and paginate products
  const filteredProducts = useMemo(() => {
    return premiumProducts.filter(pp => {
      const product = products.find(p => p.id === pp.product_id);
      if (!product) return false;
      return product.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [premiumProducts, products, searchTerm]);

  const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, productsPage]);

  // Filter and paginate content
  const filteredContent = useMemo(() => {
    return premiumContent.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [premiumContent, searchTerm]);

  const totalContentPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
  const paginatedContent = useMemo(() => {
    const start = (contentPage - 1) * ITEMS_PER_PAGE;
    return filteredContent.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContent, contentPage]);

  // Reset page when search changes
  useEffect(() => {
    setProductsPage(1);
    setContentPage(1);
  }, [searchTerm]);

  // Pagination Component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4 border-t mt-4">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={`h-8 w-8 p-0 text-xs ${currentPage === page ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12">
          <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Premium</span> Products
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            Tricks & Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowProductModal(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-2 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-green-700">{premiumProducts.filter(p => p.is_free_for_premium).length}</p>
                <p className="text-[10px] sm:text-xs text-green-600">Free Products</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-2 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-blue-700">{premiumProducts.filter(p => p.premium_discount_percent > 0).length}</p>
                <p className="text-[10px] sm:text-xs text-blue-600">Discounted</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-2 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-amber-700">{premiumProducts.filter(p => p.premium_only).length}</p>
                <p className="text-[10px] sm:text-xs text-amber-600">Exclusive</p>
              </CardContent>
            </Card>
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  {searchTerm ? 'No products match your search' : 'No premium products configured'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setShowProductModal(true)}>
                    Add First Product
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-3 sm:gap-4">
                {paginatedProducts.map((pp) => {
                  const product = products.find(p => p.id === pp.product_id);
                  if (!product) return null;
                  
                  return (
                    <Card key={pp.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:py-4 sm:px-6">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <img 
                              src={product.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=100&q=80'} 
                              alt={product.name}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{product.name}</p>
                              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                                {pp.is_free_for_premium && (
                                  <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs">Free</Badge>
                                )}
                                {pp.premium_discount_percent > 0 && (
                                  <Badge className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs">
                                    {pp.premium_discount_percent}% Off
                                  </Badge>
                                )}
                                {pp.premium_only && (
                                  <Badge className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs">Exclusive</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Original: ₹{product.salePrice} 
                                {pp.is_free_for_premium && ' → FREE'}
                                {pp.premium_discount_percent > 0 && ` → ₹${Math.round(product.salePrice * (1 - pp.premium_discount_percent / 100))}`}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 flex-shrink-0 h-8 w-8 p-0"
                            onClick={() => handleRemoveProduct(pp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <PaginationControls
                currentPage={productsPage}
                totalPages={totalProductPages}
                onPageChange={setProductsPage}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => {
              resetContentForm();
              setShowContentModal(true);
            }} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>

          {/* Content Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-2 sm:p-4 text-center">
                <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600 mx-auto mb-1" />
                <p className="text-lg sm:text-2xl font-bold text-amber-700">{premiumContent.filter(c => c.content_type === 'trick').length}</p>
                <p className="text-[10px] sm:text-xs text-amber-600">Tricks</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-2 sm:p-4 text-center">
                <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-lg sm:text-2xl font-bold text-purple-700">{premiumContent.filter(c => c.content_type === 'guide').length}</p>
                <p className="text-[10px] sm:text-xs text-purple-600">Guides</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-2 sm:p-4 text-center">
                <Tag className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 mx-auto mb-1" />
                <p className="text-lg sm:text-2xl font-bold text-green-700">{premiumContent.filter(c => c.content_type === 'offer').length}</p>
                <p className="text-[10px] sm:text-xs text-green-600">Offers</p>
              </CardContent>
            </Card>
          </div>

          {filteredContent.length === 0 ? (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  {searchTerm ? 'No content matches your search' : 'No premium content yet'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setShowContentModal(true)}>
                    Add First Content
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedContent.map((content) => {
                  const Icon = getContentIcon(content.content_type);
                  return (
                    <Card key={content.id} className={`overflow-hidden hover:shadow-md transition-shadow ${!content.is_active ? 'opacity-50' : ''}`}>
                      <CardContent className="p-3 sm:py-4 sm:px-6">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              content.content_type === 'trick' ? 'bg-amber-100' :
                              content.content_type === 'guide' ? 'bg-purple-100' : 'bg-green-100'
                            }`}>
                              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                content.content_type === 'trick' ? 'text-amber-600' :
                                content.content_type === 'guide' ? 'text-purple-600' : 'text-green-600'
                              }`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{content.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{content.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] sm:text-xs capitalize">
                                  {content.content_type}
                                </Badge>
                                {!content.is_active && (
                                  <Badge variant="secondary" className="text-[10px] sm:text-xs">Inactive</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditContent(content)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <PaginationControls
                currentPage={contentPage}
                totalPages={totalContentPages}
                onPageChange={setContentPage}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-md mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Add Premium Product
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Configure a product for premium members
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Select Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{product.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">₹{product.salePrice}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Free for Premium</Label>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Premium members get this free</p>
                </div>
                <Switch checked={isFreeForPremium} onCheckedChange={setIsFreeForPremium} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Premium Only</Label>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Only visible to premium members</p>
                </div>
                <Switch checked={premiumOnly} onCheckedChange={setPremiumOnly} />
              </div>

              {!isFreeForPremium && (
                <div>
                  <Label className="text-sm font-medium">Premium Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={premiumDiscountPercent}
                    onChange={(e) => setPremiumDiscountPercent(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowProductModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isProcessing} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600">
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Content Modal */}
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="max-w-lg mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              {editingContent ? 'Edit Content' : 'Add Premium Content'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Title *</Label>
              <Input
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="e.g., Free Netflix Trick"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">Type *</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as PremiumContentType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trick">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Trick
                    </div>
                  </SelectItem>
                  <SelectItem value="guide">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      Guide
                    </div>
                  </SelectItem>
                  <SelectItem value="offer">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-500" />
                      Offer
                    </div>
                  </SelectItem>
                  <SelectItem value="resource">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-blue-500" />
                      Resource
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Description</Label>
              <Input
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
                placeholder="Brief description"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">Content Body</Label>
              <Textarea
                value={contentBody}
                onChange={(e) => setContentBody(e.target.value)}
                placeholder="Full content details..."
                rows={5}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">External URL (optional)</Label>
              <Input
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Show this content to premium users</p>
              </div>
              <Switch checked={contentActive} onCheckedChange={setContentActive} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowContentModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveContent} disabled={isProcessing} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600">
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingContent ? 'Update' : 'Add'} Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
