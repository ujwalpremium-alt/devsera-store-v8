import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, TrendingUp, TrendingDown, Search, RefreshCw, ShoppingBag, Key, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface StockUsageData {
  productId: string;
  productName: string;
  productImage: string;
  totalStock: number;
  usedStock: number;
  availableStock: number;
  usagePercentage: number;
  useManualStock: boolean;
  recentSales: {
    orderId: string;
    date: string;
    quantity: number;
    customerEmail: string;
  }[];
}

interface SoldStockKey {
  id: string;
  productId: string;
  productName: string;
  keyValue: string;
  username: string | null;
  soldAt: string;
  orderId: string;
  customerEmail: string;
}

export function StockUsageManager() {
  const { products } = useProducts();
  const [stockUsage, setStockUsage] = useState<StockUsageData[]>([]);
  const [soldKeys, setSoldKeys] = useState<SoldStockKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');

  useEffect(() => {
    loadStockUsage();
  }, [products, dateRange]);

  const loadStockUsage = async () => {
    if (!isSupabaseConfigured || products.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get stock usage per product
      const usageData: StockUsageData[] = [];

      for (const product of products) {
        let total = 0;
        let available = 0;
        let used = 0;

        // Check if product uses manual stock
        if (product.useManualStock) {
          // For manual stock, we need to calculate from orders
          const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)
            .eq('status', 'COMPLETED');

          used = orderCount || 0;
          available = product.manualStockCount || 0;
          total = available + used; // Total is current available + what was sold
        } else {
          // Get total stock keys
          const { count: totalCount } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id);

          // Get available stock keys
          const { count: availableCount } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)
            .eq('status', 'AVAILABLE');

          // Get used/assigned stock keys
          const { count: usedCount } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)
            .in('status', ['ASSIGNED', 'USED']);

          total = totalCount || 0;
          available = availableCount || 0;
          used = usedCount || 0;
        }

        // Get recent sales for this product
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

        const { data: recentOrders } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            quantity,
            profile:profiles(email)
          `)
          .eq('product_id', product.id)
          .eq('status', 'COMPLETED')
          .gte('created_at', daysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        usageData.push({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          totalStock: total,
          usedStock: used,
          availableStock: available,
          usagePercentage: total > 0 ? Math.round((used / total) * 100) : 0,
          useManualStock: product.useManualStock || false,
          recentSales: (recentOrders || []).map(o => ({
            orderId: o.id,
            date: o.created_at,
            quantity: o.quantity || 1,
            customerEmail: (o.profile as any)?.email || 'Unknown',
          })),
        });
      }

      // Sort by usage percentage (highest first)
      usageData.sort((a, b) => b.usagePercentage - a.usagePercentage);
      setStockUsage(usageData);

      // Load sold stock keys
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data: soldKeysData } = await supabase
        .from('product_stock_keys')
        .select(`
          id,
          product_id,
          key_value,
          username,
          used_at,
          assigned_order_id,
          product:products(name),
          order:orders(profile:profiles(email))
        `)
        .in('status', ['ASSIGNED', 'USED'])
        .gte('used_at', daysAgo.toISOString())
        .order('used_at', { ascending: false })
        .limit(50);

      if (soldKeysData) {
        setSoldKeys(soldKeysData.map(k => ({
          id: k.id,
          productId: k.product_id,
          productName: (k.product as any)?.name || 'Unknown',
          keyValue: k.key_value,
          username: k.username,
          soldAt: k.used_at || '',
          orderId: k.assigned_order_id || '',
          customerEmail: (k.order as any)?.profile?.email || 'Unknown',
        })));
      }
    } catch (error) {
      console.error('Error loading stock usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsage = stockUsage.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProduct = filterProduct === 'all' || item.productId === filterProduct;
    return matchesSearch && matchesProduct;
  });

  const filteredSoldKeys = soldKeys.filter(key => {
    const matchesSearch = 
      key.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProduct = filterProduct === 'all' || key.productId === filterProduct;
    return matchesSearch && matchesProduct;
  });

  const totalUsed = stockUsage.reduce((sum, item) => sum + item.usedStock, 0);
  const totalAvailable = stockUsage.reduce((sum, item) => sum + item.availableStock, 0);
  const totalStock = stockUsage.reduce((sum, item) => sum + item.totalStock, 0);
  const lowStockProducts = stockUsage.filter(item => item.availableStock <= 5 && item.availableStock > 0);
  // Only show as out of stock if there was ever stock (totalStock > 0) or if it's a product that should have stock
  const outOfStockProducts = stockUsage.filter(item => item.availableStock === 0 && item.totalStock > 0);

  // Helper to determine stock status
  const getStockStatus = (item: StockUsageData) => {
    // If no stock was ever added, show as "No Stock Added"
    if (item.totalStock === 0) {
      return { status: 'no-stock', label: 'No Stock Added', color: 'bg-gray-500' };
    }
    // If available is 0 but there was stock, it's out of stock
    if (item.availableStock === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-500' };
    }
    // Low stock warning
    if (item.availableStock <= 5) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-amber-500' };
    }
    // In stock
    return { status: 'in-stock', label: 'In Stock', color: 'bg-emerald-500' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-blue-100 text-xs">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-emerald-100 text-xs">Available</p>
                <p className="text-2xl font-bold">{totalAvailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-amber-100 text-xs">Sold</p>
                <p className="text-2xl font-bold">{totalUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 ${outOfStockProducts.length > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className={outOfStockProducts.length > 0 ? 'text-red-100' : 'text-gray-100'} style={{ fontSize: '0.75rem' }}>Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(product => (
                <Badge key={product.productId} variant="outline" className="bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700">
                  {product.productName}: <span className="font-bold text-amber-600 ml-1">{product.availableStock} left</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products or customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadStockUsage} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stock Usage by Product */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            Stock Usage by Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Sold</TableHead>
                  <TableHead className="text-center">Usage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No stock data available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsage.map(item => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.productImage} 
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={item.useManualStock ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400' : 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400'}>
                          {item.useManualStock ? (
                            <><Package className="h-3 w-3 mr-1" /> Manual</>
                          ) : (
                            <><Key className="h-3 w-3 mr-1" /> Keys</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{item.totalStock}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.availableStock <= 5 && item.availableStock > 0 ? 'text-amber-600 font-bold' : item.availableStock === 0 && item.totalStock > 0 ? 'text-red-600 font-bold' : ''}>
                          {item.availableStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-emerald-600 font-semibold">{item.usedStock}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.usagePercentage >= 80 ? 'bg-red-500' :
                                item.usagePercentage >= 50 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${item.usagePercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.usagePercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const stockStatus = getStockStatus(item);
                          return (
                            <Badge className={stockStatus.color}>
                              {stockStatus.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales / Sold Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            Recently Sold Stock Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Key/Credentials</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sold At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSoldKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No sold keys in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSoldKeys.map(key => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.productName}</TableCell>
                      <TableCell>
                        <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded max-w-[200px] truncate">
                          {key.username ? `${key.username} / ***` : key.keyValue.substring(0, 20) + '...'}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">{key.customerEmail}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(key.soldAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
