import { useState } from 'react';
import { useAdminTickets, SupportTicket } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      closed: { class: 'bg-gray-100 text-gray-700', icon: XCircle },
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
      low: 'bg-gray-100 text-gray-600',
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
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Support Tickets
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] border-2 border-black">
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
              <SelectTrigger className="w-[130px] border-2 border-black">
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
              className="border-2 border-black"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="bg-white rounded-lg p-3 border-2 border-gray-200">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
            <p className="text-xs text-blue-600">Open</p>
            <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border-2 border-amber-200">
            <p className="text-xs text-amber-600">In Progress</p>
            <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
            <p className="text-xs text-green-600">Resolved</p>
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
            <p className="text-xs text-gray-600">Closed</p>
            <p className="text-2xl font-bold text-gray-700">{stats.closed}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Ticket className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm">Adjust filters or wait for new tickets</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                  ticket.priority === 'urgent' 
                    ? 'border-red-300 bg-red-50/50' 
                    : ticket.status === 'open'
                    ? 'border-blue-200 bg-blue-50/30'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <Badge variant="outline" className="capitalize">
                        {ticket.category}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {ticket.userEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {ticket.adminResponse && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700 font-medium">Response sent</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                    >
                      <SelectTrigger className="w-[130px] border-2">
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
                      className="border-2 border-teal-500 text-teal-600 hover:bg-teal-50"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ticket.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

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
                <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  From: {selectedTicket.userName} ({selectedTicket.userEmail})
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Customer Message:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  {selectedTicket.description}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Your Response:</p>
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
    </Card>
  );
}
