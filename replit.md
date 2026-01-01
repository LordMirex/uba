# Receipt Generator - UBA & OPay

## Overview

A web-based high-fidelity receipt generation system that produces pixel-perfect digital receipts for Nigerian banking and mobile operations. The system supports UBA Bank Transfer receipts and OPay Airtime receipts with both manual single-receipt generation and automated batch generation with ZIP download functionality.

Key capabilities:
- **UBA Transfer Receipts**: Generate bank transfer confirmation receipts with recipient details, amounts, and bank information
- **OPay Airtime Receipts**: Generate airtime purchase receipts with network-specific theming (MTN, Glo, Airtel)
- **Batch Generation**: Automatically generate multiple receipts with randomized Nigerian data and download as ZIP
- **Canvas-Based Rendering**: Uses HTML5 Canvas API with 2x DPI scaling for crisp, device-independent output

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side navigation
- **State Management**: TanStack React Query for server state, React Hook Form for form state
- **Validation**: Zod schemas for strict input validation with @hookform/resolvers integration
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming

### Canvas Rendering System
The core receipt generation uses HTML5 Canvas API for pixel-perfect control:
- **DPI Scaling**: Canvas initialized at 2x display size with context scaling for sharp rendering on high-resolution screens
- **Asset Preloading**: Network logos loaded in useEffect hooks before user interaction
- **Circular Clipping**: Logo placement uses ctx.save/arc/clip/drawImage/restore pattern
- **Typography**: Precise font strings matching native app appearances

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Build Tool**: Vite for frontend, esbuild for production server bundle
- **Development**: Hot module replacement with Vite dev server proxying

### Data Layer
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` contains table definitions
- **Current Storage**: In-memory storage implementation in `server/storage.ts` (ready for database migration)

### Build & Deployment
- **Development**: `npm run dev` runs Vite dev server with HMR
- **Production Build**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.js`
- **Deployment Ready**: Vercel configuration included with SPA rewrites

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **@neondatabase/serverless**: Neon serverless PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store for Express

### Third-Party Services
- **JSZip**: Client-side ZIP file generation for batch receipt downloads
- **Google Fonts**: Inter font family loaded via CDN

### UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, popover, select, tabs, etc.)
- **Lucide React**: Icon library
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Date picker component
- **vaul**: Drawer component
- **recharts**: Charting library

### Development Tools
- **Drizzle Kit**: Database migration and schema push tooling
- **@replit/vite-plugin-***: Replit-specific development plugins (error overlay, cartographer, dev banner)