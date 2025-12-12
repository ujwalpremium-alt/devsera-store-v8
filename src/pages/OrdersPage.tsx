import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderStatusStepper } from '@/components/shared/OrderStatusStepper';
import { OrderCredentialsCard } from '@/components/shared/OrderCredentialsCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Clock, CheckCircle2, XCircle, AlertCircle, Key, Package, UserCheck, Zap, RefreshCw, Download, RotateCcw, Truck, CreditCard, FileText, MessageCircle, Sparkles, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Order, OrderStatus, DeliveryType } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isSupabaseConfigured } from '@/lib/supabase';
import { OrderListSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSettings } from '@/hooks/useSettings';
import { mockSettings } from '@/data/mockData';

const deliveryTypeLabels: Record<DeliveryType, { label: string; icon: React.ReactNode }> = {
  CREDENTIALS: { label: 'Login Credentials', icon: <Key className="h-4 w-4" /> },
  COUPON_CODE: { label: 'Coupon/License Key', icon: <Package className="h-4 w-4" /> },
  MANUAL_ACTIVATION: { label: 'Manual Activation', icon: <UserCheck className="h-4 w-4" /> },
  INSTANT_KEY: { label: 'Instant Key', icon: <Zap className="h-4 w-4" /> }
};

export function OrdersPage() {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const { orders: dbOrders, isLoading, refetch } = useOrders();
  const { settings: dbSettings } = useSettings();
  const settings = dbSettings || (!isSupabaseConfigured ? mockSettings : null);

  const orders = dbOrders;
  const filteredOrders = filterStatus === 'ALL' ? orders : orders.filter(o => o.status === filterStatus);
  
  // Auto-refresh orders every 30 seconds for pending/submitted orders
  useEffect(() => {
    if (!autoRefresh) return;
    
    const hasPendingOrders = orders.some(o => o.status === 'PENDING' || o.status === 'SUBMITTED');
    if (!hasPendingOrders) return;
    
    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, orders, refetch]);
  
  // Show notification when order status changes
  useEffect(() => {
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const storedCompletedIds = JSON.parse(localStorage.getItem('notifiedCompletedOrders') || '[]');
    
    completedOrders.forEach(order => {
      if (!storedCompletedIds.includes(order.id)) {
        toast({
          title: '🎉 Order Completed!',
          description: `Your order for ${order.product?.name || 'product'} is ready. Check your credentials!`,
        });
        storedCompletedIds.push(order.id);
        localStorage.setItem('notifiedCompletedOrders', JSON.stringify(storedCompletedIds));
      }
    });
  }, [orders, toast]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const handleExportOrders = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Order ID', 'Product', 'Status', 'Amount', 'Date'];
      const rows = orders.map(order => [
        order.id, order.product?.name || 'Unknown', order.status,
        `₹${order.totalAmount || order.product?.salePrice || 0}`, new Date(order.createdAt).toLocaleDateString()
      ]);
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: 'Your orders have been exported to CSV' });
    }
  };

  const handleReorder = (order: Order) => {
    if (order.productId) navigate(`/product/${order.productId}`);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'SUBMITTED': return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'CANCELLED': return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusMessage = (status: OrderStatus, createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    switch (status) {
      case 'PENDING': 
        return 'Awaiting payment upload - Please upload your payment screenshot';
      case 'SUBMITTED': 
        if (hoursSinceCreation < 1) {
          return 'Payment received - Verification in progress';
        } else if (hoursSinceCreation < 2) {
          return 'Payment being verified - Almost ready!';
        } else {
          return 'Payment under review - Contact support if delayed';
        }
      case 'COMPLETED': 
        return 'Order completed - Your credentials are ready!';
      case 'CANCELLED': 
        return 'Order cancelled - Contact support for refund';
    }
  };

  const getEstimatedDelivery = (status: OrderStatus, createdAt: string) => {
    if (status === 'COMPLETED' || status === 'CANCELLED') return null;
    const created = new Date(createdAt);
    const estimated = new Date(created.getTime() + 2 * 60 * 60 * 1000);
    const now = new Date();
    
    // If estimated time has passed, show "Soon" instead
    if (now > estimated) {
      return { text: 'Very Soon', isOverdue: true };
    }
    
    const diffMs = estimated.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return { text: `~${diffMins} mins`, isOverdue: false };
    }
    
    return { text: estimated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOverdue: false };
  };

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="mb-8">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
          <OrderListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">My Orders</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track and manage your subscription orders
              {autoRefresh && orders.some(o => o.status === 'PENDING' || o.status === 'SUBMITTED') && (
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                  • Auto-refreshing • Last: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              onClick={() => setAutoRefresh(!autoRefresh)} 
              className={`border-2 ${autoRefresh ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-gray-200 dark:border-gray-700'}`}
              title={autoRefresh ? 'Auto-refresh enabled (every 30s)' : 'Auto-refresh disabled'}
            >
              {autoRefresh ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">{autoRefresh ? 'Live' : 'Paused'}</span>
            </Button>
            <Button variant="outline" onClick={() => handleExportOrders('csv')} className="border-2 border-gray-200 dark:border-gray-700">
              <Download className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button variant="outline" onClick={() => { refetch(); setLastRefresh(new Date()); }} disabled={isLoading} className="border-2 border-gray-200 dark:border-gray-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto pb-2">
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as OrderStatus | 'ALL')}>
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 inline-flex min-w-max">
              <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-gray-900 px-4">All Orders</TabsTrigger>
              <TabsTrigger value="PENDING" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white px-4">Pending</TabsTrigger>
              <TabsTrigger value="SUBMITTED" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white px-4">Submitted</TabsTrigger>
              <TabsTrigger value="COMPLETED" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-4">Completed</TabsTrigger>
              <TabsTrigger value="CANCELLED" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white px-4">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            type="orders"
            title={filterStatus === 'ALL' ? 'No orders yet' : `No ${filterStatus.toLowerCase()} orders`}
            description={filterStatus === 'ALL' ? "You haven't placed any orders yet." : `No ${filterStatus.toLowerCase()} orders found.`}
            actionLabel={filterStatus !== 'ALL' ? 'View All Orders' : 'Browse Products'}
            onAction={() => filterStatus !== 'ALL' ? setFilterStatus('ALL') : navigate('/')}
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const estimatedDelivery = getEstimatedDelivery(order.status, order.createdAt);
              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-lg transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {order.product && (
                      <img src={order.product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'} alt={order.product.name}
                        className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{order.product?.name || 'Unknown Product'}</h3>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Order ID: {order.id.slice(0, 8)}...</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">₹{(order.totalAmount || order.product?.salePrice || 0).toLocaleString()}</span>
                      </div>
                      {estimatedDelivery && (
                        <div className={`flex items-center gap-2 text-sm mb-3 px-3 py-1.5 rounded-lg w-fit ${
                          estimatedDelivery.isOverdue 
                            ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                          <Truck className="h-4 w-4" />
                          <span>Est. delivery: {estimatedDelivery.text}</span>
                          {estimatedDelivery.isOverdue && (
                            <span className="text-xs">(Processing)</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm text-gray-600 dark:text-gray-300">{getStatusMessage(order.status, order.createdAt)}</span>
                      </div>
                      
                      {/* Compact Status Stepper for non-completed orders */}
                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <OrderStatusStepper 
                            status={order.status} 
                            createdAt={order.createdAt} 
                            updatedAt={order.updatedAt}
                            compact
                          />
                        </div>
                      )}
                      
                      {/* Quick Credentials Preview for Completed Orders */}
                      {order.status === 'COMPLETED' && order.credentials && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Credentials Ready!</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Click "View Details" to see your login credentials</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {order.status === 'COMPLETED' && (
                        <Button onClick={() => handleReorder(order)} variant="outline" className="rounded-xl border-2 border-teal-500 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                          <RotateCcw className="h-4 w-4 mr-2" />Reorder
                        </Button>
                      )}
                      <Button onClick={() => setSelectedOrder(order)} variant="outline" className={`rounded-xl border-2 ${
                        order.status === 'COMPLETED' 
                          ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:bg-teal-500 hover:text-white hover:border-teal-500'
                      }`}>
                        <Eye className="h-4 w-4 mr-2" />
                        {order.status === 'COMPLETED' ? 'View Credentials' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="border-b-2 border-gray-200 dark:border-gray-700 pb-4">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {selectedOrder?.status === 'COMPLETED' ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    Order Delivered
                  </>
                ) : (
                  <>
                    <Package className="h-6 w-6 text-teal-500" />
                    Order Details
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Order Info Card */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={selectedOrder.product?.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&q=80'} 
                        alt={selectedOrder.product?.name}
                        className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">{selectedOrder.product?.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.product?.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-teal-600 dark:text-teal-400">₹{(selectedOrder.totalAmount || selectedOrder.product?.salePrice || 0).toLocaleString()}</p>
                        <StatusBadge status={selectedOrder.status} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Order ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold text-gray-900 dark:text-white">{selectedOrder.id.slice(0, 8)}...</p>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopy(selectedOrder.id, 'Order ID')}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Order Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Status Stepper */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      Order Timeline
                    </h3>
                    <OrderStatusStepper 
                      status={selectedOrder.status} 
                      createdAt={selectedOrder.createdAt} 
                      updatedAt={selectedOrder.updatedAt}
                    />
                  </CardContent>
                </Card>

                {/* Credentials Card for Completed Orders */}
                {selectedOrder.status === 'COMPLETED' && selectedOrder.credentials && (
                  <OrderCredentialsCard
                    credentials={selectedOrder.credentials}
                    deliveryType={selectedOrder.product?.deliveryType || 'CREDENTIALS'}
                    productName={selectedOrder.product?.name || 'Product'}
                    productDuration={selectedOrder.product?.duration}
                  />
                )}

                {/* Cancellation Reason */}
                {selectedOrder.status === 'CANCELLED' && selectedOrder.cancellationReason && (
                  <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Cancellation Reason
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{selectedOrder.cancellationReason}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Support Link */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Need help with this order?{' '}
                    {settings?.telegramUsername ? (
                      <a
                        href={`https://t.me/${settings.telegramUsername.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0088cc] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Contact Support
                      </a>
                    ) : (
                      <a href="/support" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                        Contact Support
                      </a>
                    )}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
