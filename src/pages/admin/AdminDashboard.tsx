import { useState, useEffect } from 'react';
import { useAdminOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useAdminTickets } from '@/hooks/useTickets';
import { useAdminBundles } from '@/hooks/useBundles';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Clock, CheckCircle2, XCircle, Users, MessageSquare, Package, Ticket, TrendingUp, Activity, BarChart3, ArrowUpRight, ArrowDownRight, Gift, Flame, Crown, Shield, Image as ImageIcon, Database, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Loading dashboard...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome, {profile?.full_name || profile?.email?.split('@')[0] || 'Admin'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Key Metrics - Compact Linear/Stripe Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {/* Revenue */}
          <div className="col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Revenue</span>
              </div>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${weeklyGrowth >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{orderCounts.completed} completed</p>
          </div>

          {/* Profit */}
          <div className="col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profit</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalProfit.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cost: ₹{totalCost.toLocaleString()}</p>
          </div>

          {/* Today's Orders */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayOrders}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Today</p>
          </div>

          {/* Users */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{usersLoading ? '...' : userCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Users</p>
          </div>

          {/* Products */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Products</p>
          </div>

          {/* Bundles */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{bundles.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bundles</p>
          </div>

          {/* Tickets */}
          <div className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${ticketStats.open > 0 ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ticketStats.open > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Ticket className={`h-4 w-4 ${ticketStats.open > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${ticketStats.open > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{ticketStats.open}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tickets</p>
          </div>

          {/* Premium */}
          <div className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${pendingRequests.length > 0 ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pendingRequests.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Crown className={`h-4 w-4 ${pendingRequests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${pendingRequests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>{pendingRequests.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Premium</p>
          </div>
        </div>

        {/* Order Status - Inline Compact */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Order Status</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{orderCounts.pending}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Submitted</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{orderCounts.submitted}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{orderCounts.completed}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">{orderCounts.cancelled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue={getDefaultTab()} className="space-y-6 sm:space-y-8">
          <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-2">
            <TabsList className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/50 h-auto p-2 flex flex-nowrap rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 min-w-max gap-1.5">
            {(isSuperAdmin || hasPermission('can_view_orders')) && (
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_tickets')) && (
              <TabsTrigger
                value="tickets"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl relative px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Ticket className="h-4 w-4" />
                <span>Tickets</span>
                {ticketStats.open > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                    {ticketStats.open}
                  </span>
                )}
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_products')) && (
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Package className="h-4 w-4" />
                <span>Products</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_customers')) && (
              <TabsTrigger
                value="customers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Users className="h-4 w-4" />
                <span>Customers</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_bundles')) && (
              <TabsTrigger
                value="bundles"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Gift className="h-4 w-4" />
                <span>Bundles</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_flash_sales')) && (
              <TabsTrigger
                value="flashsales"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Flame className="h-4 w-4" />
                <span>Flash</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_flash_sales')) && (
              <TabsTrigger
                value="banners"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Banners</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_products')) && (
              <TabsTrigger
                value="stockusage"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Database className="h-4 w-4" />
                <span>Stock</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_premium')) && (
              <TabsTrigger
                value="premium"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 font-semibold rounded-xl relative px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Crown className="h-4 w-4" />
                <span>Premium</span>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/50">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_rewards')) && (
              <TabsTrigger
                value="rewards"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Rewards</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_community')) && (
              <TabsTrigger
                value="community"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Community</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_view_settings')) && (
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Activity className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            )}
            {(isSuperAdmin || hasPermission('can_manage_admins')) && (
              <TabsTrigger
                value="admins"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 font-semibold rounded-xl text-sm whitespace-nowrap px-4 py-2.5 transition-all duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Shield className="h-4 w-4" />
                <span>Admins</span>
              </TabsTrigger>
            )}
          </TabsList>
          </div>

          <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
          <TabsContent value="orders" className="m-0">
            <OrderVerificationPanel />
          </TabsContent>

          <TabsContent value="tickets" className="m-0">
            <TicketManager />
          </TabsContent>

          <TabsContent value="products" className="m-0">
            <ProductManager />
          </TabsContent>

          <TabsContent value="customers" className="m-0">
            <CustomerManager />
          </TabsContent>

          <TabsContent value="bundles" className="m-0">
            <BundleManager />
          </TabsContent>

          <TabsContent value="flashsales" className="m-0">
            <FlashSalesManager />
          </TabsContent>

          <TabsContent value="banners" className="m-0">
            <BannerManager />
          </TabsContent>

          <TabsContent value="stockusage" className="m-0">
            <StockUsageManager />
          </TabsContent>

          <TabsContent value="premium" className="m-0 p-4 sm:p-6">
            <Tabs defaultValue="requests" className="space-y-4">
              <TabsList className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm font-medium">Membership Requests</TabsTrigger>
                <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm font-medium">Premium Content</TabsTrigger>
              </TabsList>
              <TabsContent value="requests">
                <PremiumManager />
              </TabsContent>
              <TabsContent value="content">
                <PremiumContentManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="rewards" className="m-0">
            <RewardsManager />
          </TabsContent>

          <TabsContent value="community" className="m-0">
            <CommunityManager />
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            <SettingsPanel />
          </TabsContent>

          <TabsContent value="admins" className="m-0">
            <AdminManager />
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
