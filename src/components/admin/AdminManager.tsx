import { useState } from 'react';
import { useAdminManagement, AdminUser } from '@/hooks/useAdminManagement';
import { useCurrentAdminPermissions } from '@/hooks/useAdminManagement';
import { AdminPermissions, AdminRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, Shield, ShieldCheck, ShieldAlert, Edit2, Trash2, 
  Key, Power, PowerOff, Eye, EyeOff, Users, Settings, 
  Package, ShoppingBag, MessageSquare, Ticket, Gift, Crown, 
  Flame, Lock, Unlock, CheckCircle2,
  AlertTriangle, Copy, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const roleConfig: Record<AdminRole, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
    icon: <ShieldCheck className="h-4 w-4" />,
    description: 'Full access to all features and can manage other admins',
  },
  admin: {
    label: 'Admin',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
    icon: <Shield className="h-4 w-4" />,
    description: 'Access based on assigned permissions',
  },
  moderator: {
    label: 'Moderator',
    color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    icon: <ShieldAlert className="h-4 w-4" />,
    description: 'Limited access for content moderation',
  },
};

const permissionGroups = [
  {
    title: 'Products',
    icon: <ShoppingBag className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_products', label: 'View Products', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_products', label: 'Edit Products', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_products', label: 'Delete Products', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Bundles',
    icon: <Package className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_bundles', label: 'View Bundles', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_bundles', label: 'Edit Bundles', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_bundles', label: 'Delete Bundles', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Flash Sales',
    icon: <Flame className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_flash_sales', label: 'View Flash Sales', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_flash_sales', label: 'Edit Flash Sales', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_flash_sales', label: 'Delete Flash Sales', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Orders',
    icon: <ShoppingBag className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_orders', label: 'View Orders', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_orders', label: 'Edit Orders', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_orders', label: 'Delete Orders', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Customers',
    icon: <Users className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_customers', label: 'View Customers', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_customers', label: 'Edit Customers', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_customers', label: 'Delete Customers', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Support Tickets',
    icon: <Ticket className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_tickets', label: 'View Tickets', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_tickets', label: 'Edit Tickets', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_tickets', label: 'Delete Tickets', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Premium',
    icon: <Crown className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_premium', label: 'View Premium', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_premium', label: 'Edit Premium', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_premium', label: 'Delete Premium', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Rewards',
    icon: <Gift className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_rewards', label: 'View Rewards', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_rewards', label: 'Edit Rewards', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_rewards', label: 'Delete Rewards', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Community',
    icon: <MessageSquare className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_community', label: 'View Community', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_community', label: 'Edit Community', icon: <Edit2 className="h-4 w-4" /> },
      { key: 'can_delete_community', label: 'Delete Community', icon: <Trash2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      { key: 'can_view_settings', label: 'View Settings', icon: <Eye className="h-4 w-4" /> },
      { key: 'can_edit_settings', label: 'Edit Settings', icon: <Edit2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Admin Management',
    icon: <Shield className="h-5 w-5" />,
    permissions: [
      { key: 'can_manage_admins', label: 'Manage Admins', icon: <Shield className="h-4 w-4" /> },
    ],
  },
];

export function AdminManager() {
  const { toast } = useToast();
  const { admins, isLoading, createAdmin, updateAdminPermissions, updateAdminRole, toggleAdminStatus, deleteAdmin, defaultPermissions } = useAdminManagement();
  const { isSuperAdmin, hasPermission } = useCurrentAdminPermissions();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    adminRole: 'admin' as AdminRole,
  });
  const [formPermissions, setFormPermissions] = useState<Partial<AdminPermissions>>({
    ...defaultPermissions,
  });

  const canManageAdmins = isSuperAdmin || hasPermission('can_manage_admins');

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    setGeneratedPassword(password);
  };

  const generateEmail = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    const email = `admin_${randomId}@devsera.store`;
    setFormData(prev => ({ ...prev, email }));
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: 'Password Copied',
      description: 'Password has been copied to clipboard',
    });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      adminRole: 'admin',
    });
    setFormPermissions({ ...defaultPermissions });
    setGeneratedPassword('');
    setShowPassword(false);
  };

  const handleCreateAdmin = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdmin(
        formData.email,
        formData.password,
        formData.fullName,
        formData.adminRole,
        formPermissions
      );
      toast({
        title: 'Admin Created',
        description: `${formData.fullName} has been added as ${roleConfig[formData.adminRole].label}`,
      });
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create admin',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedAdmin) return;

    setIsSubmitting(true);
    try {
      await updateAdminPermissions(selectedAdmin.id, formPermissions);
      if (formData.adminRole !== selectedAdmin.admin_role) {
        await updateAdminRole(selectedAdmin.id, formData.adminRole);
      }
      toast({
        title: 'Permissions Updated',
        description: `${selectedAdmin.full_name}'s permissions have been updated`,
      });
      setShowEditDialog(false);
      setSelectedAdmin(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      await toggleAdminStatus(admin.id, !admin.is_active);
      toast({
        title: admin.is_active ? 'Admin Deactivated' : 'Admin Activated',
        description: `${admin.full_name} has been ${admin.is_active ? 'deactivated' : 'activated'}`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const [deleteCompletely, setDeleteCompletely] = useState(false);
  
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setIsSubmitting(true);
    try {
      await deleteAdmin(selectedAdmin.id, deleteCompletely);
      toast({
        title: deleteCompletely ? 'Admin Deleted' : 'Admin Removed',
        description: deleteCompletely 
          ? `${selectedAdmin.full_name} has been completely deleted`
          : `${selectedAdmin.full_name} has been demoted to regular user`,
      });
      setShowDeleteDialog(false);
      setSelectedAdmin(null);
      setDeleteCompletely(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove admin',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin || !newAdminPassword) return;

    setIsSubmitting(true);
    try {
      await resetAdminPassword(selectedAdmin.id, newAdminPassword);
      toast({
        title: 'Password Reset',
        description: `Password for ${selectedAdmin.full_name} has been updated`,
      });
      setShowResetPasswordDialog(false);
      setSelectedAdmin(null);
      setNewAdminPassword('');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      password: '',
      fullName: admin.full_name,
      adminRole: admin.admin_role || 'admin',
    });
    setFormPermissions(admin.permissions || { ...defaultPermissions });
    setShowEditDialog(true);
  };

  if (!canManageAdmins) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800">Access Denied</h3>
          <p className="text-red-600 mt-2">You don't have permission to manage admins.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            Admin Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage admin accounts with custom permissions</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super Admins</p>
                <p className="text-xl font-bold text-purple-600">
                  {admins.filter(a => a.admin_role === 'super_admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
                <p className="text-xl font-bold text-blue-600">
                  {admins.filter(a => a.admin_role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Moderators</p>
                <p className="text-xl font-bold text-green-600">
                  {admins.filter(a => a.admin_role === 'moderator').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Admins</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{admins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin List */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg">Admin Accounts</CardTitle>
          <CardDescription>Manage admin users and their permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500 mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No admin accounts found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create First Admin
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!admin.is_active ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Admin Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        admin.admin_role ? roleConfig[admin.admin_role].color : 'bg-gray-200'
                      }`}>
                        {admin.admin_role ? roleConfig[admin.admin_role].icon : <Shield className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{admin.full_name}</h4>
                          {admin.admin_role && (
                            <Badge className={`${roleConfig[admin.admin_role].color} text-xs`}>
                              {roleConfig[admin.admin_role].label}
                            </Badge>
                          )}
                          {!admin.is_active && (
                            <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{admin.email}</p>
                      </div>
                    </div>

                    {/* Permissions Preview */}
                    <div className="flex flex-wrap gap-1.5 lg:max-w-md">
                      {admin.admin_role === 'super_admin' ? (
                        <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                          <Unlock className="h-3 w-3 mr-1" />
                          Full Access
                        </Badge>
                      ) : admin.permissions ? (
                        <>
                          {admin.permissions.can_manage_products && (
                            <Badge variant="outline" className="text-xs"><ShoppingBag className="h-3 w-3 mr-1" />Products</Badge>
                          )}
                          {admin.permissions.can_manage_orders && (
                            <Badge variant="outline" className="text-xs"><Package className="h-3 w-3 mr-1" />Orders</Badge>
                          )}
                          {admin.permissions.can_manage_customers && (
                            <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />Customers</Badge>
                          )}
                          {admin.permissions.can_manage_tickets && (
                            <Badge variant="outline" className="text-xs"><Ticket className="h-3 w-3 mr-1" />Tickets</Badge>
                          )}
                          {admin.permissions.can_manage_premium && (
                            <Badge variant="outline" className="text-xs"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 dark:text-gray-400 text-xs">No permissions set</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(admin)}
                        className="border-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setNewAdminPassword('');
                          setShowResetPasswordDialog(true);
                        }}
                        className="border-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Reset Password</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(admin)}
                        className={`border-2 ${admin.is_active ? 'text-amber-600 border-amber-300 hover:bg-amber-50' : 'text-green-600 border-green-300 hover:bg-green-50'}`}
                      >
                        {admin.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        <span className="hidden sm:inline ml-1">{admin.is_active ? 'Disable' : 'Enable'}</span>
                      </Button>
                      {admin.admin_role !== 'super_admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setDeleteCompletely(false);
                            setShowDeleteDialog(true);
                          }}
                          className="border-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Remove</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Create New Admin
            </DialogTitle>
            <DialogDescription>
              Add a new admin account with custom permissions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="details">Account Details</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="John Doe"
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="admin@example.com"
                        className="border-2 flex-1"
                      />
                      <Button type="button" variant="outline" onClick={generateEmail} className="border-2 shrink-0">
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Must be a valid email format (e.g., admin@devsera.store)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        className="border-2 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" onClick={generatePassword} className="border-2">
                      <Key className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                  {generatedPassword && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <code className="text-sm text-green-800 flex-1">{generatedPassword}</code>
                      <Button type="button" variant="ghost" size="sm" onClick={copyPassword}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Admin Role</Label>
                  <Select
                    value={formData.adminRole}
                    onValueChange={(value: AdminRole) => setFormData(prev => ({ ...prev, adminRole: value }))}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{roleConfig[formData.adminRole].description}</p>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                {formData.adminRole === 'super_admin' ? (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-800">
                      <Unlock className="h-5 w-5" />
                      <span className="font-medium">Super Admin has full access to all features</span>
                    </div>
                  </div>
                ) : (
                  permissionGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        {group.icon}
                        <h4 className="font-medium">{group.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                        {group.permissions.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex items-center gap-2">
                              {perm.icon}
                              <span className="text-sm">{perm.label}</span>
                            </div>
                            <Switch
                              checked={formPermissions[perm.key as keyof AdminPermissions] as boolean || false}
                              onCheckedChange={(checked) =>
                                setFormPermissions(prev => ({ ...prev, [perm.key]: checked }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Edit Admin: {selectedAdmin?.full_name}
            </DialogTitle>
            <DialogDescription>
              Update admin role and permissions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Admin Role</Label>
                <Select
                  value={formData.adminRole}
                  onValueChange={(value: AdminRole) => setFormData(prev => ({ ...prev, adminRole: value }))}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {formData.adminRole === 'super_admin' ? (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-800">
                    <Unlock className="h-5 w-5" />
                    <span className="font-medium">Super Admin has full access to all features</span>
                  </div>
                </div>
              ) : (
                permissionGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      {group.icon}
                      <h4 className="font-medium">{group.title}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                      {group.permissions.map((perm) => (
                        <div
                          key={perm.key}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            {perm.icon}
                            <span className="text-sm">{perm.label}</span>
                          </div>
                          <Switch
                            checked={formPermissions[perm.key as keyof AdminPermissions] as boolean || false}
                            onCheckedChange={(checked) =>
                              setFormPermissions(prev => ({ ...prev, [perm.key]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Admin Access
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove admin access for <strong>{selectedAdmin?.full_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Demote to Regular User</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remove admin privileges but keep the account</p>
              </div>
              <input
                type="radio"
                name="deleteOption"
                checked={!deleteCompletely}
                onChange={() => setDeleteCompletely(false)}
                className="h-4 w-4 text-blue-600"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-red-800">Delete Completely</p>
                <p className="text-sm text-red-600">Permanently delete the account and all data</p>
              </div>
              <input
                type="radio"
                name="deleteOption"
                checked={deleteCompletely}
                onChange={() => setDeleteCompletely(true)}
                className="h-4 w-4 text-red-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {deleteCompletely ? 'Deleting...' : 'Removing...'}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteCompletely ? 'Delete Permanently' : 'Remove Admin'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Key className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{selectedAdmin?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="border-2 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
                    let password = '';
                    for (let i = 0; i < 12; i++) {
                      password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setNewAdminPassword(password);
                  }}
                  className="border-2"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {newAdminPassword && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <code className="text-sm text-blue-800 flex-1">{newAdminPassword}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newAdminPassword);
                      toast({
                        title: 'Copied',
                        description: 'Password copied to clipboard',
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isSubmitting || !newAdminPassword || newAdminPassword.length < 6}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminManager;
