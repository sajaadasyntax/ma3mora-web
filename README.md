# Ma3mora Web - Frontend

This is the frontend application for the Ma3mora Inventory Management System.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **jsPDF** for PDF generation

## Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm
- Backend API running (see `apps/api/README.md`)

## Independent Setup & Installation

### 1. Navigate to the web directory
```bash
cd apps/web
```

### 2. Install dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the `apps/web` directory:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Running the Frontend

### Development Mode
```bash
npm run dev
```
The app will run on `http://localhost:3000`

#### Run on Different Port
```bash
npm run dev:3001
```
The app will run on `http://localhost:3001`

### Production Build
```bash
# Build
npm run build

# Start
npm start
```

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run dev:3001` - Start development server on port 3001
- `npm run build` - Build for production
- `npm start` - Start production server on port 3000
- `npm run start:3001` - Start production server on port 3001
- `npm run lint` - Run ESLint

## Features & Pages

### Public Pages
- `/` - Redirects to login
- `/login` - Login page

### Dashboard Pages (Authenticated)
- `/dashboard` - Main dashboard with overview
- `/dashboard/items` - Items and pricing management
- `/dashboard/inventories` - Inventory stock levels
- `/dashboard/customers` - Customer management
- `/dashboard/customers/[id]` - Customer detail with accounts receivable
- `/dashboard/suppliers` - Supplier management
- `/dashboard/suppliers/[id]` - Supplier details
- `/dashboard/sales` - Sales invoices list
- `/dashboard/sales/new` - Create new sales invoice
- `/dashboard/sales/[id]` - Sales invoice details with payment recording
- `/dashboard/procurement` - Procurement orders list
- `/dashboard/procurement/[id]` - Procurement order details
- `/dashboard/accounting` - Accounting dashboard
- `/dashboard/accounting/expenses` - Expense management
- `/dashboard/accounting/opening-balance` - Opening balance setup
- `/dashboard/accounting/balance-sheet` - Balance sheet view
- `/dashboard/audit` - Audit logs

## User Roles & Permissions

### ACCOUNTANT
✅ **Can:**
- View all pages
- Access detail pages
- Update item prices
- Record payments on sales invoices
- Create expenses
- Manage opening balances
- View reports and audit logs

❌ **Cannot:**
- Create items, customers, suppliers
- Create sales invoices or procurement orders
- Deliver invoices or receive orders

### PROCUREMENT
- Create and manage items
- Create and delete items (when stock = 0)
- Create suppliers
- Create procurement orders
- View all related pages

### INVENTORY
- Deliver sales invoices
- Receive procurement orders
- View inventory stocks

### SALES_GROCERY / SALES_BAKERY
- Create customers
- Create sales invoices
- Record payments
- View customer details

### AUDITOR
- Read-only access to all pages
- View audit logs
- Cannot create or modify anything

## Key Features

### 📊 Financial Management
- **Customer Accounts Receivable (الذمم المدينة)**
  - View outstanding balances per customer
  - Track paid vs unpaid amounts
  - Filter by payment status

### 🛒 Sales Management
- Create sales invoices with multiple items
- Record payments (cash/bank)
- Track delivery status
- Apply discounts

### 📦 Inventory Management
- Track stock levels across multiple inventories
- Receive procurement orders
- Deliver sales invoices
- Real-time stock updates

### 💰 Accounting
- Opening balance (كاش، بنك، فوري)
- Expense tracking
- Balance sheet
- Audit logs

### 🔐 Security
- JWT-based authentication
- Role-based access control
- Secure cookie management
- Protected routes

## Project Structure

```
apps/web/
├── app/
│   ├── dashboard/
│   │   ├── accounting/       # Accounting pages
│   │   ├── audit/           # Audit logs
│   │   ├── customers/       # Customers & details
│   │   ├── inventories/     # Inventory management
│   │   ├── items/           # Items & pricing
│   │   ├── procurement/     # Procurement orders & details
│   │   ├── sales/           # Sales invoices & details
│   │   ├── suppliers/       # Suppliers & details
│   │   ├── layout.tsx       # Dashboard layout with nav
│   │   └── page.tsx         # Dashboard home
│   ├── login/
│   │   └── page.tsx         # Login page
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # Reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── Table.tsx
├── lib/
│   ├── api.ts              # API client functions
│   ├── utils.ts            # Utility functions
│   └── userContext.tsx     # User context provider
├── .env.local              # Environment variables
├── next.config.js
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## API Integration

All API calls are handled through `lib/api.ts`. The API client:
- Automatically includes credentials (cookies)
- Handles authentication tokens
- Manages error responses
- Supports query parameters

Example:
```typescript
import { api } from '@/lib/api';

// Get data
const items = await api.getItems();
const customer = await api.getCustomer(id);

// Create data
await api.createCustomer(data);

// Update data
await api.updateItemPrices(id, prices);
```

## Styling

Uses Tailwind CSS for styling with:
- RTL (Right-to-Left) support for Arabic
- Responsive design
- Color-coded status badges
- Clean, modern UI

### Key Color Schemes
- **Blue** - Primary actions, total sales
- **Green** - Success, paid amounts, completed
- **Red** - Danger, unpaid amounts, credit
- **Yellow** - Warning, partial status
- **Orange** - Pending, not delivered

## Troubleshooting

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend API is running
- Check CORS settings in backend

### Authentication Issues
- Clear browser cookies
- Check JWT_SECRET matches between frontend/backend
- Verify token expiration

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall
- Check TypeScript errors: `npm run lint`

## Development Tips

### Hot Reload
Next.js has built-in hot reload. Changes to files will automatically update the browser.

### Environment Variables
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Restart dev server after changing `.env.local`

### User Context
Use the `useUser()` hook to access current user:
```typescript
import { useUser } from '@/lib/userContext';

function MyComponent() {
  const { user } = useUser();
  
  if (user?.role === 'ACCOUNTANT') {
    // Show accountant-specific UI
  }
}
```

## Contributing

When making changes:
1. Follow the existing component structure
2. Use TypeScript for type safety
3. Maintain RTL compatibility
4. Test across different user roles
5. Update this README if adding new features

## Production Deployment

### Build Optimization
```bash
npm run build
```

This creates an optimized production build in `.next/`

### Environment Variables for Production
Update `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Hosting Options
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Docker** (see root Dockerfile)
- **Node.js server** with `npm start`

## License

Private - All rights reserved

