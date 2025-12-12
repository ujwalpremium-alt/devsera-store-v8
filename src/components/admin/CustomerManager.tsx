import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Calendar } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';

interface Customer {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

// Mock customers for demo
const mockCustomers: Customer[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'user',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    role: 'user',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '3',
    email: 'mike@example.com',
    name: 'Mike Johnson',
    role: 'user',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '4',
    email: 'sarah@example.com',
    name: 'Sarah Williams',
    role: 'user',
    createdAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '5',
    email: 'admin@devsera.store',
    name: 'Admin',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useSettings();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!isSupabaseConfigured) {
      setCustomers(mockCustomers);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers(
        data.map((p) => ({
          id: p.id,
          email: p.email,
          name: p.full_name || p.name || p.email?.split('@')[0] || 'Unknown',
          role: p.role || 'user',
          createdAt: p.created_at,
        }))
      );
    } catch (err) {
      console.error('Error loading customers:', err);
      setCustomers(mockCustomers);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userCount = customers.filter(c => c.role === 'user').length;
  const adminCount = customers.filter(c => c.role === 'admin').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-4 sm:p-6 border border-purple-100 dark:border-purple-800/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total</p>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-purple-700 dark:text-purple-400">
            {customers.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Users</p>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-blue-700 dark:text-blue-400">
            {userCount}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 sm:p-6 border border-amber-100 dark:border-amber-800/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Admins</p>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-amber-700 dark:text-amber-400">
            {adminCount}
          </p>
        </div>
      </div>

      {/* Contact Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-4 sm:p-5 border border-blue-100 dark:border-blue-800/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0088cc] to-[#0066aa] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-blue-800 dark:text-blue-300 text-sm sm:text-base">Support Contact</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
              Telegram: <span className="font-mono font-bold">{settings?.telegramUsername || '@karthik_nkn'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Customer List
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border border-gray-200 dark:border-gray-700 rounded-xl h-10 text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No customers found</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-gray-100 dark:border-gray-700">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} />
                      <AvatarFallback className="text-xs">{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{customer.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{customer.email}</p>
                    </div>
                    <Badge
                      variant={customer.role === 'admin' ? 'default' : 'outline'}
                      className={`text-[10px] ${
                        customer.role === 'admin'
                          ? 'bg-amber-500 text-white border-2 border-black'
                          : 'border-2 border-black'
                      }`}
                    >
                      {customer.role.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-black">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} />
                            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.role === 'admin' ? 'default' : 'outline'}
                          className={
                            customer.role === 'admin'
                              ? 'bg-amber-500 text-white border-2 border-black'
                              : 'border-2 border-black'
                          }
                        >
                          {customer.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
