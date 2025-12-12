import { RotateCcw, CheckCircle2, XCircle, Clock, AlertCircle, MessageCircle, CreditCard, Shield, HelpCircle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function RefundPage() {
  const navigate = useNavigate();
  const lastUpdated = 'January 15, 2024';

  const eligibleCases = [
    { text: 'Order not delivered within 24 hours', icon: Clock },
    { text: 'Product credentials not working', icon: XCircle },
    { text: 'Wrong product delivered', icon: AlertCircle },
    { text: 'Duplicate payment made', icon: CreditCard },
    { text: 'Technical issues preventing delivery', icon: Shield },
  ];

  const nonEligibleCases = [
    'Product already activated/used',
    'Request made after 24 hours of delivery',
    'Change of mind after purchase',
    'Incorrect account details provided by customer',
    'Third-party service issues (e.g., Netflix account suspended)',
    'Promotional or discounted items (unless defective)',
  ];

  const refundProcess = [
    {
      step: 1,
      title: 'Submit Request',
      description: 'Contact our support team via Telegram or create a support ticket with your order details.',
      time: 'Immediate',
    },
    {
      step: 2,
      title: 'Review',
      description: 'Our team will review your request and verify the issue within 2-4 hours.',
      time: '2-4 hours',
    },
    {
      step: 3,
      title: 'Resolution',
      description: 'If approved, we\'ll either replace the product or initiate a refund.',
      time: 'Same day',
    },
    {
      step: 4,
      title: 'Refund Processing',
      description: 'Refunds are processed to your original payment method within 3-5 business days.',
      time: '3-5 days',
    },
  ];

  const faqs = [
    {
      question: 'How long do I have to request a refund?',
      answer: 'You must request a refund within 24 hours of purchase for undelivered orders, or within 24 hours of delivery for defective products.',
    },
    {
      question: 'How will I receive my refund?',
      answer: 'Refunds are processed to your original payment method (UPI). The amount will be credited within 3-5 business days after approval.',
    },
    {
      question: 'Can I get a refund if I changed my mind?',
      answer: 'Unfortunately, we cannot offer refunds for change of mind as digital products cannot be returned once delivered.',
    },
    {
      question: 'What if my product stops working after some time?',
      answer: 'Products come with a warranty period (varies by product). If issues occur within the warranty period, we\'ll replace the product free of charge.',
    },
    {
      question: 'Can I exchange instead of refund?',
      answer: 'Yes! In most cases, we prefer to replace the product with a working one. This is usually faster than processing a refund.',
    },
    {
      question: 'What information do I need for a refund request?',
      answer: 'Please provide your order ID, email address, description of the issue, and any relevant screenshots or proof.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Refund & Return Policy</h1>
            <p className="text-orange-100">
              We want you to be completely satisfied with your purchase. Here's our refund policy.
            </p>
            <p className="text-sm text-orange-200 mt-4">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Need a Refund?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contact our support team for quick assistance</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/support')} className="bg-orange-500 hover:bg-orange-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Get Support
                </Button>
                <Button onClick={() => navigate('/contact')} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Eligible Cases */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                Eligible for Refund
              </h2>
              <div className="space-y-3">
                {eligibleCases.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Non-Eligible Cases */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                Not Eligible for Refund
              </h2>
              <div className="space-y-2">
                {nonEligibleCases.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Refund Process */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-500" />
                Refund Process
              </h2>
              <div className="space-y-4">
                {refundProcess.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        {item.step}
                      </div>
                      {index < refundProcess.length - 1 && (
                        <div className="w-0.5 h-full bg-blue-200 dark:bg-blue-800 my-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Important Notes
              </h2>
              <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Refund requests must include order ID and proof of issue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>We reserve the right to deny refunds for policy violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Partial refunds may be offered for partially used products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Replacement is preferred over refund when possible</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* FAQs */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-purple-500" />
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="font-medium text-gray-900 dark:text-white text-left">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact CTA */}
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 overflow-hidden">
            <CardContent className="p-8 text-center text-white">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">Still Have Questions?</h2>
              <p className="text-white/90 mb-6">
                Our support team is here to help you with any refund-related queries.
              </p>
              <Button 
                onClick={() => navigate('/support')} 
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
