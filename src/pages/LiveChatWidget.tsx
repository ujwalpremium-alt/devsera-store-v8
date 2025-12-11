import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  ExternalLink,
  Bot,
  User,
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const FAQ_RESPONSES: { [key: string]: string } = {
  'order': 'You can track your order status in the "My Orders" section. If you have any issues, please create a support ticket or contact us on Telegram.',
  'payment': 'We accept UPI payments. After making the payment, upload the screenshot on the checkout page. Your order will be processed within 1-24 hours.',
  'delivery': 'Most orders are delivered within 1-24 hours after payment verification. You will receive your credentials via email and in your orders page.',
  'refund': 'For refund requests, please create a support ticket with your order details. Refunds are processed within 3-5 business days.',
  'subscription': 'All our subscriptions are genuine and come with warranty. If you face any issues, contact us immediately.',
  'contact': 'You can reach us on Telegram for instant support. Click the Telegram button below to chat with us directly.',
  'points': 'You earn 10 points for every ₹100 spent. Collect 5000 points to get a ₹100 discount coupon!',
  'referral': 'Share your referral code with friends. You earn 100 points when they make their first purchase, and they get 50 bonus points!',
};

export function LiveChatWidget() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const telegramUsername = settings?.telegramUsername || '@karthik_nkn';
  const telegramLink = `https://t.me/${telegramUsername.replace('@', '')}`;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setMessages([
        {
          id: '1',
          text: `Hi${user ? ` ${user.name}` : ''}! 👋 I'm your virtual assistant. How can I help you today?\n\nYou can ask about:\n• Orders & Delivery\n• Payments\n• Refunds\n• Subscriptions\n• Points & Rewards\n• Referrals\n\nOr click "Chat on Telegram" for instant human support!`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(keyword)) {
        return response;
      }
    }

    return "I'm not sure about that. For detailed assistance, please contact us on Telegram or create a support ticket. Our team will be happy to help!";
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: findResponse(message),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-500/30 z-50"
      >
        <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden transition-all duration-300 ${
        isMinimized
          ? 'bottom-4 right-4 md:bottom-6 md:right-6 w-72 h-14'
          : 'bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-96 h-[100vh] md:h-[500px] md:rounded-2xl rounded-none'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm md:text-base">Support Chat</p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-white/80">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 h-[calc(100vh-180px)] md:h-[320px] bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 md:px-4 md:py-2 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Telegram Button */}
          <div className="px-3 md:px-4 py-2 bg-white border-t border-gray-100">
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-sm font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on Telegram ({telegramUsername})
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Input */}
          <div className="p-3 md:p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 border-2 rounded-xl text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
