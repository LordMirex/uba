# Transfer Demo Application

## Overview

This is a single-page web application that demonstrates a money transfer receipt system. The application allows users to enter transfer details (recipient name, amount, bank name, and account number) through a form and generates a transfer receipt. Built with React, Express, and TypeScript, the application uses a modern tech stack with shadcn/ui components for the interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Client-side routing implemented with Wouter, a lightweight alternative to React Router. The application currently has two routes: the home page (`/`) and a 404 not-found page.

**UI Component Library**: shadcn/ui (New York style variant) provides a comprehensive set of accessible, customizable components built on Radix UI primitives. The UI system uses:
- Tailwind CSS for styling with custom CSS variables for theming
- CVA (Class Variance Authority) for component variant management
- Lucide React for icons
- Inter font family from Google Fonts

**State Management**: 
- React Hook Form with Zod validation for form state and validation
- TanStack Query (React Query) for server state management with custom query client configuration
- Local component state using React hooks

**Form Validation**: Zod schema validation integrated with React Hook Form through `@hookform/resolvers`. The transfer form validates:
- Recipient name (2-100 characters, alphabetic characters only)
- Amount (numeric, greater than 0, up to 2 decimal places)
- Bank name (required)
- Account number (6-20 digits)

**Data Storage**: Nigerian banks data is stored in a static TypeScript file (`client/src/data/nigerian-banks.ts`) containing bank names and codes.

### Backend Architecture

**Framework**: Express.js running on Node.js with TypeScript.

**Server Configuration**: The application supports two operational modes:
- Development mode (`server/index-dev.ts`): Integrates Vite middleware for hot module replacement and serves the client through Vite's development server
- Production mode (`server/index-prod.ts`): Serves pre-built static assets from the `dist/public` directory

**API Structure**: Routes are registered through a centralized routing system (`server/routes.ts`). Currently, the API infrastructure is set up but route implementations are minimal.

**Request Logging**: Custom middleware captures request method, path, status code, duration, and response data for API calls. Logs are formatted with timestamps and truncated for readability.

**Storage Layer**: An in-memory storage implementation (`server/storage.ts`) provides a simple interface for user data operations. The storage interface includes methods for getting users by ID or username and creating new users.

### Database and ORM

**ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in `shared/schema.ts`.

**Database Provider**: Neon Database serverless PostgreSQL (via `@neondatabase/serverless` driver).

**Schema Management**: 
- Database migrations stored in the `./migrations` directory
- Schema includes a users table with UUID primary keys, username, and password fields
- Zod schemas generated from Drizzle schemas for runtime validation

**Database Connection**: Connection configured through the `DATABASE_URL` environment variable, which is required to be set.

### Project Structure

**Monorepo Organization**: The codebase is organized into three main directories:
- `client/`: Frontend React application with source code, HTML template, and build output
- `server/`: Backend Express application with development and production entry points
- `shared/`: Code shared between client and server (currently database schema and types)

**Path Aliases**: TypeScript path mapping configured for cleaner imports:
- `@/*`: Maps to `client/src/*`
- `@shared/*`: Maps to `shared/*`
- `@assets/*`: Maps to `attached_assets/*`

### Build and Development

**Build Process**:
- Client: Vite builds to `dist/public` with tree-shaking and optimization
- Server: esbuild bundles server code to `dist/index.js` as an ESM module with external packages

**Development Tooling**:
- Replit-specific plugins for error overlay, cartographer, and development banner
- TypeScript incremental compilation with build info caching
- PostCSS with Tailwind CSS and Autoprefixer

**Environment Separation**: Development and production environments use different entry points and serving strategies, with NODE_ENV controlling the application mode.

## External Dependencies

### Database and Backend Services

- **Neon Database**: Serverless PostgreSQL database provider
- **Drizzle ORM**: TypeScript ORM for database access and migrations
- **connect-pg-simple**: PostgreSQL session store for Express (configured but not actively used in current implementation)

### UI and Component Libraries

- **Radix UI**: Comprehensive collection of unstyled, accessible UI primitives (accordion, dialog, dropdown, popover, select, tabs, toast, tooltip, and 20+ other components)
- **shadcn/ui**: Pre-built component implementations using Radix UI and Tailwind CSS
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide Icons**: Icon library for consistent iconography
- **cmdk**: Command menu component (Command+K style interface)

### Form and Validation

- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration layer between React Hook Form and validation libraries

### State Management and Data Fetching

- **TanStack Query**: Powerful asynchronous state management for data fetching, caching, and synchronization
- **Wouter**: Minimalist routing library (~1.5KB)

### Development and Build Tools

- **Vite**: Fast build tool and development server with HMR
- **esbuild**: Extremely fast JavaScript bundler for production server builds
- **TypeScript**: Static type checking and compilation
- **tsx**: TypeScript execution engine for development server
- **Replit Plugins**: Development experience enhancements for Replit environment

### Utility Libraries

- **date-fns**: Modern JavaScript date utility library
- **nanoid**: Compact, secure, URL-friendly unique string ID generator
- **clsx** and **tailwind-merge**: Utility functions for conditional className management
- **class-variance-authority**: Type-safe component variant management