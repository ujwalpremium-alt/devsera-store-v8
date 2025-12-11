import { useState, useEffect } from 'react';
import { useAdminOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useAdminTickets } from '@/hooks/useTickets';
import { useAdminBundles } from '@/hooks/useBundles';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Clock, CheckCircle2, XCircle, Users, MessageSquare, Package, Ticket, TrendingUp, Activity, BarChart3, ArrowUpRight, ArrowDownRight, Gift, Flame, Crown, Shield, Image as ImageIcon, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderVerificationPanel } from '@/components/admin/OrderVerificationPanel';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { ProductManager } from '@/components/admin/ProductManager';
import { CustomerManager } from '@/components/admin/CustomerManager';
import { CommunityManager } from '@/components/admin/CommunityManager';
import { BundleManager } from '@/components/admin/BundleManager';
import { TicketManager } from '@/components/admin/TicketManager';
import { RewardsManager } from '@/components/admin/RewardsManager';
import { FlashSalesManager } from '@/components/admin/FlashSalesManager';
import { BannerManager } from '@/components/admin/BannerManager';
import { StockUsageManager } from '@/components/admin/StockUsageManager';
import PremiumManager from '@/components/admin/PremiumManager';
import PremiumContentManager from '@/components/admin/PremiumContentManager';
import AdminManager from '@/components/admin/AdminManager';
import { mockOrders, mockProducts } from '@/data/mockData';
import { useCurrentAdminPermissions } from '@/hooks/useAdminManagement';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export function AdminDashboard() {
  const { orders: dbOrders, isLoading } = useAdminOrders();
  const { products: dbProducts } = useProducts();
  const { stats: ticketStats } = useAdminTickets();
  const { bundles } = useAdminBundles();
  const { pendingRequests, fetchAllMemberships, allMemberships } = usePremium();
  const { isSuperAdmin, hasPermission, isLoading: permissionsLoading } = useCurrentAdminPermissions();
  const { profile } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState(0);
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);

  // Determine default tab based on permissions
  const getDefaultTab = () => {
    if (isSuperAdmin || hasPermission('can_view_orders')) return 'orders';
    if (hasPermission('can_view_tickets')) return 'tickets';
    if (hasPermission('can_view_products')) return 'products';
    if (hasPermission('can_view_customers')) return 'customers';
    if (hasPermission('can_view_bundles')) return 'bundles';
    if (hasPermission('can_view_flash_sales')) return 'flashsales';
    if (hasPermission('can_view_premium')) return 'premium';
    if (hasPermission('can_view_rewards')) return 'rewards';
    if (hasPermission('can_view_community')) return 'community';
    if (hasPermission('can_view_settings')) return 'settings';
    if (hasPermission('can_manage_admins')) return 'admins';
    return 'orders';
  };

  // Fetch user count
  useEffect(() => {
    const fetchUserCount = async () => {
      if (!isSupabaseConfigured) {
        // Mock user count
        setUserCount(42);
        setUsersLoading(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        setUserCount(count || 0);
      } catch (err) {
        console.error('Error fetching user count:', err);
        setUserCount(0);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUserCount();
    fetchAllMemberships();
  }, [fetchAllMemberships]);

  // Use database orders with products from database
  const orders = dbOrders.map(order => ({
    ...order,
    product: dbProducts.find(p => p.id === order.productId) || mockProducts.find(p => p.id === order.productId),
  }));
  const products = isSupabaseConfigured && dbProducts.length > 0 ? dbProducts : mockProducts;

  // Calculate today's orders and weekly growth
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = orders.filter(o => new Date(o.createdAt) >= today).length;
    setTodayOrders(todayCount);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const thisWeekOrders = orders.filter(o => new Date(o.createdAt) >= lastWeek).length;
    const prevWeekStart = new Date(lastWeek);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekOrders = orders.filter(o => {
      const date = new Date(o.createdAt);
      return date >= prevWeekStart && date < lastWeek;
    }).length;
    
    if (prevWeekOrders > 0) {
      setWeeklyGrowth(Math.round(((thisWeekOrders - prevWeekOrders) / prevWeekOrders) * 100));
    } else {
      setWeeklyGrowth(thisWeekOrders > 0 ? 100 : 0);
    }
  }, [orders]);

  // Calculate revenue from completed orders (use totalAmount if available, otherwise fallback to salePrice)
  const totalRevenue = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, order) => {
      // Use the actual amount paid (totalAmount) which accounts for flash sale discounts
      const amountPaid = order.totalAmount || order.product?.salePrice || 0;
      return sum + amountPaid;
    }, 0);

  // Calculate total cost (vendor price) from completed orders
  const totalCost = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, order) => {
      return sum + (order.product?.costPrice || 0);
    }, 0);

  // Calculate profit
  const totalProfit = totalRevenue - totalCost;

  const orderCounts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    submitted: orders.filter(o => o.status === 'SUBMITTED').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  };

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base ml-15">
              Welcome back, <span className="font-semibold text-teal-600 dark:text-teal-400">{profile?.full_name || profile?.email?.split('@')[0] || 'Admin'}</span>! Here's what's happening with your store.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Today's Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics - Professional Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {/* Revenue Card */}
          <Card className="col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${weeklyGrowth >= 0 ? 'text-emerald-100' : 'text-red-200'}`}>
                  {weeklyGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(weeklyGrowth)}%
                </div>
              </div>
              <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-emerald-100 text-xs mt-1">{orderCounts.completed} completed orders</p>
            </CardContent>
          </Card>

          {/* Profit Card */}
          <Card className="col-span-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1 text-sm text-amber-100">
                  <BarChart3 className="h-4 w-4" />
                  Net
                </div>
              </div>
              <p className="text-amber-100 text-sm font-medium">Total Profit</p>
              <p className="text-3xl font-bold">₹{totalProfit.toLocaleString()}</p>
              <p className="text-amber-100 text-xs mt-1">Cost: ₹{totalCost.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Orders Today */}
          <Card className="col-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1 text-sm text-blue-100">
                  <TrendingUp className="h-4 w-4" />
                  Live
                </div>
              </div>
              <p className="text-blue-100 text-sm font-medium">Today's Orders</p>
              <p className="text-3xl font-bold">{todayOrders}</p>
              <p className="text-blue-100 text-xs mt-1">{orderCounts.submitted} awaiting action</p>
            </CardContent>
          </Card>

          {/* Users */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 transition-all hover:shadow-lg">
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{usersLoading ? '...' : userCount}</p>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 transition-all hover:shadow-lg">
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-3">
                <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            </CardContent>
          </Card>

          {/* Bundles */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700 transition-all hover:shadow-lg">
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bundles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{bundles.length}</p>
            </CardContent>
          </Card>

          {/* Open Tickets */}
          <Card className={`bg-white dark:bg-gray-800 border-2 transition-all hover:shadow-lg ${ticketStats.open > 0 ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${ticketStats.open > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Ticket className={`h-5 w-5 ${ticketStats.open > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Open Tickets</p>
              <p className={`text-2xl font-bold ${ticketStats.open > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{ticketStats.open}</p>
            </CardContent>
          </Card>

          {/* Premium Requests */}
          <Card className={`bg-white dark:bg-gray-800 border-2 transition-all hover:shadow-lg ${pendingRequests.length > 0 ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${pendingRequests.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Crown className={`h-5 w-5 ${pendingRequests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Premium Pending</p>
              <p className={`text-2xl font-bold ${pendingRequests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>{pendingRequests.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{orderCounts.pending}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orderCounts.submitted}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{orderCounts.completed}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{orderCounts.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-auto p-2 flex flex-nowrap md:flex-wrap rounded-2xl shadow-sm min-w-max md:min-w-0 gap-1.5">
            {(isSuperAdmin || hasPermission('can_view_orders')) && (
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                Orders
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_tickets')) && (
              <TabsTrigger
                value="tickets"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl relative px-4 py-2.5 transition-all"
              >
                <Ticket className="h-4 w-4 mr-1.5" />
                Tickets
                {ticketStats.open > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {ticketStats.open}
                  </span>
                )}
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_products')) && (
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                Products
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_customers')) && (
              <TabsTrigger
                value="customers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                Customers
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_bundles')) && (
              <TabsTrigger
                value="bundles"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <Package className="h-4 w-4 mr-1.5" />
                Bundles
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_flash_sales')) && (
              <TabsTrigger
                value="flashsales"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <Flame className="h-4 w-4 mr-1.5" />
                Flash Sales
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_flash_sales')) && (
              <TabsTrigger
                value="banners"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <ImageIcon className="h-4 w-4 mr-1.5" />
                Banners
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_products')) && (
              <TabsTrigger
                value="stockusage"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <Database className="h-4 w-4 mr-1.5" />
                Stock Usage
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_premium')) && (
              <TabsTrigger
                value="premium"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 font-semibold rounded-xl relative px-4 py-2.5 transition-all"
              >
                <Crown className="h-4 w-4 mr-1.5" />
                Premium
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_rewards')) && (
              <TabsTrigger
                value="rewards"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <Gift className="h-4 w-4 mr-1.5" />
                Rewards
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_community')) && (
              <TabsTrigger
                value="community"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Community
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_settings')) && (
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                Settings
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_manage_admins')) && (
              <TabsTrigger
                value="admins"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold rounded-xl text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 transition-all"
              >
                <Shield className="h-4 w-4 mr-1.5" />
                Admins
              </TabsTrigger>
            )}
          </TabsList>
          </div>

          <TabsContent value="orders">
            <OrderVerificationPanel />
          </TabsContent>

          <TabsContent value="tickets">
            <TicketManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManager />
          </TabsContent>

          <TabsContent value="bundles">
            <BundleManager />
          </TabsContent>

          <TabsContent value="flashsales">
            <FlashSalesManager />
          </TabsContent>

          <TabsContent value="banners">
            <BannerManager />
          </TabsContent>

          <TabsContent value="stockusage">
            <StockUsageManager />
          </TabsContent>

          <TabsContent value="premium">
            <Tabs defaultValue="requests" className="space-y-4">
              <TabsList>
                <TabsTrigger value="requests">Membership Requests</TabsTrigger>
                <TabsTrigger value="content">Premium Content</TabsTrigger>
              </TabsList>
              <TabsContent value="requests">
                <PremiumManager />
              </TabsContent>
              <TabsContent value="content">
                <PremiumContentManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsManager />
          </TabsContent>

          <TabsContent value="community">
            <CommunityManager />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>

          <TabsContent value="admins">
            <AdminManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
