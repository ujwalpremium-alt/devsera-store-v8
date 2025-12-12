import { useState, useEffect } from 'react';
import { useAdminOrders } from '@/hooks/useOrders';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Eye, Key, Package, UserCheck, Zap, User, Clock, AlertCircle, Mail, Trash2, RefreshCw, Database, Copy } from 'lucide-react';
import { Order, OrderCredentials, DeliveryType, OrderStatus } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const deliveryTypeLabels: Record<DeliveryType, { label: string; icon: React.ReactNode }> = {
  CREDENTIALS: { label: 'Login Credentials', icon: <Key className="h-4 w-4" /> },
  COUPON_CODE: { label: 'Coupon/License Key', icon: <Package className="h-4 w-4" /> },
  MANUAL_ACTIVATION: { label: 'Manual Activation', icon: <UserCheck className="h-4 w-4" /> },
  INSTANT_KEY: { label: 'Instant Key', icon: <Zap className="h-4 w-4" /> }
};

export function OrderVerificationPanel() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('SUBMITTED');
  const [credentials, setCredentials] = useState<OrderCredentials>({
    username: '',
    password: '',
    couponCode: '',
    licenseKey: '',
    activationLink: '',
    activationStatus: '',
    activationNotes: '',
    expiryDate: '',
    additionalInfo: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [availableStockCount, setAvailableStockCount] = useState(0);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const { toast } = useToast();
  const { orders: dbOrders, approveOrder, rejectOrder, deleteOrder } = useAdminOrders();

  // Use database orders with their actual product data
  const orders = dbOrders;

  // Load available stock when order is selected
  useEffect(() => {
    const loadAvailableStock = async () => {
      if (!selectedOrder?.product?.id || !isSupabaseConfigured) {
        setAvailableStockCount(0);
        return;
      }

      setIsLoadingStock(true);
      try {
        // Check if product uses manual stock
        const { data: productData } = await supabase
          .from('products')
          .select('use_manual_stock, manual_stock_count')
          .eq('id', selectedOrder.product.id)
          .single();

        if (productData?.use_manual_stock) {
          setAvailableStockCount(productData.manual_stock_count || 0);
        } else {
          // Count available stock keys
          const { count } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', selectedOrder.product.id)
            .eq('status', 'AVAILABLE');
          setAvailableStockCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading stock:', error);
      } finally {
        setIsLoadingStock(false);
      }
    };

    loadAvailableStock();
  }, [selectedOrder?.product?.id]);

  // Auto-fill credentials from stock key
  const autoFillFromStock = async () => {
    if (!selectedOrder?.product?.id || !isSupabaseConfigured) return;

    setIsLoadingStock(true);
    try {
      const { data: stockKey } = await supabase
        .from('product_stock_keys')
        .select('*')
        .eq('product_id', selectedOrder.product.id)
        .eq('status', 'AVAILABLE')
        .limit(1)
        .single();

      if (stockKey) {
        const deliveryType = getDeliveryType(selectedOrder);
        
        if (deliveryType === 'CREDENTIALS') {
          setCredentials(prev => ({
            ...prev,
            username: stockKey.username || stockKey.key_value || '',
            password: stockKey.password || '',
          }));
        } else if (deliveryType === 'COUPON_CODE' || deliveryType === 'INSTANT_KEY') {
          setCredentials(prev => ({
            ...prev,
            couponCode: stockKey.key_value || '',
            licenseKey: stockKey.key_value || '',
          }));
        }

        toast({
          title: 'Auto-filled from stock',
          description: 'Credentials loaded from available stock key',
        });
      } else {
        toast({
          title: 'No stock available',
          description: 'No available stock keys found for this product',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load stock key',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);
  
  const submittedOrders = orders.filter(o => o.status === 'SUBMITTED');

  const getDeliveryType = (order: Order): DeliveryType => {
    return order.product?.deliveryType || 'CREDENTIALS';
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;

    const deliveryType = getDeliveryType(selectedOrder);
    let isValid = false;
    let credentialsToSend: OrderCredentials = { expiryDate: credentials.expiryDate };

    switch (deliveryType) {
      case 'CREDENTIALS':
        isValid = !!(credentials.username && credentials.password && credentials.expiryDate);
        credentialsToSend = {
          username: credentials.username,
          password: credentials.password,
          expiryDate: credentials.expiryDate,
          additionalInfo: credentials.additionalInfo
        };
        break;
      case 'COUPON_CODE':
        isValid = !!(credentials.couponCode || credentials.licenseKey || credentials.activationLink);
        credentialsToSend = {
          couponCode: credentials.couponCode,
          licenseKey: credentials.licenseKey,
          activationLink: credentials.activationLink,
          expiryDate: credentials.expiryDate,
          additionalInfo: credentials.additionalInfo
        };
        break;
      case 'MANUAL_ACTIVATION':
        isValid = !!credentials.activationStatus;
        credentialsToSend = {
          activationStatus: credentials.activationStatus,
          activationNotes: credentials.activationNotes,
          expiryDate: credentials.expiryDate,
          additionalInfo: credentials.additionalInfo
        };
        break;
      case 'INSTANT_KEY':
        isValid = !!credentials.licenseKey;
        credentialsToSend = {
          licenseKey: credentials.licenseKey,
          expiryDate: credentials.expiryDate,
          additionalInfo: credentials.additionalInfo
        };
        break;
    }

    if (!isValid) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isSupabaseConfigured) {
        await approveOrder(selectedOrder.id, credentialsToSend);
      }
      toast({
        title: 'Order approved!',
        description: 'Credentials sent to user. Loyalty points awarded automatically.',
      });
      setSelectedOrder(null);
      resetCredentials();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetCredentials = () => {
    setCredentials({
      username: '',
      password: '',
      couponCode: '',
      licenseKey: '',
      activationStatus: '',
      activationNotes: '',
      expiryDate: '',
      additionalInfo: ''
    });
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || !selectedOrder) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isSupabaseConfigured) {
        await rejectOrder(selectedOrder.id, rejectionReason);
      }
      toast({
        title: 'Order rejected',
        description: 'User has been notified of the cancellation.',
      });
      setSelectedOrder(null);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      if (isSupabaseConfigured) {
        await deleteOrder(orderId);
      }
      toast({
        title: 'Order deleted',
        description: 'The order has been permanently removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderCredentialsForm = (deliveryType: DeliveryType) => {
    switch (deliveryType) {
      case 'CREDENTIALS':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Account Credentials</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                These credentials will be delivered to the customer
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <User className="h-3 w-3" />
                  Email / Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="user@service.com"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <Key className="h-3 w-3" />
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="text"
                  placeholder="SecurePass123"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        );
      case 'COUPON_CODE':
        return (
          <>
            <div>
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input
                id="couponCode"
                placeholder="PROMO-XXXX-XXXX"
                value={credentials.couponCode}
                onChange={(e) => setCredentials({ ...credentials, couponCode: e.target.value })}
                className="border-2 border-black font-mono"
              />
            </div>
            <div>
              <Label htmlFor="licenseKey">License Key</Label>
              <Input
                id="licenseKey"
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                value={credentials.licenseKey}
                onChange={(e) => setCredentials({ ...credentials, licenseKey: e.target.value })}
                className="border-2 border-black font-mono"
              />
            </div>
            <div>
              <Label htmlFor="activationLink">Activation Link (Optional)</Label>
              <Input
                id="activationLink"
                placeholder="https://example.com/activate?code=..."
                value={credentials.activationLink}
                onChange={(e) => setCredentials({ ...credentials, activationLink: e.target.value })}
                className="border-2 border-black"
              />
              <p className="text-xs text-muted-foreground mt-1">User can click this link to activate their product</p>
            </div>
          </>
        );
      case 'MANUAL_ACTIVATION':
        return (
          <>
            <div>
              <Label htmlFor="activationStatus">Activation Status *</Label>
              <Input
                id="activationStatus"
                placeholder="e.g., Activated, Added to Family Plan"
                value={credentials.activationStatus}
                onChange={(e) => setCredentials({ ...credentials, activationStatus: e.target.value })}
                className="border-2 border-black"
              />
            </div>
            <div>
              <Label htmlFor="activationNotes">Activation Notes</Label>
              <Textarea
                id="activationNotes"
                placeholder="Any additional instructions for the user..."
                value={credentials.activationNotes}
                onChange={(e) => setCredentials({ ...credentials, activationNotes: e.target.value })}
                className="border-2 border-black"
              />
            </div>
          </>
        );
      case 'INSTANT_KEY':
        return (
          <div>
            <Label htmlFor="licenseKey">License Key *</Label>
            <Input
              id="licenseKey"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              value={credentials.licenseKey}
              onChange={(e) => setCredentials({ ...credentials, licenseKey: e.target.value })}
              className="border-2 border-black font-mono"
            />
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Order Management
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          Review payment screenshots and approve or reject orders
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as OrderStatus | 'ALL')}>
          <TabsList className="bg-gray-100 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 rounded-xl p-1.5 inline-flex min-w-max gap-1.5">
            <TabsTrigger value="SUBMITTED" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Pending</span> ({submittedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all">
              All ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Completed</span>
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Awaiting</span>
            </TabsTrigger>
            <TabsTrigger value="CANCELLED" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all">
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Cancelled</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-10 sm:p-14 text-center border border-gray-100 dark:border-gray-700/50">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {filterStatus === 'SUBMITTED' ? 'All caught up!' : 'No orders found'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2">
            {filterStatus === 'SUBMITTED' 
              ? 'No orders pending verification' 
              : `No ${filterStatus === 'ALL' ? '' : filterStatus.toLowerCase()} orders`}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                {order.product && (
                  <img
                    src={order.product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
                    alt={order.product.name}
                    className="w-full sm:w-24 h-36 sm:h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                        {order.product?.name || 'Unknown Product'}
                      </h3>
                      <p className="text-xs sm:text-sm font-mono text-gray-500 dark:text-gray-400">
                        ID: {order.id.slice(0, 8)}...
                      </p>
                      {order.profile && (
                        <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-1.5 font-medium">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">{order.profile.full_name || order.profile.email}</span>
                        </p>
                      )}
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                    <span className="truncate max-w-[100px] sm:max-w-none">
                      {new Date(order.updatedAt).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-primary">
                      ₹{order.product?.salePrice}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center gap-1">
                      {deliveryTypeLabels[order.product?.deliveryType || 'CREDENTIALS'].icon}
                      {deliveryTypeLabels[order.product?.deliveryType || 'CREDENTIALS'].label}
                    </span>
                  </div>
                  {order.userProvidedInput && (() => {
                    const copyToClipboard = (text: string, label: string) => {
                      navigator.clipboard.writeText(text);
                      toast({ title: 'Copied!', description: `${label} copied to clipboard` });
                    };
                    try {
                      const parsed = JSON.parse(order.userProvidedInput);
                      if (parsed.email && parsed.password) {
                        return (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-sm space-y-1">
                            <div className="flex items-center justify-between gap-2 text-blue-700 dark:text-blue-300">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Email: <span className="font-mono font-semibold">{parsed.email}</span>
                              </span>
                              <button onClick={() => copyToClipboard(parsed.email, 'Email')} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded" title="Copy email">
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-blue-700 dark:text-blue-300">
                              <span className="flex items-center gap-1">
                                <Key className="h-3 w-3" />
                                Password: <span className="font-mono font-semibold">{parsed.password}</span>
                              </span>
                              <button onClick={() => copyToClipboard(parsed.password, 'Password')} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded" title="Copy password">
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }
                    } catch {
                      // Not JSON, show as plain text
                    }
                    return (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-sm">
                        <div className="flex items-center justify-between gap-2 text-blue-700 dark:text-blue-300">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            User's Account: <span className="font-mono font-semibold">{order.userProvidedInput}</span>
                          </span>
                          <button onClick={() => copyToClipboard(order.userProvidedInput!, 'Account')} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded" title="Copy">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {order.status === 'SUBMITTED' ? (
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      className="brutalist-button bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Review</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteOrder(order.id)}
                      variant="outline"
                      className="border-2 border-red-500 text-red-500 hover:bg-red-50 h-8 sm:h-10 px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      variant="outline"
                      className="border-2 border-black h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteOrder(order.id)}
                      variant="outline"
                      className="border-2 border-red-500 text-red-500 hover:bg-red-50 h-8 sm:h-10 px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="brutalist-card max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold font-['Space_Grotesk']">
              Verify Order
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Screenshot Preview */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold font-['Space_Grotesk'] mb-2">
                    Payment Screenshot
                  </h3>
                  <div className="brutalist-card overflow-hidden">
                    <img
                      src={selectedOrder.paymentScreenshot || 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80'}
                      alt="Payment proof"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="brutalist-card p-4 bg-muted/30">
                  <h4 className="font-semibold mb-2">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono">{selectedOrder.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-semibold">{selectedOrder.product?.name || 'Unknown Product'}</span>
                    </div>
                    {selectedOrder.profile && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-semibold text-blue-600">{selectedOrder.profile.full_name || selectedOrder.profile.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold text-primary">₹{selectedOrder.product?.salePrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Delivery Type:</span>
                      <span className="flex items-center gap-1 font-semibold">
                        {deliveryTypeLabels[getDeliveryType(selectedOrder)].icon}
                        {deliveryTypeLabels[getDeliveryType(selectedOrder)].label}
                      </span>
                    </div>
                    {selectedOrder.userProvidedInput && (() => {
                      const copyToClipboard = (text: string, label: string) => {
                        navigator.clipboard.writeText(text);
                        toast({ title: 'Copied!', description: `${label} copied to clipboard` });
                      };
                      try {
                        const parsed = JSON.parse(selectedOrder.userProvidedInput);
                        if (parsed.email && parsed.password) {
                          return (
                            <div className="pt-2 border-t space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-muted-foreground">User's Email:</span>
                                  <p className="font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                    {parsed.email}
                                  </p>
                                </div>
                                <button onClick={() => copyToClipboard(parsed.email, 'Email')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Copy email">
                                  <Copy className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-muted-foreground">User's Password:</span>
                                  <p className="font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                    {parsed.password}
                                  </p>
                                </div>
                                <button onClick={() => copyToClipboard(parsed.password, 'Password')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Copy password">
                                  <Copy className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                </button>
                              </div>
                            </div>
                          );
                        }
                      } catch {
                        // Not JSON, show as plain text
                      }
                      return (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-muted-foreground">User's Account:</span>
                              <p className="font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                {selectedOrder.userProvidedInput}
                              </p>
                            </div>
                            <button onClick={() => copyToClipboard(selectedOrder.userProvidedInput!, 'Account')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Copy">
                              <Copy className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="space-y-6">
                {selectedOrder.status === 'SUBMITTED' ? (
                  <>
                    {/* Stock Info Banner */}
                    <div className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                      availableStockCount > 0 
                        ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                        : 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Database className={`h-5 w-5 ${availableStockCount > 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <div>
                          <p className={`font-semibold ${availableStockCount > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isLoadingStock ? 'Loading...' : `${availableStockCount} keys available`}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Stock will be auto-deducted on approval
                          </p>
                        </div>
                      </div>
                      {availableStockCount > 0 && getDeliveryType(selectedOrder) !== 'MANUAL_ACTIVATION' && (
                        <Button
                          onClick={autoFillFromStock}
                          disabled={isLoadingStock}
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingStock ? 'animate-spin' : ''}`} />
                          Auto-fill
                        </Button>
                      )}
                    </div>

                    {/* Approve Section */}
                    <div className="brutalist-card p-6 border-green-500">
                      <h3 className="font-bold font-['Space_Grotesk'] mb-4 text-green-600 flex items-center gap-2">
                        {deliveryTypeLabels[getDeliveryType(selectedOrder)].icon}
                        Approve Order - {deliveryTypeLabels[getDeliveryType(selectedOrder)].label}
                      </h3>
                      <div className="space-y-4">
                        {renderCredentialsForm(getDeliveryType(selectedOrder))}
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            type="date"
                            value={credentials.expiryDate}
                            onChange={(e) => setCredentials({ ...credentials, expiryDate: e.target.value })}
                            className="border-2 border-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="additionalInfo">Additional Info (Optional)</Label>
                          <Textarea
                            id="additionalInfo"
                            placeholder="Any extra instructions for the user..."
                            value={credentials.additionalInfo}
                            onChange={(e) => setCredentials({ ...credentials, additionalInfo: e.target.value })}
                            className="border-2 border-black"
                            rows={2}
                          />
                        </div>
                        <Button
                          onClick={handleApprove}
                          className="w-full brutalist-button bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve & Send to User
                        </Button>
                      </div>
                    </div>

                    {/* Reject Section */}
                    <div className="brutalist-card p-6 border-red-500">
                      <h3 className="font-bold font-['Space_Grotesk'] mb-4 text-red-600">
                        Reject Order
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reason">Rejection Reason</Label>
                          <Textarea
                            id="reason"
                            placeholder="e.g., Invalid payment screenshot, amount mismatch..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="border-2 border-black min-h-[100px]"
                          />
                        </div>
                        <Button
                          onClick={handleReject}
                          variant="destructive"
                          className="w-full brutalist-button"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Order
                        </Button>
                      </div>
                    </div>
                  </>
                ) : selectedOrder.status === 'COMPLETED' && selectedOrder.credentials ? (
                  <div className="brutalist-card p-6 border-green-500">
                    <h3 className="font-bold font-['Space_Grotesk'] mb-4 text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Delivered Credentials
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedOrder.credentials.username && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Username:</span>
                          <span className="font-mono font-semibold">{selectedOrder.credentials.username}</span>
                        </div>
                      )}
                      {selectedOrder.credentials.password && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Password:</span>
                          <span className="font-mono font-semibold">{selectedOrder.credentials.password}</span>
                        </div>
                      )}
                      {selectedOrder.credentials.couponCode && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coupon Code:</span>
                          <span className="font-mono font-semibold">{selectedOrder.credentials.couponCode}</span>
                        </div>
                      )}
                      {selectedOrder.credentials.licenseKey && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License Key:</span>
                          <span className="font-mono font-semibold">{selectedOrder.credentials.licenseKey}</span>
                        </div>
                      )}
                      {selectedOrder.credentials.activationLink && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Activation Link:</span>
                          <a href={selectedOrder.credentials.activationLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline truncate max-w-[200px]">
                            {selectedOrder.credentials.activationLink}
                          </a>
                        </div>
                      )}
                      {selectedOrder.credentials.activationStatus && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Activation Status:</span>
                          <span className="font-semibold text-green-600">{selectedOrder.credentials.activationStatus}</span>
                        </div>
                      )}
                      {selectedOrder.credentials.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expiry Date:</span>
                          <span className="font-semibold">{new Date(selectedOrder.credentials.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedOrder.credentials.additionalInfo && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground">Additional Info:</span>
                          <p className="mt-1">{selectedOrder.credentials.additionalInfo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedOrder.status === 'CANCELLED' && selectedOrder.cancellationReason ? (
                  <div className="brutalist-card p-6 border-red-500">
                    <h3 className="font-bold font-['Space_Grotesk'] mb-4 text-red-600 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Cancellation Reason
                    </h3>
                    <p className="text-sm">{selectedOrder.cancellationReason}</p>
                  </div>
                ) : (
                  <div className="brutalist-card p-6 border-amber-500">
                    <h3 className="font-bold font-['Space_Grotesk'] mb-4 text-amber-600 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Awaiting Payment
                    </h3>
                    <p className="text-sm text-muted-foreground">User has not yet uploaded payment screenshot.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
