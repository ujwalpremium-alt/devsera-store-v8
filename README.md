# Devsera Store - E-commerce Subscription Marketplace

A full-stack subscription marketplace where users purchase shared access to premium services (Canva Pro, LinkedIn Premium, Netflix, etc.) via UPI payment.

## Features

### User Features
- **Product Browsing**: Browse premium subscription services with detailed information
- **Secure Authentication**: Register and login via Supabase Auth
- **Order Management**: Track orders from payment to credential delivery
- **Payment Flow**: UPI-based payment with QR code and screenshot upload to Supabase Storage
- **Community**: Share experiences and connect with other users
- **Order Status Tracking**: Real-time order status updates (PENDING → SUBMITTED → COMPLETED/CANCELLED)

### Admin Features
- **Dashboard Metrics**: View revenue, order counts, and platform statistics
- **Order Verification**: Review payment screenshots and approve/reject orders
- **Account Pool Management**: Manage shared accounts with slot utilization tracking
- **Settings Configuration**: Update UPI details, QR codes, and contact information

## Tech Stack

- **Framework**: React 18 + Vite
- **Backend**: Supabase (Auth, Database, Storage)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Run migrations (in Supabase dashboard or CLI)
# Apply migrations from supabase/migrations/

# Start development server
npm run dev

# Build for production
npm run build
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` folder:
   - `20240101000000_initial_schema.sql` - Creates tables, RLS policies, triggers
   - `20240101000001_seed_data.sql` - Seeds initial products and settings
3. Create a storage bucket named `order-files` with public access
4. Copy your project URL and anon key to `.env.local`

### Database Schema

- **profiles**: User profiles (linked to auth.users)
- **products**: Subscription products catalog
- **orders**: Order records with status tracking
- **accounts**: Shared account pool for products
- **community_posts**: User-generated community content
- **reviews**: Product reviews and ratings
- **settings**: Platform settings (UPI, QR code, contact info)

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Public read access for products, reviews, community posts
- User-specific access for orders
- Admin-only access for accounts and settings management

## Project Structure

```
src/
├── components/
│   ├── admin/              # Admin-specific components
│   ├── products/           # Product display components
│   ├── shared/             # Shared components (Header, StatusBadge)
│   └── ui/                 # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx     # Supabase authentication context
├── hooks/
│   ├── useProducts.ts      # Product data hooks
│   ├── useOrders.ts        # Order management hooks
│   ├── useCommunity.ts     # Community posts hooks
│   └── useSettings.ts      # Settings management hooks
├── lib/
│   └── supabase.ts         # Supabase client configuration
├── pages/
│   ├── admin/              # Admin pages
│   ├── HomePage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrdersPage.tsx
│   ├── CommunityPage.tsx
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── types/
│   ├── index.ts            # TypeScript type definitions
│   └── supabase.ts         # Supabase database types
└── App.tsx                 # Main app with routing
```

## Key Features Implementation

### Order Lifecycle
1. **PENDING**: User creates order, awaits payment upload
2. **SUBMITTED**: Payment screenshot uploaded to Supabase Storage, awaiting admin verification
3. **COMPLETED**: Admin approves, credentials delivered to user
4. **CANCELLED**: Admin rejects with reason

### Payment Flow
1. User selects product and proceeds to checkout
2. Order created in database with PENDING status
3. System displays UPI QR code and UPI ID from settings
4. User makes payment and uploads screenshot to Supabase Storage
5. Order status updated to SUBMITTED
6. Admin verifies payment and assigns credentials
7. User receives credentials in order details

### Admin Workflow
1. Monitor dashboard metrics from real-time database
2. Review payment screenshots from Supabase Storage
3. Approve orders by assigning account credentials
4. Reject orders with detailed reasons
5. Manage account pool with slot utilization tracking

## Design System

### Swiss International with Brutalist Accents
- **Typography**: Space Grotesk (headings), Manrope (body), JetBrains Mono (monospace)
- **Colors**: Warm off-white background (#FAFAF8), deep teal primary (#0A7A7A), semantic status colors
- **Components**: 2px black borders, brutalist shadows, bento-grid layouts
- **Motion**: Smooth transitions with tactile feedback

## Security

- Row Level Security (RLS) enabled on all tables
- Secure authentication via Supabase Auth
- Admin role verification for sensitive operations
- File upload validation and size limits
- Public storage bucket for payment screenshots (admin verification required)

## Future Enhancements

- Real-time order notifications via Supabase Realtime
- Email notifications via Supabase Edge Functions
- Review and rating system with verification
- Community engagement features (likes, comments)
- Payment gateway integration
- Refund management
- Analytics dashboard

## License

MIT

---

Built with ❤️ for Tempo Platform
