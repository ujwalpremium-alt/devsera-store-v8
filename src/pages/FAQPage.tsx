import { HelpCircle, Search, MessageCircle, ShoppingBag, CreditCard, Clock, Shield, Package, RefreshCw, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function FAQPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'general', name: 'General', icon: HelpCircle },
    { id: 'orders', name: 'Orders', icon: ShoppingBag },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'delivery', name: 'Delivery', icon: Clock },
    { id: 'account', name: 'Account', icon: Users },
    { id: 'refunds', name: 'Refunds', icon: RefreshCw },
  ];

  const faqs = [
    {
      category: 'general',
      question: 'What is Devsera Store?',
      answer: 'Devsera Store is a trusted platform for purchasing premium digital products and subscriptions at affordable prices. We offer verified accounts for services like Netflix, Canva Pro, LinkedIn Premium, and more.',
    },
    {
      category: 'general',
      question: 'Are the products genuine?',
      answer: 'Yes, all our products are 100% genuine and verified. We source our products from authorized channels and ensure quality before delivery.',
    },
    {
      category: 'general',
      question: 'How long have you been in business?',
      answer: 'We have been serving customers since 2021 with over 10,000+ happy customers and a 4.9-star rating.',
    },
    {
      category: 'orders',
      question: 'How do I place an order?',
      answer: 'Simply browse our products, select the one you want, choose your preferred variant, and proceed to checkout. Upload your payment screenshot and submit your order.',
    },
    {
      category: 'orders',
      question: 'Can I track my order?',
      answer: 'Yes! Go to "My Orders" in your account to track the status of all your orders. You\'ll also receive notifications when your order status changes.',
    },
    {
      category: 'orders',
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled before payment verification. Once verified, cancellation may not be possible. Contact support immediately if you need to cancel.',
    },
    {
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept UPI payments (Google Pay, PhonePe, Paytm, etc.) and bank transfers. Simply scan the QR code or use the UPI ID provided at checkout.',
    },
    {
      category: 'payment',
      question: 'Is my payment secure?',
      answer: 'Yes, we use secure payment verification processes. Your payment information is never stored on our servers.',
    },
    {
      category: 'payment',
      question: 'What if I paid the wrong amount?',
      answer: 'If you paid less than the required amount, your order will be put on hold. If you paid more, the excess will be credited to your account or refunded.',
    },
    {
      category: 'delivery',
      question: 'How long does delivery take?',
      answer: 'Most orders are delivered within 1-2 hours during business hours. Instant delivery products are delivered within minutes after payment verification.',
    },
    {
      category: 'delivery',
      question: 'How will I receive my product?',
      answer: 'Digital products are delivered directly to your account. You can view your credentials in the "My Orders" section once your order is completed.',
    },
    {
      category: 'delivery',
      question: 'What if I don\'t receive my order?',
      answer: 'If you haven\'t received your order within 24 hours, please contact our support team. We\'ll investigate and resolve the issue promptly.',
    },
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on "Register" and fill in your details including name, email, and password. You\'ll receive a confirmation email to verify your account.',
    },
    {
      category: 'account',
      question: 'I forgot my password. What should I do?',
      answer: 'Click on "Forgot Password" on the login page and enter your email. You\'ll receive a link to reset your password.',
    },
    {
      category: 'account',
      question: 'How do I become a Premium member?',
      answer: 'Go to the Premium page and choose a membership plan. Premium members get exclusive discounts, early access to deals, and priority support.',
    },
    {
      category: 'refunds',
      question: 'What is your refund policy?',
      answer: 'Refunds are available for undelivered orders within 24 hours of purchase. Delivered digital products are generally non-refundable unless defective.',
    },
    {
      category: 'refunds',
      question: 'How long does a refund take?',
      answer: 'Approved refunds are processed within 3-5 business days to your original payment method.',
    },
    {
      category: 'refunds',
      question: 'Can I get a replacement instead of refund?',
      answer: 'Yes! In most cases, we prefer to replace defective products with working ones. This is usually faster than processing a refund.',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const displayedFaqs = selectedCategory
    ? filteredFaqs.filter((faq) => faq.category === selectedCategory)
    : filteredFaqs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-indigo-100 mb-8">
              Find answers to common questions about our products and services.
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full ${selectedCategory === null ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full ${selectedCategory === cat.id ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
            >
              <cat.icon className="h-4 w-4 mr-2" />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {displayedFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {displayedFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-gray-600 dark:text-gray-400 pl-8">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We couldn't find any FAQs matching your search.
                </p>
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 overflow-hidden">
            <CardContent className="p-8 text-center text-white">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">Still Have Questions?</h2>
              <p className="text-white/90 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => navigate('/support')}
                  className="bg-white text-indigo-600 hover:bg-gray-100"
                >
                  Contact Support
                </Button>
                <Button
                  onClick={() => navigate('/contact')}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
