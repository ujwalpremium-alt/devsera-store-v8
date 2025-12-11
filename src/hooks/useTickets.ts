import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SupportTicket {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  description: string;
  category: 'general' | 'order' | 'payment' | 'technical' | 'refund';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  orderId?: string;
  adminResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function useUserTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    if (!isSupabaseConfigured || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTickets(
        data.map((t) => ({
          id: t.id,
          userId: t.user_id,
          subject: t.subject,
          description: t.description,
          category: t.category,
          priority: t.priority,
          status: t.status,
          orderId: t.order_id,
          adminResponse: t.admin_response,
          respondedAt: t.responded_at,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (ticket: {
    subject: string;
    description: string;
    category: string;
    priority: string;
    orderId?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    if (!isSupabaseConfigured) {
      const newTicket: SupportTicket = {
        id: `TICKET-${Date.now()}`,
        userId: user.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category as any,
        priority: ticket.priority as any,
        status: 'open',
        orderId: ticket.orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets([newTicket, ...tickets]);
      return newTicket;
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: ticket.subject,
        message: ticket.description,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        order_id: ticket.orderId && ticket.orderId !== 'none' ? ticket.orderId : null,
      })
      .select()
      .single();

    if (error) throw error;
    await loadTickets();
    return data;
  };

  return { tickets, isLoading, error, refetch: loadTickets, createTicket };
}

export function useAdminTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profile:profiles(full_name, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTickets = data.map((t) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.profile?.full_name || t.profile?.name || t.profile?.email?.split('@')[0] || 'Unknown',
        userEmail: t.profile?.email || '',
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        orderId: t.order_id,
        adminResponse: t.admin_response,
        respondedAt: t.responded_at,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTickets(mappedTickets);
      
      setStats({
        total: mappedTickets.length,
        open: mappedTickets.filter(t => t.status === 'open').length,
        inProgress: mappedTickets.filter(t => t.status === 'in_progress').length,
        resolved: mappedTickets.filter(t => t.status === 'resolved').length,
        closed: mappedTickets.filter(t => t.status === 'closed').length,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicket = async (ticketId: string, updates: {
    status?: string;
    adminResponse?: string;
    priority?: string;
  }) => {
    if (!isSupabaseConfigured) {
      setTickets(tickets.map(t => 
        t.id === ticketId 
          ? { ...t, ...updates, updatedAt: new Date().toISOString() } 
          : t
      ));
      return;
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.status) updateData.status = updates.status;
    if (updates.adminResponse !== undefined) {
      updateData.admin_response = updates.adminResponse;
      updateData.responded_at = new Date().toISOString();
    }
    if (updates.priority) updateData.priority = updates.priority;

    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) throw error;
    await loadTickets();
  };

  const deleteTicket = async (ticketId: string) => {
    if (!isSupabaseConfigured) {
      setTickets(tickets.filter(t => t.id !== ticketId));
      return;
    }

    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
    await loadTickets();
  };

  return { tickets, stats, isLoading, error, refetch: loadTickets, updateTicket, deleteTicket };
}
