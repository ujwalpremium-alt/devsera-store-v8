import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Copy, 
  Check, 
  Key, 
  User, 
  Lock, 
  Link as LinkIcon, 
  Calendar, 
  Info,
  Shield,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Clock
} from 'lucide-react';
import { OrderCredentials, DeliveryType } from '@/types';

interface OrderCredentialsCardProps {
  credentials: OrderCredentials;
  deliveryType: DeliveryType;
  productName: string;
  productDuration?: string;
}

export function OrderCredentialsCard({ 
  credentials, 
  deliveryType, 
  productName,
  productDuration 
}: OrderCredentialsCardProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: 'Copied!',
      description: `${fieldName} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => handleCopy(text, fieldName)}
      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {copiedField === fieldName ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-gray-500" />
      )}
    </Button>
  );

  const getDeliveryTypeConfig = () => {
    switch (deliveryType) {
      case 'CREDENTIALS':
        return {
          title: 'Login Credentials',
          icon: <Key className="h-6 w-6" />,
          gradient: 'from-blue-500 to-indigo-500',
          bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'COUPON_CODE':
        return {
          title: 'Coupon / License Key',
          icon: <Sparkles className="h-6 w-6" />,
          gradient: 'from-purple-500 to-pink-500',
          bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      case 'MANUAL_ACTIVATION':
        return {
          title: 'Account Activated',
          icon: <Shield className="h-6 w-6" />,
          gradient: 'from-green-500 to-emerald-500',
          bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'INSTANT_KEY':
        return {
          title: 'Instant Access Key',
          icon: <Key className="h-6 w-6" />,
          gradient: 'from-amber-500 to-orange-500',
          bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      default:
        return {
          title: 'Your Credentials',
          icon: <Key className="h-6 w-6" />,
          gradient: 'from-teal-500 to-emerald-500',
          bgGradient: 'from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20',
          borderColor: 'border-teal-200 dark:border-teal-800'
        };
    }
  };

  const config = getDeliveryTypeConfig();

  return (
    <Card className={`border-2 ${config.borderColor} shadow-xl overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            {config.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold">{config.title}</h3>
            <p className="text-white/80 text-sm">{productName}</p>
          </div>
        </div>
      </div>

      <CardContent className={`p-6 bg-gradient-to-br ${config.bgGradient}`}>
        <div className="space-y-4">
          {/* Username */}
          {credentials.username && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Username / Email</span>
                </div>
                <CopyButton text={credentials.username} fieldName="Username" />
              </div>
              <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white break-all">
                {credentials.username}
              </p>
            </div>
          )}

          {/* Password */}
          {credentials.password && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Password</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                  <CopyButton text={credentials.password} fieldName="Password" />
                </div>
              </div>
              <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                {showPassword ? credentials.password : '••••••••••••'}
              </p>
            </div>
          )}

          {/* Coupon Code */}
          {credentials.couponCode && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border-2 border-purple-300 dark:border-purple-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Coupon Code</span>
                </div>
                <CopyButton text={credentials.couponCode} fieldName="Coupon Code" />
              </div>
              <p className="font-mono text-2xl font-bold text-purple-700 dark:text-purple-300 tracking-wider">
                {credentials.couponCode}
              </p>
            </div>
          )}

          {/* License Key */}
          {credentials.licenseKey && (
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">License Key</span>
                </div>
                <CopyButton text={credentials.licenseKey} fieldName="License Key" />
              </div>
              <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300 break-all">
                {credentials.licenseKey}
              </p>
            </div>
          )}

          {/* Activation Link */}
          {credentials.activationLink && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Activation Link</span>
                </div>
                <CopyButton text={credentials.activationLink} fieldName="Activation Link" />
              </div>
              <a
                href={credentials.activationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                Open Activation Link
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Activation Status (for manual activation) */}
          {credentials.activationStatus && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Activation Status</span>
              </div>
              <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                {credentials.activationStatus}
              </Badge>
              {credentials.activationNotes && (
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  {credentials.activationNotes}
                </p>
              )}
            </div>
          )}

          {/* Expiry Date */}
          {credentials.expiryDate && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Valid Until</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {new Date(credentials.expiryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Duration Badge */}
          {productDuration && !credentials.expiryDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Subscription Duration: <strong className="text-gray-900 dark:text-white">{productDuration}</strong></span>
            </div>
          )}

          {/* Additional Info */}
          {credentials.additionalInfo && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Additional Information</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {credentials.additionalInfo}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-teal-500" />
            How to Use
          </h4>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {deliveryType === 'CREDENTIALS' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 flex-shrink-0">1</span>
                  <span>Go to the service's login page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 flex-shrink-0">2</span>
                  <span>Enter the username and password provided above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 flex-shrink-0">3</span>
                  <span>Do not change the password or share with others</span>
                </li>
              </>
            )}
            {deliveryType === 'COUPON_CODE' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">1</span>
                  <span>Copy the coupon code above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">2</span>
                  <span>Go to the service's redemption page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">3</span>
                  <span>Paste the code and activate your subscription</span>
                </li>
              </>
            )}
            {deliveryType === 'MANUAL_ACTIVATION' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 flex-shrink-0">1</span>
                  <span>Your account has been activated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 flex-shrink-0">2</span>
                  <span>Login with your existing credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 flex-shrink-0">3</span>
                  <span>Enjoy your premium subscription!</span>
                </li>
              </>
            )}
            {deliveryType === 'INSTANT_KEY' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">1</span>
                  <span>Copy the license key above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">2</span>
                  <span>Open the software and go to activation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">3</span>
                  <span>Enter the key to unlock premium features</span>
                </li>
              </>
            )}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
