import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, Mail, Lock, ShoppingBag, AlertCircle } from 'lucide-react';
import { validateEmail, getAllowedDomainsDisplay } from '@/utils/emailValidation';
import { checkRateLimit, formatTimeRemaining } from '@/utils/rateLimiter';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect admins to admin dashboard, others to their intended destination
      const destination = user.role === 'admin' ? '/admin' : from;
      navigate(destination, { replace: true });
    }
  }, [user, navigate, from]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Validate email on change (only show error if email looks complete)
    if (newEmail.includes('@') && newEmail.includes('.')) {
      const validation = validateEmail(newEmail);
      setEmailError(validation.isValid ? null : validation.error || null);
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit
    const rateLimit = checkRateLimit(`login-${email}`, 5, 60000); // 5 attempts per minute
    if (rateLimit.isLimited) {
      const errorMsg = `Too many login attempts. Please try again in ${formatTimeRemaining(rateLimit.resetIn)}.`;
      setRateLimitError(errorMsg);
      toast({
        title: 'Rate Limited',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }
    setRateLimitError(null);
    
    // Validate email before submission
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Invalid email');
      toast({
        title: 'Invalid Email',
        description: emailValidation.error,
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      // Navigation will happen via useEffect when user state updates
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error?.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Devsera Store</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Login to access your orders and continue shopping
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`pl-10 h-12 border-2 rounded-xl focus:ring-2 dark:bg-gray-800 ${
                    emailError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-teal-500/20'
                  }`}
                />
              </div>
              {emailError && (
                <div className="flex items-start gap-2 text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {rateLimitError && (
              <div className="flex items-start gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{rateLimitError}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
                <Link to="/forgot-password" className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:bg-gray-800"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" state={{ from }} className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Premium Services at Unbeatable Prices
          </h2>
          <p className="text-white/80 text-lg">
            Access Canva Pro, LinkedIn Premium, Netflix, and more. Verified accounts, fast delivery, 24/7 support.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-sm text-white/70">Happy Users</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">4.9★</p>
              <p className="text-sm text-white/70">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="absolute bottom-4 left-0 right-0 text-center lg:hidden">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By signing in, you agree to our{' '}
          <Link to="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
