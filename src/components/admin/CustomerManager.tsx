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
      <div className="flex items-center justify-center p-12">
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="brutalist-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-purple-600">
              {customers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="brutalist-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Regular Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-blue-600">
              {userCount}
            </div>
          </CardContent>
        </Card>

        <Card className="brutalist-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Admins</CardTitle>
            <Users className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-amber-600">
              {adminCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info Banner */}
      <div className="brutalist-card p-4 bg-blue-50 border-blue-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0088cc] rounded-lg">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Customer Support Contact</p>
            <p className="text-sm text-blue-600">
              Customers can reach you directly on Telegram: <span className="font-mono font-bold">{settings?.telegramUsername || '@karthik_nkn'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <Card className="brutalist-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold font-['Space_Grotesk']">
              Customer List
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
