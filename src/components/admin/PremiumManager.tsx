import { useState, useEffect, useMemo } from 'react';
import { Crown, Check, X, Eye, Loader2, Search, Filter, Users, DollarSign, Clock, ChevronLeft, ChevronRight, ArrowUp, TrendingUp, Calendar, Image, Trash2, Ban, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium, PREMIUM_PLANS } from '@/hooks/usePremium';
import { PremiumMembership } from '@/types';

const ITEMS_PER_PAGE = 10;

export default function PremiumManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    allMemberships, 
    pendingRequests, 
    fetchAllMemberships, 
    approveMembership, 
    rejectMembership,
    revokeMembership,
    deleteMembership,
    extendMembership
  } = usePremium();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMembership, setSelectedMembership] = useState<PremiumMembership | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      await fetchAllMemberships();
      setLoading(false);
    };
    loadData();
  }, [fetchAllMemberships]);

  const handleApprove = async (membership: PremiumMembership) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await approveMembership(membership.id, user.id);
      toast({
        title: 'Membership Approved',
        description: `Premium membership approved for ${(membership.profiles as any)?.email || 'user'}`,
      });
      setShowDetailsModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMembership || !rejectReason) return;
    setIsProcessing(true);
    try {
      await rejectMembership(selectedMembership.id, rejectReason);
      toast({
        title: 'Membership Rejected',
        description: 'The premium request has been rejected',
      });
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedMembership || !revokeReason) return;
    setIsProcessing(true);
    try {
      await revokeMembership(selectedMembership.id, revokeReason);
      toast({
        title: 'Membership Revoked',
        description: 'The premium membership has been revoked',
      });
      setShowRevokeModal(false);
      setShowDetailsModal(false);
      setRevokeReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMembership) return;
    if (!confirm('Are you sure you want to permanently delete this membership record? This cannot be undone.')) return;
    
    setIsProcessing(true);
    try {
      await deleteMembership(selectedMembership.id);
      toast({
        title: 'Membership Deleted',
        description: 'The membership record has been permanently deleted',
      });
      setShowDetailsModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtend = async () => {
    if (!selectedMembership || extendDays <= 0) return;
    setIsProcessing(true);
    try {
      await extendMembership(selectedMembership.id, extendDays);
      toast({
        title: 'Membership Extended',
        description: `Added ${extendDays} days to the membership`,
      });
      setShowExtendModal(false);
      setExtendDays(30);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to extend',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMemberships = allMemberships.filter(m => {
    const matchesSearch = 
      (m.profiles as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMemberships.length / ITEMS_PER_PAGE);
  const paginatedMemberships = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMemberships.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMemberships, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const stats = {
    total: allMemberships.length,
    pending: allMemberships.filter(m => m.status === 'pending').length,
    approved: allMemberships.filter(m => m.status === 'approved').length,
    revenue: allMemberships
      .filter(m => m.status === 'approved')
      .reduce((sum, m) => sum + Number(m.price_paid), 0),
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      pending: { variant: 'secondary', className: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' },
      approved: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' },
      rejected: { variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' },
      revoked: { variant: 'destructive', className: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300' },
      expired: { variant: 'outline', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300' },
    };
    return variants[status] || variants.pending;
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
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 sm:pt-4 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-3 sm:pt-4 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
                <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-3 sm:pt-4 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-200 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
                <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">Active Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-3 sm:pt-4 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300">₹{stats.revenue.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2 text-yellow-800">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}
            </CardTitle>
            <CardDescription className="text-yellow-700 text-xs sm:text-sm">
              Review and approve/reject pending premium requests
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Memberships List */}
      <div className="space-y-2 sm:space-y-3">
        {filteredMemberships.length === 0 ? (
          <Card className="text-center py-8 sm:py-12 dark:bg-gray-800 dark:border-gray-700">
            <CardContent>
              <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No membership requests found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedMemberships.map((membership) => (
              <Card 
                key={membership.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700 ${
                  membership.status === 'pending' ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/30 dark:bg-yellow-900/20' : ''
                }`}
                onClick={() => {
                  setSelectedMembership(membership);
                  setShowDetailsModal(true);
                }}
              >
                <CardContent className="p-3 sm:py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">{(membership.profiles as any)?.full_name || (membership.profiles as any)?.email || 'Unknown'}</p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {PREMIUM_PLANS[membership.plan_type]?.name}
                          </span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            ₹{membership.price_paid}
                          </span>
                          {membership.payment_proof_url && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                              <Image className="h-2.5 w-2.5 mr-0.5" />
                              Proof
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(membership.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                      <Badge className={`${getStatusBadge(membership.status).className} text-[10px] sm:text-xs`}>
                        {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                      </Badge>
                      {membership.status === 'pending' && (
                        <div className="flex gap-1 sm:gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(membership);
                            }}
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMembership(membership);
                              setShowRejectModal(true);
                            }}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredMemberships.length)} of {filteredMemberships.length}
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                          onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Membership Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMembership && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">User</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{(selectedMembership.profiles as any)?.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusBadge(selectedMembership.status).className}>
                    {selectedMembership.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Plan</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{PREMIUM_PLANS[selectedMembership.plan_type]?.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Amount</Label>
                  <p className="font-medium text-gray-900 dark:text-white">₹{selectedMembership.price_paid}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Payment Method</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMembership.payment_method}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Transaction ID</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMembership.transaction_id && selectedMembership.transaction_id !== 'N/A' ? selectedMembership.transaction_id : 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Requested At</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedMembership.requested_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedMembership.expires_at && (
                  <div>
                    <Label className="text-gray-500 dark:text-gray-400">Expires At</Label>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedMembership.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedMembership.payment_proof_url && (
                <div className="col-span-2">
                  <Label className="text-gray-500 dark:text-gray-400 mb-2 block">Payment Screenshot</Label>
                  <a 
                    href={selectedMembership.payment_proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-amber-400 dark:hover:border-amber-500 transition-colors">
                      <img 
                        src={selectedMembership.payment_proof_url} 
                        alt="Payment proof" 
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Click to view full size</p>
                    </div>
                  </a>
                </div>
              )}

              {selectedMembership.rejection_reason && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Rejection Reason</Label>
                  <p className="text-red-600 dark:text-red-400">{selectedMembership.rejection_reason}</p>
                </div>
              )}

              {(selectedMembership as any).revoke_reason && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Revoke Reason</Label>
                  <p className="text-orange-600 dark:text-orange-400">{(selectedMembership as any).revoke_reason}</p>
                </div>
              )}

              {selectedMembership.status === 'approved' && (
                <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                  <Label className="text-gray-700 dark:text-gray-300 font-semibold">Membership Actions</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => setShowExtendModal(true)}
                    >
                      <CalendarPlus className="h-4 w-4 mr-1" />
                      Extend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                      onClick={() => setShowRevokeModal(true)}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={handleDelete}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {(selectedMembership.status === 'rejected' || selectedMembership.status === 'revoked' || selectedMembership.status === 'expired') && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Record
                  </Button>
                </div>
              )}

              {selectedMembership.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300"
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedMembership)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Premium Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Rejection Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Payment not received, Invalid transaction ID..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Ban className="h-5 w-5" />
              Revoke Premium Membership
            </DialogTitle>
            <DialogDescription>
              This will immediately revoke the user's premium access. They will lose all premium benefits.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Revoke Reason</Label>
            <Textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g., Violation of terms, Refund requested, Fraudulent activity..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleRevoke}
              disabled={!revokeReason || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Revoke Membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Modal */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <CalendarPlus className="h-5 w-5" />
              Extend Premium Membership
            </DialogTitle>
            <DialogDescription>
              Add additional days to the user's premium membership
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Days to Add</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min="1"
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-gray-500 dark:text-gray-400">days</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[7, 30, 90, 180, 365].map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendDays(days)}
                  className={extendDays === days ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''}
                >
                  {days < 30 ? `${days} days` : days < 365 ? `${days / 30} month${days > 30 ? 's' : ''}` : '1 year'}
                </Button>
              ))}
            </div>
            {selectedMembership?.expires_at && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current expiry: <strong className="text-gray-900 dark:text-white">{new Date(selectedMembership.expires_at).toLocaleDateString()}</strong>
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  New expiry: <strong>{new Date(new Date(selectedMembership.expires_at).getTime() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleExtend}
              disabled={extendDays <= 0 || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4 mr-2" />
              )}
              Extend by {extendDays} days
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
