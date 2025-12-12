import { useState } from 'react';
import { useAdminTickets, SupportTicket } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Send,
  Trash2,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export function TicketManager() {
  const { toast } = useToast();
  const { tickets, stats, isLoading, updateTicket, deleteTicket, refetch } = useAdminTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;

    setIsResponding(true);
    try {
      await updateTicket(selectedTicket.id, {
        adminResponse: response,
        status: 'resolved',
      });
      toast({ title: 'Response sent successfully' });
      setSelectedTicket(null);
      setResponse('');
    } catch (error: any) {
      toast({
        title: 'Error sending response',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await updateTicket(ticketId, { status });
      toast({ title: `Ticket status updated to ${status}` });
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await deleteTicket(ticketId);
      toast({ title: 'Ticket deleted successfully' });
    } catch (error: any) {
      toast({
        title: 'Error deleting ticket',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      open: { class: 'bg-blue-100 text-blue-700', icon: Clock },
      in_progress: { class: 'bg-amber-100 text-amber-700', icon: AlertCircle },
      resolved: { class: 'bg-green-100 text-green-700', icon: CheckCircle },
      closed: { class: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: XCircle },
    };
    const { class: className, icon: Icon } = config[status as keyof typeof config] || config.open;
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600 animate-pulse',
    };
    return (
      <Badge className={styles[priority as keyof typeof styles]}>
        {priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
        {priority}
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Ticket className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" />
              Support Tickets
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage customer support requests</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] sm:w-[140px] border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[120px] sm:w-[140px] border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-10">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border border-gray-200 dark:border-gray-700 rounded-xl h-10 px-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Total</p>
            <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 sm:p-4 border border-blue-100 dark:border-blue-800/50">
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Open</p>
            <p className="text-xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 mt-1">{stats.open}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 sm:p-4 border border-amber-100 dark:border-amber-800/50">
            <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">Progress</p>
            <p className="text-xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 sm:p-4 border border-emerald-100 dark:border-emerald-800/50 hidden sm:block">
            <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">Resolved</p>
            <p className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700/50 hidden sm:block">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Closed</p>
            <p className="text-xl sm:text-3xl font-black text-gray-700 dark:text-gray-300 mt-1">{stats.closed}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 sm:p-6">
        {isLoading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
            <Ticket className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-30" />
            <p className="text-base sm:text-lg font-medium">No tickets found</p>
            <p className="text-xs sm:text-sm">Adjust filters or wait for new tickets</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`border-2 rounded-xl p-3 sm:p-4 transition-all hover:shadow-md ${
                  ticket.priority === 'urgent' 
                    ? 'border-red-300 bg-red-50/50' 
                    : ticket.status === 'open'
                    ? 'border-blue-200 bg-blue-50/30'
                    : 'border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                    <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">
                      {ticket.category}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-1">{ticket.subject}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[80px] sm:max-w-none">{ticket.userName}</span>
                    </span>
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{ticket.userEmail}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {ticket.adminResponse && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs sm:text-sm">
                      <span className="text-green-700 font-medium">Response sent</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                    >
                      <SelectTrigger className="w-[100px] sm:w-[130px] border-2 text-xs sm:text-sm h-8 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setResponse(ticket.adminResponse || '');
                      }}
                      className="border-2 border-teal-500 text-teal-600 hover:bg-teal-50 h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ticket.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  From: {selectedTicket.userName} ({selectedTicket.userEmail})
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Message:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  {selectedTicket.description}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Response:</p>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="min-h-[150px] border-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRespond}
                  disabled={isResponding || !response.trim()}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white"
                >
                  {isResponding ? 'Sending...' : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
