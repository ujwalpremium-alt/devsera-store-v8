import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Send, 
  MapPin, 
  Clock,
  ExternalLink,
  Headphones
} from 'lucide-react';

export function ContactPage() {
  const { settings, isLoading } = useSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Message sent!',
      description: 'We\'ll get back to you as soon as possible.',
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const telegramUsername = settings?.telegramUsername || '@karthik_nkn';
  const telegramLink = `https://t.me/${telegramUsername.replace('@', '')}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Headphones className="h-4 w-4" />
            We're Here to Help
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Us</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            {/* Telegram - Primary */}
            <Card className="border-2 border-[#0088cc] bg-gradient-to-br from-[#0088cc]/5 to-[#0088cc]/10 dark:from-[#0088cc]/10 dark:to-[#0088cc]/20 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0088cc] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Telegram (Fastest)</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Get instant support on Telegram</p>
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#0088cc] font-semibold hover:underline"
                    >
                      {telegramUsername}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full mt-4 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl"
                >
                  <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat on Telegram
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Email */}
            {settings?.contactEmail && (
              <Card className="border-2 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg transition-all dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Send us an email anytime</p>
                      <a
                        href={`mailto:${settings.contactEmail}`}
                        className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                      >
                        {settings.contactEmail}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phone */}
            {settings?.contactPhone && (
              <Card className="border-2 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg transition-all dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">Phone</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Call us during business hours</p>
                      <a
                        href={`tel:${settings.contactPhone}`}
                        className="text-green-600 dark:text-green-400 font-semibold hover:underline"
                      >
                        {settings.contactPhone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Hours */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Response Time</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Telegram: Usually within 1 hour<br />
                      Email: Within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="font-semibold text-gray-700 dark:text-gray-300">
                        Your Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="mt-2 border-2 border-gray-200 rounded-xl focus:border-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="font-semibold text-gray-700 dark:text-gray-300">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-2 border-2 border-gray-200 rounded-xl focus:border-teal-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="font-semibold text-gray-700 dark:text-gray-300">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help you?"
                      className="mt-2 border-2 border-gray-200 rounded-xl focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="font-semibold text-gray-700 dark:text-gray-300">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more about your inquiry..."
                      className="mt-2 border-2 border-gray-200 rounded-xl focus:border-teal-500 min-h-[150px] resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold py-6 shadow-lg shadow-teal-500/25"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 text-center">
                    💡 <strong>Tip:</strong> For faster response, contact us directly on{' '}
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline"
                    >
                      Telegram
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-3xl border-2 border-gray-200 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">How long does delivery take?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Most orders are delivered within 1-24 hours after payment verification.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">We accept UPI payments. Simply scan the QR code during checkout.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Are the subscriptions genuine?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Yes! All our subscriptions are 100% genuine and come with warranty.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">What if I face any issues?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Contact us on Telegram for instant support. We're here to help!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
