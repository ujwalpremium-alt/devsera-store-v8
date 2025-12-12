import { Shield, Eye, Lock, Database, Share2, Bell, Trash2, Mail, Globe, Cookie } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function PrivacyPage() {
  const lastUpdated = 'January 15, 2024';

  const sections = [
    {
      id: 'collection',
      title: '1. Information We Collect',
      icon: Database,
      content: `We collect information you provide directly to us:

Personal Information:
• Name and email address (during registration)
• Phone number (optional, for support)
• Payment information (UPI ID, transaction screenshots)
• Account credentials (for manual activation products)

Automatically Collected Information:
• Device information (browser type, operating system)
• IP address and location data
• Usage data (pages visited, time spent)
• Cookies and similar tracking technologies`
    },
    {
      id: 'usage',
      title: '2. How We Use Your Information',
      icon: Eye,
      content: `We use the information we collect to:

Service Delivery:
• Process and fulfill your orders
• Verify payments and activate products
• Provide customer support
• Send order confirmations and updates

Improvement & Communication:
• Improve our services and user experience
• Send promotional offers (with your consent)
• Analyze usage patterns and trends
• Prevent fraud and ensure security`
    },
    {
      id: 'sharing',
      title: '3. Information Sharing',
      icon: Share2,
      content: `We do NOT sell your personal information. We may share your information with:

Service Providers:
• Payment processors for transaction verification
• Cloud hosting providers for data storage
• Analytics services for usage insights

Legal Requirements:
• When required by law or legal process
• To protect our rights and safety
• To prevent fraud or illegal activities

With Your Consent:
• When you explicitly authorize sharing
• For specific promotional activities you opt into`
    },
    {
      id: 'security',
      title: '4. Data Security',
      icon: Lock,
      content: `We implement industry-standard security measures:

Technical Safeguards:
• SSL/TLS encryption for data transmission
• Secure password hashing
• Regular security audits
• Access controls and authentication

Operational Security:
• Limited employee access to personal data
• Regular security training
• Incident response procedures
• Data backup and recovery systems

Note: While we strive to protect your data, no method of transmission over the Internet is 100% secure.`
    },
    {
      id: 'cookies',
      title: '5. Cookies & Tracking',
      icon: Cookie,
      content: `We use cookies and similar technologies for:

Essential Cookies:
• Authentication and session management
• Security and fraud prevention
• Shopping cart functionality

Analytics Cookies:
• Understanding how you use our site
• Improving user experience
• Measuring marketing effectiveness

You can control cookies through your browser settings. Disabling certain cookies may affect site functionality.`
    },
    {
      id: 'rights',
      title: '6. Your Rights',
      icon: Shield,
      content: `You have the right to:

Access & Control:
• Access your personal information
• Correct inaccurate data
• Request deletion of your data
• Export your data in a portable format

Communication Preferences:
• Opt-out of marketing communications
• Manage notification settings
• Unsubscribe from newsletters

To exercise these rights, contact us at support@devserastore.com`
    },
    {
      id: 'retention',
      title: '7. Data Retention',
      icon: Trash2,
      content: `We retain your information for:

Active Accounts:
• As long as your account is active
• As needed to provide services

After Account Deletion:
• Transaction records: 7 years (legal requirement)
• Support tickets: 2 years
• Analytics data: 1 year (anonymized)

You can request account deletion at any time. Some data may be retained for legal compliance.`
    },
    {
      id: 'children',
      title: '8. Children\'s Privacy',
      icon: Shield,
      content: `Our services are not intended for children under 18 years of age.

We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.

If we discover that we have collected personal information from a child under 18, we will delete that information promptly.`
    },
    {
      id: 'international',
      title: '9. International Users',
      icon: Globe,
      content: `Our services are primarily operated in India.

If you access our services from outside India:
• Your information may be transferred to and processed in India
• You consent to this transfer by using our services
• We comply with applicable data protection laws

For EU users: We comply with GDPR requirements for data protection and privacy.`
    },
    {
      id: 'updates',
      title: '10. Policy Updates',
      icon: Bell,
      content: `We may update this Privacy Policy from time to time.

Notification of Changes:
• Material changes will be notified via email
• Updated policy will be posted on this page
• Last updated date will be revised

Your continued use of our services after changes indicates acceptance of the updated policy.`
    },
    {
      id: 'contact',
      title: '11. Contact Us',
      icon: Mail,
      content: `For privacy-related questions or concerns:

Email: privacy@devserastore.com
Support: support@devserastore.com
Telegram: @devserastore

Data Protection Officer:
Email: dpo@devserastore.com

We aim to respond to all privacy inquiries within 48 hours.`
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-emerald-100">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-emerald-200 mt-4">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 max-w-3xl mx-auto">
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-500" />
              Privacy at a Glance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Data Encryption</p>
                  <p className="text-gray-600 dark:text-gray-400">All data is encrypted in transit and at rest</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Share2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">No Data Selling</p>
                  <p className="text-gray-600 dark:text-gray-400">We never sell your personal information</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Trash2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Data Deletion</p>
                  <p className="text-gray-600 dark:text-gray-400">Request deletion of your data anytime</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Opt-Out Options</p>
                  <p className="text-gray-600 dark:text-gray-400">Control your communication preferences</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {sections.map((section) => (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <section.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-left">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="pl-13 text-gray-600 dark:text-gray-400 whitespace-pre-line text-sm leading-relaxed">
                    {section.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Footer Note */}
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We are committed to protecting your privacy. If you have any questions or concerns about this policy, 
                please don't hesitate to contact us.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
