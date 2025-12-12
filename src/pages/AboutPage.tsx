import { Shield, Users, Award, Clock, Heart, Zap, CheckCircle2, Star, MessageCircle, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AboutPage() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Users },
    { label: 'Products Delivered', value: '50,000+', icon: Award },
    { label: 'Years of Service', value: '3+', icon: Clock },
    { label: 'Customer Rating', value: '4.9/5', icon: Star },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Your data and transactions are protected with industry-standard security measures.',
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Get your digital products delivered within hours, not days.',
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We prioritize your satisfaction with dedicated support and hassle-free service.',
    },
    {
      icon: CheckCircle2,
      title: 'Quality Guaranteed',
      description: 'All our products are verified and come with full warranty support.',
    },
  ];

  const team = [
    { name: 'Support Team', role: 'Available 24/7', description: 'Our dedicated support team is always ready to help you.' },
    { name: 'Verification Team', role: 'Quick Processing', description: 'Orders are verified and processed within 1-2 hours.' },
    { name: 'Quality Team', role: 'Product Assurance', description: 'Every product is tested before delivery.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="container mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">About Devsera Store</h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Your trusted destination for premium digital products and subscriptions. 
              We've been serving customers since 2021 with a commitment to quality and customer satisfaction.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/')} 
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Browse Products
              </Button>
              <Button 
                onClick={() => navigate('/contact')} 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardContent className="p-6 text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Story</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Devsera Store was founded with a simple mission: to make premium digital products accessible to everyone. 
            We started as a small team passionate about technology and customer service. Today, we've grown to serve 
            thousands of customers across the country, delivering quality products with unmatched support.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
            We believe in transparency, fair pricing, and building long-term relationships with our customers. 
            Every product we offer is carefully selected and verified to ensure you get the best value for your money.
          </p>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-gray-100 dark:bg-gray-800/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Our Team */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {team.map((member) => (
            <Card key={member.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center text-white">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Have Questions?</h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Our support team is available 24/7 to help you with any questions or concerns.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/support')} 
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Get Support
              </Button>
              <Button 
                onClick={() => navigate('/contact')} 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
