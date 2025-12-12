import { useState, useEffect, useRef } from 'react';
import { Product, DeliveryType, ProductVariant, ProductStockKey, FulfillmentMethod } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Package, Key, UserCheck, Zap, Search, Filter, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle, Upload, ImageIcon, X, Calendar, Clock, Layers, Database, Copy, FileUp, AlertTriangle, GripVertical, Sparkles, ListChecks, Shield, User, Mail, Lock, Send, MessageCircle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Fulfillment method options - How the product is delivered to customer
const fulfillmentMethodInfo: Record<FulfillmentMethod, { label: string; icon: React.ReactNode; description: string }> = {
  EMAIL: {
    label: 'Email',
    icon: <Mail className="h-4 w-4" />,
    description: 'Credentials/codes sent via email to customer'
  },
  CODE: {
    label: 'Activation Code / License Key',
    icon: <Key className="h-4 w-4" />,
    description: 'Customer receives activation code or license key'
  },
  COUPON_LINK: {
    label: 'Coupon / Redemption Link',
    icon: <Send className="h-4 w-4" />,
    description: 'Customer receives a link to redeem their purchase'
  },
  DASHBOARD: {
    label: 'Website Dashboard (Order Section)',
    icon: <Eye className="h-4 w-4" />,
    description: 'Customer views credentials in their order history on website'
  },
  MANUAL: {
    label: 'Manual Delivery',
    icon: <UserCheck className="h-4 w-4" />,
    description: 'Admin manually delivers the product to customer'
  }
};

const deliveryTypeInfo: Record<DeliveryType, { label: string; icon: React.ReactNode; description: string; color: string; defaultRequirements: string; defaultUserSees: string }> = {
  CREDENTIALS: {
    label: 'Login Credentials',
    icon: <Key className="h-4 w-4" />,
    description: 'Customer receives account login details (email & password)',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    defaultRequirements: 'You need to add stock with Email/Username and Password',
    defaultUserSees: 'Customer will see: Email/Username and Password after purchase'
  },
  COUPON_CODE: {
    label: 'Activation Code / License Key',
    icon: <Package className="h-4 w-4" />,
    description: 'Customer receives a code to activate their subscription',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    defaultRequirements: 'You need to add activation codes or license keys to stock',
    defaultUserSees: 'Customer will see: Activation Code / License Key after purchase'
  },
  MANUAL_ACTIVATION: {
    label: 'Manual Activation (User Provides Account)',
    icon: <UserCheck className="h-4 w-4" />,
    description: 'Customer provides their account details, you activate it manually',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    defaultRequirements: 'Configure the input label below (e.g., "Your Netflix Email")',
    defaultUserSees: 'Customer enters their account details - you can customize the label'
  },
  INSTANT_KEY: {
    label: 'Instant Delivery Key',
    icon: <Zap className="h-4 w-4" />,
    description: 'Pre-loaded keys are automatically delivered after payment',
    color: 'bg-green-100 text-green-700 border-green-300',
    defaultRequirements: 'Add keys to stock - they will be auto-assigned on purchase',
    defaultUserSees: 'Customer will receive key instantly after payment verification'
  }
};

const emptyProduct: Partial<Product> = {
  name: '',
  description: '',
  image: '',
  originalPrice: 0,
  salePrice: 0,
  costPrice: 0,
  duration: '1 Month',
  features: [],
  category: '',
  deliveryType: 'CREDENTIALS',
  deliveryInstructions: '',
  requiresUserInput: false,
  userInputLabel: '',
  requiresPassword: true,
  fulfillmentMethod: 'EMAIL',
  fulfillmentDetails: '',
  customRequirementsLabel: '',
  customUserSeesLabel: '',
  isActive: true,
  hasVariants: false,
  scheduledStart: '',
  scheduledEnd: '',
  lowStockAlert: 5,
  useManualStock: false,
  manualStockCount: 0
};

interface VariantForm {
  id?: string;
  name: string;
  duration: string;
  originalPrice: number;
  salePrice: number;
  costPrice: number;
  isDefault: boolean;
  sortOrder: number;
  deliveryType?: DeliveryType;
  features?: string[];
  featuresText?: string;
}

const emptyVariant: VariantForm = {
  name: '',
  duration: '1 Month',
  originalPrice: 0,
  salePrice: 0,
  costPrice: 0,
  isDefault: false,
  sortOrder: 0,
  features: [],
  featuresText: ''
};

