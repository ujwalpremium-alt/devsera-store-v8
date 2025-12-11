import { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { Header } from '@/components/shared/Header';
import { BottomNav } from '@/components/shared/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { BundleOffersPage } from '@/pages/BundleOffersPage';
import { ContactPage } from '@/pages/ContactPage';
import { SupportPage } from '@/pages/SupportPage';
import { RewardsPage } from '@/pages/RewardsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LiveChatWidget } from '@/pages/LiveChatWidget';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import PremiumPage from '@/pages/PremiumPage';
import PremiumExclusivePage from '@/pages/PremiumExclusivePage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/bundles" element={<BundleOffersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route
          path="/premium/exclusive"
          element={
            <ProtectedRoute>
              <PremiumExclusivePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:id"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-confirmation/:orderId"
          element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <BottomNav />
      <LiveChatWidget />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WishlistProvider>
          <AuthProvider>
            <Suspense fallback={<p>Loading...</p>}>
              <AppRoutes />
            </Suspense>
          </AuthProvider>
        </WishlistProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
