import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ShoppingBag, LayoutDashboard, LogOut, Menu, X, ChevronDown, Package, Phone, Ticket, Gift, Moon, Sun, Crown, Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link 
        to="/" 
        onClick={() => setIsOpen(false)}
        className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 ${mobile ? 'text-base py-2' : 'text-sm'}`}
      >
        Products
      </Link>
      <Link 
        to="/bundles" 
        onClick={() => setIsOpen(false)}
        className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 ${mobile ? 'text-base py-2' : 'text-sm'}`}
      >
        <Package className="h-4 w-4" />
        Bundles
      </Link>
      <Link 
        to="/community" 
        onClick={() => setIsOpen(false)}
        className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 ${mobile ? 'text-base py-2' : 'text-sm'}`}
      >
        Community
      </Link>
      <Link 
        to="/premium" 
        onClick={() => setIsOpen(false)}
        className={`font-semibold transition-colors text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 ${mobile ? 'text-base py-2' : 'text-sm'}`}
      >
        <Crown className="h-4 w-4" />
        Premium
      </Link>
      <Link 
        to="/rewards" 
        onClick={() => setIsOpen(false)}
        className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 ${mobile ? 'text-base py-2' : 'text-sm'}`}
      >
        <Gift className="h-4 w-4" />
        Rewards
      </Link>
      <Link 
        to="/support" 
        onClick={() => setIsOpen(false)}
        className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 ${mobile ? 'text-base py-2' : 'text-sm'}`}
      >
        <Ticket className="h-4 w-4" />
        Support
      </Link>
      {user && (
        <Link 
          to="/orders" 
          onClick={() => setIsOpen(false)}
          className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 ${mobile ? 'text-base py-2' : 'text-sm'}`}
        >
          My Orders
        </Link>
      )}
      {user?.role === 'admin' && (
        <Link 
          to="/admin" 
          onClick={() => setIsOpen(false)}
          className={`font-semibold transition-colors text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 ${mobile ? 'text-base py-2' : 'text-sm'}`}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-all duration-300 group-hover:scale-105">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent hidden xs:inline">
              Devsera Store
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <NavLinks />
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              )}
            </Button>

            {user ? (
              <>
                {/* Desktop User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="hidden lg:flex items-center gap-2 px-2 xl:px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm font-semibold">
                          {getInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                          {user.role === 'admin' ? 'Administrator' : 'Member'}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border border-gray-200 p-1">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile')}
                      className="rounded-lg cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/orders')}
                      className="rounded-lg cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4 mr-3 text-gray-500" />
                      My Orders
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem 
                        onClick={() => navigate('/admin')}
                        className="rounded-lg cursor-pointer"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-3 text-gray-500" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')} 
                  className="rounded-xl font-semibold hover:bg-gray-100 text-sm"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/register')} 
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all text-sm"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-gray-100">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
                  </div>

                  {/* User Profile Section (Mobile) */}
                  {user && (
                    <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-lg font-semibold">
                            {getInitials(user.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 mt-1">
                            {user.role === 'admin' ? 'Administrator' : 'Member'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <nav className="flex flex-col p-4 space-y-1 overflow-y-auto flex-1">
                    <NavLinks mobile />
                  </nav>

                  {/* Mobile Auth Buttons */}
                  <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                    {!user ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => handleNavigate('/login')} 
                          className="w-full rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700"
                        >
                          Login
                        </Button>
                        <Button 
                          onClick={() => handleNavigate('/register')} 
                          className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold"
                        >
                          Sign Up
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={handleLogout} 
                        className="w-full rounded-xl font-semibold border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