export function ProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New state for variants and stock
  const [activeTab, setActiveTab] = useState('basic');
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [stockKeys, setStockKeys] = useState<ProductStockKey[]>([]);
  const [newStockKey, setNewStockKey] = useState({ keyValue: '', username: '', password: '', expiryDate: '', notes: '', recoveryEmail: '', pin: '' });
  const [bulkKeysText, setBulkKeysText] = useState('');
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const stockFileInputRef = useRef<HTMLInputElement>(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, GIF, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: 'Database not configured',
        description: 'Please connect Supabase to upload images',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        // If bucket doesn't exist, show helpful message
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          toast({
            title: 'Storage not configured',
            description: 'Please create a "product-images" bucket in Supabase Storage',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      setEditingProduct({ ...editingProduct, image: urlData.publicUrl });

      toast({
        title: 'Image uploaded',
        description: 'Product image has been uploaded successfully'
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    
    if (!isSupabaseConfigured) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name || '',
        description: p.description || '',
        image: p.image || '',
        originalPrice: p.original_price || 0,
        salePrice: p.sale_price || 0,
        costPrice: p.cost_price || 0,
        duration: p.duration || '1 Month',
        features: p.features || [],
        category: p.category || 'General',
        deliveryType: (p.delivery_type as DeliveryType) || 'CREDENTIALS',
        deliveryInstructions: p.delivery_instructions || '',
        requiresUserInput: p.requires_user_input || false,
        userInputLabel: p.user_input_label || '',
        requiresPassword: p.requires_password !== false,
        isActive: p.is_active !== false,
        hasVariants: p.has_variants || false,
        scheduledStart: p.scheduled_start || '',
        scheduledEnd: p.scheduled_end || '',
        lowStockAlert: p.low_stock_alert || 5,
        useManualStock: p.use_manual_stock || false,
        manualStockCount: p.manual_stock_count || 0
      }));

      // Load stock counts for each product
      for (const product of mappedProducts) {
        if (product.useManualStock) {
          product.stockCount = product.manualStockCount || 0;
        } else {
          const { count } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)
            .eq('status', 'AVAILABLE');
          product.stockCount = count || 0;
        }
      }

      // Load variants for products with hasVariants
      for (const product of mappedProducts) {
        if (product.hasVariants) {
          const { data: variantsData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id)
            .order('sort_order', { ascending: true });
          
          if (variantsData) {
            product.variants = variantsData.map(v => ({
              id: v.id,
              productId: v.product_id,
              name: v.name,
              duration: v.duration,
              originalPrice: v.original_price,
              salePrice: v.sale_price,
              stockCount: v.stock_count || 0,
              isDefault: v.is_default,
              sortOrder: v.sort_order,
              deliveryType: (v.delivery_type as DeliveryType) || undefined,
              features: v.features || undefined,
              createdAt: v.created_at,
              updatedAt: v.updated_at
            }));
          }
        }
      }

      setProducts(mappedProducts);
    } catch (err: any) {
      console.error('Error loading products:', err);
      toast({
        title: 'Error loading products',
        description: err.message || 'Failed to load products from database',
        variant: 'destructive'
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct({ ...product });
      setFeaturesText(product.features?.join('\n') || '');
      // Load variants if product has variants
      if (product.hasVariants && product.variants) {
        setVariants(product.variants.map(v => ({
          id: v.id,
          name: v.name,
          duration: v.duration,
          originalPrice: v.originalPrice,
          salePrice: v.salePrice,
          costPrice: v.costPrice || 0,
          isDefault: v.isDefault,
          sortOrder: v.sortOrder,
          deliveryType: v.deliveryType,
          features: v.features || [],
          featuresText: v.features?.join('\n') || ''
        })));
      } else {
        setVariants([]);
      }
    } else {
      setEditingProduct({ ...emptyProduct });
      setFeaturesText('');
      setVariants([]);
    }
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFeaturesText('');
    setVariants([]);
    setActiveTab('basic');
  };

  // Variant management functions
  const addVariant = () => {
    setVariants([...variants, { ...emptyVariant, sortOrder: variants.length }]);
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    // If setting as default, unset others
    if (field === 'isDefault' && value === true) {
      updated.forEach((v, i) => {
        if (i !== index) v.isDefault = false;
      });
    }
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Stock management functions
  const openStockDialog = async (product: Product) => {
    setSelectedProductForStock(product);
    setIsStockDialogOpen(true);
    await loadStockKeys(product.id);
  };

  const loadStockKeys = async (productId: string) => {
    if (!isSupabaseConfigured) return;
    
    const { data, error } = await supabase
      .from('product_stock_keys')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setStockKeys(data.map(k => ({
        id: k.id,
        productId: k.product_id,
        variantId: k.variant_id,
        keyType: k.key_type,
        keyValue: k.key_value,
        username: k.username,
        password: k.password,
        additionalData: k.additional_data,
        status: k.status,
        assignedOrderId: k.assigned_order_id,
        expiryDate: k.expiry_date,
        createdAt: k.created_at,
        updatedAt: k.updated_at
      })));
    }
  };

  const addSingleStockKey = async () => {
    if (!selectedProductForStock || !newStockKey.keyValue.trim()) return;
    
    const keyType = selectedProductForStock.deliveryType === 'CREDENTIALS' ? 'CREDENTIALS' : 
                    selectedProductForStock.deliveryType === 'COUPON_CODE' ? 'COUPON_CODE' : 'LICENSE_KEY';
    
    const { error } = await supabase
      .from('product_stock_keys')
      .insert({
        product_id: selectedProductForStock.id,
        key_type: keyType,
        key_value: newStockKey.keyValue.trim(),
        username: newStockKey.username.trim() || null,
        password: newStockKey.password.trim() || null,
        status: 'AVAILABLE'
      });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Key Added', description: 'Stock key added successfully' });
      setNewStockKey({ keyValue: '', username: '', password: '', expiryDate: '', notes: '', recoveryEmail: '', pin: '' });
      await loadStockKeys(selectedProductForStock.id);
      await loadProducts();
    }
  };

  const addBulkStockKeys = async () => {
    if (!selectedProductForStock || !bulkKeysText.trim()) return;
    
    const lines = bulkKeysText.split('\n').filter(l => l.trim());
    const keyType = selectedProductForStock.deliveryType === 'CREDENTIALS' ? 'CREDENTIALS' : 
                    selectedProductForStock.deliveryType === 'COUPON_CODE' ? 'COUPON_CODE' : 'LICENSE_KEY';
    
    const keysToInsert = lines.map(line => {
      // For credentials, use pipe separator (email | password)
      if (selectedProductForStock.deliveryType === 'CREDENTIALS') {
        const parts = line.split('|').map(p => p.trim());
        const username = parts[0] || '';
        const password = parts[1] || '';
        return {
          product_id: selectedProductForStock.id,
          key_type: keyType,
          key_value: username, // Use username as key_value for credentials
          username: username,
          password: password,
          status: 'AVAILABLE'
        };
      } else {
        // For keys/codes, use comma separator
        const parts = line.split(',').map(p => p.trim());
        return {
          product_id: selectedProductForStock.id,
          key_type: keyType,
          key_value: parts[0] || '',
          username: parts[1] || null,
          password: parts[2] || null,
          status: 'AVAILABLE'
        };
      }
    }).filter(k => k.key_value);
    
    if (keysToInsert.length === 0) {
      toast({ title: 'Error', description: 'No valid entries found', variant: 'destructive' });
      return;
    }
    
    const { error } = await supabase
      .from('product_stock_keys')
      .insert(keysToInsert);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Added Successfully', description: `${keysToInsert.length} ${selectedProductForStock.deliveryType === 'CREDENTIALS' ? 'credentials' : 'keys'} added` });
      setBulkKeysText('');
      await loadStockKeys(selectedProductForStock.id);
      await loadProducts();
    }
  };

  const deleteStockKey = async (keyId: string) => {
    if (!confirm('Delete this stock key?')) return;
    
    const { error } = await supabase
      .from('product_stock_keys')
      .delete()
      .eq('id', keyId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Stock key removed' });
      if (selectedProductForStock) {
        await loadStockKeys(selectedProductForStock.id);
        await loadProducts();
      }
    }
  };

  const deleteAllAvailableKeys = async () => {
    if (!selectedProductForStock) return;
    const availableCount = stockKeys.filter(k => k.status === 'AVAILABLE').length;
    if (availableCount === 0) {
      toast({ title: 'No keys to delete', description: 'There are no available keys', variant: 'destructive' });
      return;
    }
    if (!confirm(`Delete all ${availableCount} available stock keys? This cannot be undone.`)) return;
    
    const { error } = await supabase
      .from('product_stock_keys')
      .delete()
      .eq('product_id', selectedProductForStock.id)
      .eq('status', 'AVAILABLE');
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `${availableCount} stock keys removed` });
      await loadStockKeys(selectedProductForStock.id);
      await loadProducts();
    }
  };

  const handleSave = async () => {
    if (!editingProduct?.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!editingProduct?.salePrice || editingProduct.salePrice <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Sale price must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    const productData = {
      name: editingProduct.name.trim(),
      description: editingProduct.description?.trim() || '',
      image: editingProduct.image?.trim() || 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&q=80',
      original_price: editingProduct.originalPrice || editingProduct.salePrice,
      sale_price: editingProduct.salePrice,
      cost_price: editingProduct.costPrice || 0,
      duration: editingProduct.duration || '1 Month',
      features: featuresText.split('\n').filter(f => f.trim()),
      category: editingProduct.category?.trim() || 'General',
      delivery_type: editingProduct.deliveryType || 'CREDENTIALS',
      delivery_instructions: editingProduct.deliveryInstructions?.trim() || '',
      requires_user_input: editingProduct.requiresUserInput || false,
      user_input_label: editingProduct.userInputLabel?.trim() || '',
      requires_password: editingProduct.requiresPassword !== false,
      is_active: editingProduct.isActive !== false,
      has_variants: editingProduct.hasVariants || false,
      scheduled_start: editingProduct.scheduledStart || null,
      scheduled_end: editingProduct.scheduledEnd || null,
      low_stock_alert: editingProduct.lowStockAlert || 5
    };

    if (!isSupabaseConfigured) {
      toast({
        title: 'Database not configured',
        description: 'Please connect Supabase to save products',
        variant: 'destructive'
      });
      setIsSaving(false);
      return;
    }

    try {
      if (editingProduct.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        // Handle variants
        if (editingProduct.hasVariants && variants.length > 0) {
          // Delete existing variants
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', editingProduct.id);
          
          // Insert new variants
          const variantsToInsert = variants.map((v, index) => ({
            product_id: editingProduct.id,
            name: v.name || `${editingProduct.name} - ${v.duration}`,
            duration: v.duration,
            original_price: v.originalPrice,
            sale_price: v.salePrice,
            cost_price: v.costPrice || 0,
            is_default: v.isDefault,
            sort_order: index,
            delivery_type: v.deliveryType || null,
            features: v.featuresText ? v.featuresText.split('\n').filter((f: string) => f.trim()) : null
          }));
          
          await supabase
            .from('product_variants')
            .insert(variantsToInsert);
        }

        toast({
          title: 'Product Updated',
          description: `${productData.name} has been updated successfully.`
        });
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        // Handle variants for new product
        if (editingProduct.hasVariants && variants.length > 0 && newProduct) {
          const variantsToInsert = variants.map((v, index) => ({
            product_id: newProduct.id,
            name: v.name || `${productData.name} - ${v.duration}`,
            duration: v.duration,
            original_price: v.originalPrice,
            sale_price: v.salePrice,
            cost_price: v.costPrice || 0,
            is_default: v.isDefault,
            sort_order: index,
            delivery_type: v.deliveryType || null,
            features: v.featuresText ? v.featuresText.split('\n').filter((f: string) => f.trim()) : null
          }));
          
          await supabase
            .from('product_variants')
            .insert(variantsToInsert);
        }

        toast({
          title: 'Product Created',
          description: `${productData.name} has been added successfully.`
        });
      }

      await loadProducts();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error saving product',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: 'Database not configured',
        description: 'Please connect Supabase to delete products',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Product Deleted',
        description: `${product.name} has been removed successfully.`
      });

      await loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error deleting product',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (product: Product) => {
    if (!isSupabaseConfigured) {
      toast({
        title: 'Database not configured',
        description: 'Please connect Supabase to update products',
        variant: 'destructive'
      });
      return;
    }

    const newStatus = !product.isActive;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(products.map(p =>
        p.id === product.id ? { ...p, isActive: newStatus } : p
      ));

      toast({
        title: newStatus ? 'Product Activated' : 'Product Deactivated',
        description: `${product.name} is now ${newStatus ? 'visible' : 'hidden'} to customers.`
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error updating product',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && product.isActive) ||
      (filterStatus === 'inactive' && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Product Management
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Manage your product catalog and delivery settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducts}
            disabled={isLoading}
            className="border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px] border border-gray-200 dark:border-gray-700 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[150px] border border-gray-200 dark:border-gray-700 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading products...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-5">
              <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {products.length === 0 ? 'No products yet' : 'No products found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-5 max-w-md">
              {products.length === 0 
                ? 'Get started by adding your first product'
                : 'Try adjusting your search or filters'}
            </p>
            {products.length === 0 && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden p-4 space-y-4">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-black bg-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                        }}
                      />
                      {!product.isActive && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <EyeOff className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.duration}</p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs border-gray-300">
                          {product.category || 'General'}
                        </Badge>
                        <span className="font-bold text-[#0A7A7A]">₹{product.salePrice}</span>
                        {product.hasVariants && (
                          <Badge className="text-xs bg-purple-100 text-purple-700 border-0">
                            {product.variants?.length || 0} variants
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${deliveryTypeInfo[product.deliveryType || 'CREDENTIALS'].color}`}>
                          {deliveryTypeInfo[product.deliveryType || 'CREDENTIALS'].icon}
                          <span className="hidden sm:inline">{deliveryTypeInfo[product.deliveryType || 'CREDENTIALS'].label}</span>
                        </div>
                        <button
                          onClick={() => openStockDialog(product)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                            (product.stockCount || 0) === 0
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                              : (product.stockCount || 0) <= (product.lowStockAlert || 5)
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-green-100 text-green-700 border-green-300'
                          }`}
                        >
                          <Database className="h-3 w-3" />
                          {product.stockCount || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(product)}
                      className="border-2 border-black hover:bg-gray-100"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b-2 border-black">
                  <TableHead className="font-bold text-gray-900 dark:text-white">Product</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Category</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Price</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Delivery</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Stock</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Status</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-black bg-gray-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                            }}
                          />
                          {!product.isActive && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <EyeOff className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.duration}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-2 border-gray-300 font-medium">
                        {product.category || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {product.originalPrice > product.salePrice && (
                          <span className="line-through text-gray-400 dark:text-gray-500 text-sm block">
                            ₹{product.originalPrice}
                          </span>
                        )}
                        <span className="font-bold text-[#0A7A7A] text-lg">
                          ₹{product.salePrice}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${deliveryTypeInfo[product.deliveryType || 'CREDENTIALS'].color}`}>
                        {deliveryTypeInfo[product.deliveryType || 'CREDENTIALS'].icon}
                        <span>{deliveryTypeInfo[product.deliveryType || 'CREDENTIALS'].label}</span>
                      </div>
                      {product.hasVariants && (
                        <Badge variant="outline" className="ml-2 text-xs border-purple-300 text-purple-600">
                          <Layers className="h-3 w-3 mr-1" />
                          {product.variants?.length || 0} variants
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => openStockDialog(product)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                          (product.stockCount || 0) === 0
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                            : (product.stockCount || 0) <= (product.lowStockAlert || 5)
                            ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
                            : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                        }`}
                      >
                        {product.useManualStock ? (
                          <Package className="h-3.5 w-3.5" />
                        ) : (
                          <Database className="h-3.5 w-3.5" />
                        )}
                        {product.stockCount || 0} {product.useManualStock ? 'stock' : 'keys'}
                        {(product.stockCount || 0) <= (product.lowStockAlert || 5) && (product.stockCount || 0) > 0 && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                          product.isActive
                            ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Hidden
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                          className="border-2 border-black hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product)}
                          className="border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </>
        )}

        {/* Stats Footer */}
        {products.length > 0 && (
          <div className="border-t-2 border-black bg-gray-50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </span>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
                {products.filter(p => p.isActive).length} Active
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-4 w-4" />
                {products.filter(p => !p.isActive).length} Hidden
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 h-auto bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
              <TabsTrigger value="basic" className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                <Package className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="variants" className="text-xs sm:text-sm py-2">
                <Layers className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Variants</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="text-xs sm:text-sm py-2">
                <Zap className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs sm:text-sm py-2">
                <Calendar className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              {/* Product Name & Description */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-medium text-gray-900 dark:text-white">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g., Netflix Premium"
                    className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A] h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="font-medium text-gray-900 dark:text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={editingProduct?.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Brief description of the product"
                    className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A]"
                    rows={2}
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-lg">💵</span> Pricing
                  {editingProduct?.hasVariants && (
                    <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                      Set per variant
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="originalPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Original Price (₹)
                    </Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      min="0"
                      value={editingProduct?.originalPrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                      placeholder="999"
                      className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A] h-11 bg-white dark:bg-gray-800"
                      disabled={editingProduct?.hasVariants}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salePrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sale Price (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      min="1"
                      value={editingProduct?.salePrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })}
                      placeholder="499"
                      className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A] h-11 bg-white dark:bg-gray-800"
                      disabled={editingProduct?.hasVariants}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPrice" className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <span>💰</span> Vendor Price (₹)
                    </Label>
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      value={editingProduct?.costPrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                      placeholder="299"
                      className="mt-1.5 border-2 border-amber-400 dark:border-amber-600 focus:border-amber-600 bg-amber-50 dark:bg-amber-900/20 h-11"
                      disabled={editingProduct?.hasVariants}
                    />
                  </div>
                </div>
                
                {editingProduct?.salePrice && editingProduct?.costPrice && !editingProduct?.hasVariants ? (
                  <div className="mt-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3">
                    <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                      💰 Profit: ₹{(editingProduct.salePrice - editingProduct.costPrice).toLocaleString()} per sale ({Math.round(((editingProduct.salePrice - editingProduct.costPrice) / editingProduct.salePrice) * 100)}%)
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Duration & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="font-medium text-gray-900 dark:text-white">Duration</Label>
                  <Select
                    value={editingProduct?.duration || '1 Month'}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, duration: value })}
                    disabled={editingProduct?.hasVariants}
                  >
                    <SelectTrigger className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Week">1 Week</SelectItem>
                      <SelectItem value="1 Month">1 Month</SelectItem>
                      <SelectItem value="2 Months">2 Months</SelectItem>
                      <SelectItem value="3 Months">3 Months</SelectItem>
                      <SelectItem value="6 Months">6 Months</SelectItem>
                      <SelectItem value="1 Year">1 Year</SelectItem>
                      <SelectItem value="Lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingProduct?.hasVariants && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Duration is set per variant</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category" className="font-medium text-gray-900 dark:text-white">Category</Label>
                  <Input
                    id="category"
                    value={editingProduct?.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="e.g., Entertainment"
                    className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A] h-11"
                  />
                </div>
              </div>

              {/* Product Image */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#0A7A7A]" /> Product Image
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  {editingProduct?.image && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={editingProduct.image}
                        alt="Product preview"
                        className="w-28 h-28 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#0A7A7A] hover:bg-teal-50 dark:hover:bg-teal-900/20 h-16 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin text-[#0A7A7A]" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload image</span>
                        </>
                      )}
                    </Button>
                    {isUploading && <Progress value={uploadProgress} className="h-2" />}
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={editingProduct?.image || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        placeholder="Or paste image URL..."
                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A] h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Features */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-[#0A7A7A]" /> Product Features
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {featuresText.split('\n').filter(f => f.trim()).length} features
                  </span>
                </div>
                
                {/* Features Preview */}
                {featuresText.split('\n').filter(f => f.trim()).length > 0 && (
                  <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Preview:</p>
                    <div className="flex flex-wrap gap-2">
                      {featuresText.split('\n').filter(f => f.trim()).map((feature, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
                          {feature.trim()}
                          <button
                            type="button"
                            onClick={() => {
                              const features = featuresText.split('\n').filter(f => f.trim());
                              features.splice(idx, 1);
                              setFeaturesText(features.join('\n'));
                            }}
                            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <Textarea
                  id="features"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Enter features (one per line):&#10;• 4K Ultra HD Streaming&#10;• 5 Profiles&#10;• Ad-free Experience&#10;• Download for offline"
                  className="border-2 border-gray-300 dark:border-gray-600 focus:border-[#0A7A7A] font-mono text-sm min-h-[100px] resize-y bg-white dark:bg-gray-800"
                  rows={4}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Enter each feature on a new line. These will be displayed to customers on the product page.
                </p>
              </div>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editingProduct?.hasVariants || false}
                    onCheckedChange={(checked) => {
                      setEditingProduct({ ...editingProduct, hasVariants: checked });
                      if (checked && variants.length === 0) {
                        addVariant();
                      }
                    }}
                  />
                  <div>
                    <Label className="font-semibold text-gray-900 dark:text-white">Enable Product Variants</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allow multiple duration/price options for this product</p>
                  </div>
                </div>
                {editingProduct?.hasVariants && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                    className="border-2 border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variant
                  </Button>
                )}
              </div>

              {editingProduct?.hasVariants && (
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      {/* Variant Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <Layers className="h-4 w-4 text-purple-500" />
                          Variant {index + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={variant.isDefault}
                              onChange={(e) => updateVariant(index, 'isDefault', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-600 dark:text-gray-400">Default</span>
                          </label>
                          {variants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Basic Info Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name (optional)</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) => updateVariant(index, 'name', e.target.value)}
                              placeholder="e.g., Basic Plan"
                              className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                            <Select
                              value={variant.duration}
                              onValueChange={(value) => updateVariant(index, 'duration', value)}
                            >
                              <SelectTrigger className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 Week">1 Week</SelectItem>
                                <SelectItem value="1 Month">1 Month</SelectItem>
                                <SelectItem value="2 Months">2 Months</SelectItem>
                                <SelectItem value="3 Months">3 Months</SelectItem>
                                <SelectItem value="6 Months">6 Months</SelectItem>
                                <SelectItem value="1 Year">1 Year</SelectItem>
                                <SelectItem value="Lifetime">Lifetime</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Pricing Row */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            💵 Pricing
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Original Price (₹)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={variant.originalPrice || ''}
                                onChange={(e) => updateVariant(index, 'originalPrice', Number(e.target.value))}
                                placeholder="999"
                                className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 h-10 bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Sale Price (₹) <span className="text-red-500">*</span></Label>
                              <Input
                                type="number"
                                min="1"
                                value={variant.salePrice || ''}
                                onChange={(e) => updateVariant(index, 'salePrice', Number(e.target.value))}
                                placeholder="499"
                                className="mt-1.5 border-2 border-gray-300 dark:border-gray-600 h-10 bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <span>💰</span> Vendor Price (₹)
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={variant.costPrice || ''}
                                onChange={(e) => updateVariant(index, 'costPrice', Number(e.target.value))}
                                placeholder="299"
                                className="mt-1.5 border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 h-10"
                              />
                            </div>
                          </div>
                          {variant.salePrice && variant.costPrice ? (
                            <div className="mt-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-2.5">
                              <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                                💰 Profit: ₹{(variant.salePrice - variant.costPrice).toLocaleString()} ({Math.round(((variant.salePrice - variant.costPrice) / variant.salePrice) * 100)}%)
                              </p>
                            </div>
                          ) : null}
                        </div>

                        {/* Variant Delivery Type */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Type (optional)</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Overrides product default if set</p>
                          <Select
                            value={variant.deliveryType || ''}
                            onValueChange={(value) => updateVariant(index, 'deliveryType', value === 'DEFAULT' ? undefined : value as DeliveryType)}
                          >
                            <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 h-10">
                              <SelectValue placeholder="Use product default" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DEFAULT">Use product default</SelectItem>
                              <SelectItem value="CREDENTIALS">Login Credentials</SelectItem>
                              <SelectItem value="COUPON_CODE">Coupon/License Key</SelectItem>
                              <SelectItem value="MANUAL_ACTIVATION">Manual Activation</SelectItem>
                              <SelectItem value="INSTANT_KEY">Instant Key</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Variant Features */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                              <ListChecks className="h-4 w-4 text-purple-500" />
                              Variant-Specific Features
                            </Label>
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              {variant.featuresText?.split('\n').filter((f: string) => f.trim()).length || 0} features
                            </span>
                          </div>
                          <Textarea
                            value={variant.featuresText || ''}
                            onChange={(e) => updateVariant(index, 'featuresText', e.target.value)}
                            placeholder="Enter features specific to this variant (one per line)&#10;e.g., 4K Ultra HD&#10;5 Profiles&#10;Ad-free Experience"
                            className="border-2 border-gray-200 dark:border-gray-600 focus:border-purple-400 font-mono text-sm min-h-[80px] resize-y bg-white dark:bg-gray-800"
                            rows={3}
                          />
                          <p className="text-xs text-gray-400 mt-1.5">
                            Leave empty to use product's default features
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-6">
              {/* Section 1: Product Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <Package className="h-5 w-5 text-[#0A7A7A]" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Step 1: What type of activation is this?</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(deliveryTypeInfo) as DeliveryType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditingProduct({
                        ...editingProduct,
                        deliveryType: type,
                        requiresUserInput: type === 'MANUAL_ACTIVATION'
                      })}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        editingProduct?.deliveryType === type
                          ? 'border-[#0A7A7A] bg-teal-50 dark:bg-teal-900/30 ring-2 ring-[#0A7A7A]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          editingProduct?.deliveryType === type 
                            ? 'bg-[#0A7A7A] text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {deliveryTypeInfo[type].icon}
                        </div>
                        <div className="flex-1">
                          <span className={`font-semibold text-sm block ${
                            editingProduct?.deliveryType === type 
                              ? 'text-[#0A7A7A] dark:text-teal-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {deliveryTypeInfo[type].label}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {deliveryTypeInfo[type].description}
                          </p>
                        </div>
                        {editingProduct?.deliveryType === type && (
                          <CheckCircle className="h-5 w-5 text-[#0A7A7A] flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Selected Type Details (Only show when type is selected) */}
              {editingProduct?.deliveryType && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <ListChecks className="h-5 w-5 text-[#0A7A7A]" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Step 2: Customer Requirements Message</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(What users need to know before purchase)</span>
                  </div>

                  <div className={`p-4 rounded-xl border-2 ${deliveryTypeInfo[editingProduct.deliveryType as DeliveryType].color} bg-opacity-50`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-white/50 dark:bg-black/20">
                        {deliveryTypeInfo[editingProduct.deliveryType as DeliveryType].icon}
                      </div>
                      <span className="font-bold">{deliveryTypeInfo[editingProduct.deliveryType as DeliveryType].label}</span>
                    </div>
                    
                    {/* Customer Requirements Message */}
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-gray-700 dark:text-gray-300">
                        📋 Customer Requirements Message
                      </Label>
                      <textarea
                        value={editingProduct?.customUserSeesLabel || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, customUserSeesLabel: e.target.value })}
                        placeholder="e.g., You need to provide your Netflix email and password. Please create an account first if you don't have one."
                        className="w-full text-sm border bg-white dark:bg-gray-800 rounded-md p-2 min-h-[80px] resize-y"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        This message will be shown to customers on the product page. Explain what they need to do or provide.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Fulfillment Method */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <Send className="h-5 w-5 text-[#0A7A7A]" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Step 3: How will you deliver?</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {(Object.keys(fulfillmentMethodInfo) as FulfillmentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, fulfillmentMethod: method })}
                      className={`p-3 border-2 rounded-xl text-center transition-all ${
                        editingProduct?.fulfillmentMethod === method
                          ? 'border-[#0A7A7A] bg-teal-50 dark:bg-teal-900/30 ring-2 ring-[#0A7A7A]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        editingProduct?.fulfillmentMethod === method 
                          ? 'bg-[#0A7A7A] text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {fulfillmentMethodInfo[method].icon}
                      </div>
                      <span className={`font-medium text-xs block ${
                        editingProduct?.fulfillmentMethod === method 
                          ? 'text-[#0A7A7A] dark:text-teal-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {fulfillmentMethodInfo[method].label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Fulfillment Details */}
                {editingProduct?.fulfillmentMethod && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Delivery Timeline (Optional)
                    </Label>
                    <Input
                      value={editingProduct?.fulfillmentDetails || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fulfillmentDetails: e.target.value })}
                      placeholder={`e.g., Delivered within 2 hours via ${fulfillmentMethodInfo[editingProduct.fulfillmentMethod as FulfillmentMethod]?.label || 'selected method'}`}
                      className="text-sm border bg-white dark:bg-gray-800"
                    />
                  </div>
                )}
              </div>

              {/* Section 4: Customer Instructions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <MessageCircle className="h-5 w-5 text-[#0A7A7A]" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Step 4: Post-Purchase Instructions</h3>
                </div>
                
                <div>
                  <Label htmlFor="deliveryInstructions" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Instructions shown to customer after purchase
                  </Label>
                  <Textarea
                    id="deliveryInstructions"
                    value={editingProduct?.deliveryInstructions || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, deliveryInstructions: e.target.value })}
                    placeholder="e.g., Login at netflix.com with the provided credentials. Do not change the password."
                    className="border-2 border-gray-200 dark:border-gray-700 focus:border-[#0A7A7A] dark:bg-gray-800 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>

              {/* Section 5: Manual Activation Settings (Only for MANUAL_ACTIVATION type) */}
              {editingProduct?.deliveryType === 'MANUAL_ACTIVATION' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-300 dark:border-amber-700">
                    <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-700 dark:text-amber-300">Step 5: Manual Activation Settings</h3>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3 mb-4 p-3 bg-amber-100/50 dark:bg-amber-800/30 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>How it works:</strong> Customer provides their account details during checkout. 
                        You manually activate their subscription and mark the order as complete.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
                      <div>
                        <Label className="font-medium text-gray-900 dark:text-white">Collect Customer Account Details</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Enable to ask customer for their account info at checkout</p>
                      </div>
                      <Switch
                        checked={editingProduct?.requiresUserInput || false}
                        onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, requiresUserInput: checked })}
                      />
                    </div>

                    {editingProduct?.requiresUserInput && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                            <Label htmlFor="userInputLabel" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
                              Input Field Label <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="userInputLabel"
                              value={editingProduct?.userInputLabel || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, userInputLabel: e.target.value })}
                              placeholder="e.g., Your Netflix Email"
                              className="border bg-white dark:bg-gray-800"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">Label shown to customer</p>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Password Required?</Label>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">Also collect password from customer</p>
                              <Switch
                                checked={editingProduct?.requiresPassword !== false}
                                onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, requiresPassword: checked })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-amber-300 dark:border-amber-600">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> PREVIEW: Customer checkout form
                          </p>
                          <div className="space-y-3 max-w-sm">
                            <div>
                              <Label className="text-sm text-gray-700 dark:text-gray-300">
                                {editingProduct?.userInputLabel || 'Your Account Email'} <span className="text-red-500">*</span>
                              </Label>
                              <Input 
                                disabled 
                                placeholder="customer@example.com" 
                                className="mt-1 bg-gray-50 dark:bg-gray-700"
                              />
                            </div>
                            {editingProduct?.requiresPassword !== false && (
                              <div>
                                <Label className="text-sm text-gray-700 dark:text-gray-300">
                                  Account Password <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                  disabled 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="mt-1 bg-gray-50 dark:bg-gray-700"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 5: Instant Key Settings (Only for INSTANT_KEY type) */}
              {editingProduct?.deliveryType === 'INSTANT_KEY' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-green-300 dark:border-green-700">
                    <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-bold text-green-700 dark:text-green-300">Step 5: Stock Management</h3>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                    <div className="flex items-start gap-3 mb-4 p-3 bg-green-100/50 dark:bg-green-800/30 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Pre-load license keys/credentials that will be auto-delivered when orders are completed.
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Low Stock Alert Threshold</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editingProduct?.lowStockAlert || 5}
                        onChange={(e) => setEditingProduct({ ...editingProduct, lowStockAlert: Number(e.target.value) })}
                        className="w-32 border bg-white dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Alert when stock falls below this number</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-700">Product Scheduling</span>
                </div>
                <p className="text-sm text-blue-600">
                  Set start and end dates for product availability. Leave empty for always available.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={editingProduct?.scheduledStart ? new Date(editingProduct.scheduledStart).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, scheduledStart: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="mt-1.5 border-2 border-black focus:border-[#0A7A7A]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Product becomes visible at this time</p>
                </div>

                <div>
                  <Label className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={editingProduct?.scheduledEnd ? new Date(editingProduct.scheduledEnd).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, scheduledEnd: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="mt-1.5 border-2 border-black focus:border-[#0A7A7A]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Product becomes hidden after this time</p>
                </div>
              </div>

              {(editingProduct?.scheduledStart || editingProduct?.scheduledEnd) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProduct({ ...editingProduct, scheduledStart: '', scheduledEnd: '' })}
                  className="border-2 border-gray-300"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Schedule
                </Button>
              )}

              {/* Status Section */}
              <div className="flex items-center gap-3 border-t-2 border-gray-200 pt-6 mt-6">
                <Switch
                  checked={editingProduct?.isActive !== false}
                  onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, isActive: checked })}
                />
                <div>
                  <Label className="font-medium">Product is active</Label>
                  <p className="text-xs text-gray-500">Active products are visible to customers</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
              className="border-2 border-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0A7A7A] hover:bg-[#086666] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingProduct?.id ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Management Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="border-b-2 border-black pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Stock Management - {selectedProductForStock?.name}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (selectedProductForStock) {
                    await loadStockKeys(selectedProductForStock.id);
                    await loadProducts();
                    toast({ title: 'Refreshed', description: 'Stock data reloaded' });
                  }
                }}
                className="border-2 border-gray-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Manual Stock Option */}
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Manual Stock Count
                  </h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Set stock count manually without adding individual keys (useful when you don't have pre-loaded keys)
                  </p>
                </div>
                <Switch
                  checked={selectedProductForStock?.useManualStock || false}
                  onCheckedChange={async (checked) => {
                    if (!selectedProductForStock || !isSupabaseConfigured) return;
                    await supabase
                      .from('products')
                      .update({ use_manual_stock: checked })
                      .eq('id', selectedProductForStock.id);
                    setSelectedProductForStock({ ...selectedProductForStock, useManualStock: checked });
                    setProducts(products.map(p => 
                      p.id === selectedProductForStock.id ? { ...p, useManualStock: checked } : p
                    ));
                  }}
                />
              </div>
              
              {selectedProductForStock?.useManualStock && (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-amber-900 font-medium">Stock Count:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValue = Math.max(0, (selectedProductForStock?.manualStockCount || 0) - 10);
                          setSelectedProductForStock({ ...selectedProductForStock, manualStockCount: newValue });
                        }}
                        className="h-8 w-10 border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        -10
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValue = Math.max(0, (selectedProductForStock?.manualStockCount || 0) - 1);
                          setSelectedProductForStock({ ...selectedProductForStock, manualStockCount: newValue });
                        }}
                        className="h-8 w-8 border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        -1
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={selectedProductForStock?.manualStockCount || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setSelectedProductForStock({ ...selectedProductForStock, manualStockCount: value });
                        }}
                        className="w-20 border-2 border-amber-300 text-center font-bold"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValue = (selectedProductForStock?.manualStockCount || 0) + 1;
                          setSelectedProductForStock({ ...selectedProductForStock, manualStockCount: newValue });
                        }}
                        className="h-8 w-8 border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        +1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValue = (selectedProductForStock?.manualStockCount || 0) + 10;
                          setSelectedProductForStock({ ...selectedProductForStock, manualStockCount: newValue });
                        }}
                        className="h-8 w-10 border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        +10
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      if (!selectedProductForStock || !isSupabaseConfigured) return;
                      await supabase
                        .from('products')
                        .update({ manual_stock_count: selectedProductForStock.manualStockCount })
                        .eq('id', selectedProductForStock.id);
                      setProducts(products.map(p => 
                        p.id === selectedProductForStock.id 
                          ? { ...p, manualStockCount: selectedProductForStock.manualStockCount, stockCount: selectedProductForStock.manualStockCount } 
                          : p
                      ));
                      toast({
                        title: 'Stock Updated',
                        description: `Manual stock count set to ${selectedProductForStock.manualStockCount}`,
                      });
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                  >
                    Save Stock Count
                  </Button>
                </div>
              )}
            </div>

            {!selectedProductForStock?.useManualStock && (
              <>
            {/* Stock Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stockKeys.filter(k => k.status === 'AVAILABLE').length}
                </p>
                <p className="text-sm text-green-700">Available</p>
              </div>
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stockKeys.filter(k => k.status === 'ASSIGNED').length}
                </p>
                <p className="text-sm text-blue-700">Assigned</p>
              </div>
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-600">{stockKeys.length}</p>
                <p className="text-sm text-gray-700">Total</p>
              </div>
            </div>

            {/* Add Single Key */}
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Single {selectedProductForStock?.deliveryType === 'CREDENTIALS' ? 'Credential' : 'Key'}
              </h4>
              
              {selectedProductForStock?.deliveryType === 'CREDENTIALS' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Account Credentials</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      Enter the login credentials that will be delivered to the customer after purchase
                    </p>
                  </div>
                  
                  {/* Primary Credentials */}
                  <div className="p-4 border-2 border-gray-200 rounded-lg space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Primary Login Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email / Username <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="user@example.com or username"
                          value={newStockKey.username}
                          onChange={(e) => setNewStockKey({ ...newStockKey, username: e.target.value, keyValue: e.target.value })}
                          className="border-2 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Account password"
                          value={newStockKey.password}
                          onChange={(e) => setNewStockKey({ ...newStockKey, password: e.target.value })}
                          className="border-2 border-gray-300 focus:border-blue-500 font-mono"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Security Info */}
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg space-y-3">
                    <h5 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Additional Security Info (Optional)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Recovery Email</Label>
                        <Input
                          placeholder="recovery@email.com"
                          value={newStockKey.recoveryEmail || ''}
                          onChange={(e) => setNewStockKey({ ...newStockKey, recoveryEmail: e.target.value })}
                          className="border-2 border-gray-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">PIN / Security Code</Label>
                        <Input
                          placeholder="e.g., 1234"
                          value={newStockKey.pin || ''}
                          onChange={(e) => setNewStockKey({ ...newStockKey, pin: e.target.value })}
                          className="border-2 border-gray-200 font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Expiry Date</Label>
                        <Input
                          type="date"
                          value={newStockKey.expiryDate || ''}
                          onChange={(e) => setNewStockKey({ ...newStockKey, expiryDate: e.target.value })}
                          className="border-2 border-gray-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Notes (2FA codes, etc.)</Label>
                        <Input
                          placeholder="Backup codes, special instructions..."
                          value={newStockKey.notes || ''}
                          onChange={(e) => setNewStockKey({ ...newStockKey, notes: e.target.value })}
                          className="border-2 border-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Key/Code Value *"
                    value={newStockKey.keyValue}
                    onChange={(e) => setNewStockKey({ ...newStockKey, keyValue: e.target.value })}
                    className="border-2 border-gray-300"
                  />
                  <Input
                    placeholder="Username (optional)"
                    value={newStockKey.username}
                    onChange={(e) => setNewStockKey({ ...newStockKey, username: e.target.value })}
                    className="border-2 border-gray-300"
                  />
                  <Input
                    placeholder="Password (optional)"
                    value={newStockKey.password}
                    onChange={(e) => setNewStockKey({ ...newStockKey, password: e.target.value })}
                    className="border-2 border-gray-300"
                  />
                </div>
              )}
              
              <Button
                onClick={addSingleStockKey}
                disabled={selectedProductForStock?.deliveryType === 'CREDENTIALS' 
                  ? !newStockKey.username?.trim() || !newStockKey.password?.trim()
                  : !newStockKey.keyValue.trim()
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add {selectedProductForStock?.deliveryType === 'CREDENTIALS' ? 'Credential' : 'Key'}
              </Button>
            </div>

            {/* Bulk Import */}
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                Bulk Import {selectedProductForStock?.deliveryType === 'CREDENTIALS' ? 'Credentials' : 'Keys'}
              </h4>
              {selectedProductForStock?.deliveryType === 'CREDENTIALS' ? (
                <>
                  <p className="text-xs text-purple-700">
                    <strong>Format:</strong> email/username | password (one per line)
                  </p>
                  <div className="p-2 bg-purple-100 rounded text-xs font-mono text-purple-800">
                    user1@email.com | password123<br/>
                    user2@email.com | securePass456<br/>
                    username3 | myPassword789
                  </div>
                </>
              ) : (
                <p className="text-xs text-purple-700">
                  Enter one key per line. Format: key,username,password (username and password are optional)
                </p>
              )}
              <Textarea
                placeholder={selectedProductForStock?.deliveryType === 'CREDENTIALS' 
                  ? "user@email.com | password123\nuser2@email.com | securePass456"
                  : "KEY123\nKEY456,user@email.com,password123\nKEY789"
                }
                value={bulkKeysText}
                onChange={(e) => setBulkKeysText(e.target.value)}
                className="border-2 border-purple-300 font-mono text-sm"
                rows={4}
              />
              <Button
                onClick={addBulkStockKeys}
                disabled={!bulkKeysText.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <FileUp className="h-4 w-4 mr-1" />
                Import {selectedProductForStock?.deliveryType === 'CREDENTIALS' ? 'Credentials' : 'Keys'}
              </Button>
            </div>

            {/* Stock Keys List */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b-2 border-gray-200 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Stock Keys ({stockKeys.length})</h4>
                {stockKeys.filter(k => k.status === 'AVAILABLE').length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteAllAvailableKeys}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete All Available
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {stockKeys.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No stock keys added yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key/Code</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-mono text-sm">
                            {key.keyValue.slice(0, 20)}{key.keyValue.length > 20 ? '...' : ''}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-1"
                              onClick={() => {
                                navigator.clipboard.writeText(key.keyValue);
                                toast({ title: 'Copied!', description: 'Key copied to clipboard' });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm">{key.username || '-'}</TableCell>
                          <TableCell>
                            <Badge className={
                              key.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                              key.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {key.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {key.status === 'AVAILABLE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteStockKey(key.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
