import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTickets } from '@/hooks/useTickets';
import { useOrders } from '@/hooks/useOrders';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Ticket, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Headphones
} from 'lucide-react';

export function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { tickets, isLoading, createTicket, refetch } = useUserTickets();
  const { orders } = useOrders();
  
  const [showForm, setShowForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    orderId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket({
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        orderId: formData.orderId || undefined,
      });
      toast({
        title: 'Ticket created!',
        description: 'We\'ll get back to you as soon as possible.',
      });
      setFormData({ subject: '', description: '', category: 'general', priority: 'medium', orderId: '' });
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: 'Error creating ticket',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-100 text-blue-700 border-blue-200',
      in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
      closed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    };
    const labels = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };
    return (
      <Badge variant="outline" className={styles[priority as keyof typeof styles]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const telegramUsername = settings?.telegramUsername || '@karthik_nkn';
  const telegramLink = `https://t.me/${telegramUsername.replace('@', '')}`;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center pb-20 md:pb-0">
        <Card className="max-w-md w-full mx-4 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Headphones className="h-16 w-16 text-teal-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please login to access support and create tickets</p>
            <Button onClick={() => navigate('/login')} className="rounded-xl">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Headphones className="h-4 w-4" />
            Support Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            How Can We Help?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a support ticket or contact us directly on Telegram
          </p>
        </div>

        {/* Quick Contact */}
        <Card className="border-2 border-[#0088cc] bg-gradient-to-r from-[#0088cc]/5 to-[#0088cc]/10 dark:from-[#0088cc]/10 dark:to-[#0088cc]/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0088cc] rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Need Instant Help?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chat with us on Telegram for faster response</p>
                </div>
              </div>
              <Button asChild className="bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl">
                <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat on Telegram
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Ticket Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold py-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Support Ticket
          </Button>
        )}

        {/* Create Ticket Form */}
        {showForm && (
          <Card className="border-2 border-gray-200 dark:border-gray-700 mb-8 dark:bg-gray-800">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Create Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="mt-1 border-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-1 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="payment">Payment Problem</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="refund">Refund Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="mt-1 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Related Order (Optional)</Label>
                    <Select
                      value={formData.orderId}
                      onValueChange={(value) => setFormData({ ...formData, orderId: value })}
                    >
                      <SelectTrigger className="mt-1 border-2">
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.product?.name || 'Order'} - {order.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please describe your issue in detail..."
                    className="mt-1 border-2 min-h-[150px]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white"
                  >
                    {isSubmitting ? 'Submitting...' : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Your Tickets
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <Ticket className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tickets Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Create a ticket if you need help with anything</p>
                <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className={`border-2 transition-all ${
                    expandedTicket === ticket.id ? 'border-teal-300 dark:border-teal-700' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <CardContent className="p-4">
                    <div 
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{ticket.category.replace('_', ' ')}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedTicket === ticket.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {expandedTicket === ticket.id && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Message:</p>
                          <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                            {ticket.description}
                          </p>
                        </div>

                        {ticket.adminResponse && (
                          <div>
                            <p className="text-sm font-medium text-teal-700 mb-1 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Admin Response:
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg text-sm border border-teal-200 dark:border-teal-700">
                              {ticket.adminResponse}
                            </p>
                            {ticket.respondedAt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Responded on {new Date(ticket.respondedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}

                        {!ticket.adminResponse && ticket.status === 'open' && (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Waiting for response...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
