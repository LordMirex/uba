# Transfer & Airtime Receipt Generator System Brief

## 1. Project Overview
A web-based high-fidelity receipt generation system designed to produce pixel-perfect digital receipts for banking and mobile operations. The current focus is on UBA Bank Transfers and OPay Airtime Purchases.

## 2. Current Capabilities
### UBA Transfer Receipt
- **Input**: Recipient Name, Amount, Bank Name, Account Number.
- **Output**: 390x360px Canvas-based receipt.
- **Features**: 
  - High-DPI scaling (2x) for sharp text/graphics.
  - Success screen UI with checkmark branding.
  - Automatic amount formatting (NGN).

### OPay Airtime Receipt
- **Input**: Network (MTN, Glo, Airtel), Phone Number, Amount, Date, Time.
- **Output**: 390x580px Canvas-based receipt.
- **Design Elements**:
  - **Dynamic Logo Placement**: Uses official cropped circular network logos.
  - **Network-Specific Theming**: Background colors (MTN: #ffcc00, Glo: #4caf50, Airtel: #e60000).
  - **Authentic Layout**: Matching original reference images for spacing, typography, and transaction details.
  - **Performance**: Preloaded images for instant generation.

## 3. Technical Architecture
- **Frontend**: React 18 with TypeScript & Vite.
- **UI System**: Tailwind CSS, shadcn/ui components (Radix UI).
- **Canvas Rendering**: Manual drawing using HTML5 Canvas API for pixel-perfect precision.
- **State Management**: React Hook Form for validated inputs.
- **Storage**: PostgreSQL with Drizzle ORM (backend ready for historical tracking).

## 4. Design Standards
- **Typography**: Precision font sizing and weights (e.g., 14.5px sans-serif for OPay details).
- **Dimensions**: Standard mobile viewport width (390px).
- **Assets**: High-quality cropped circular logos for MTN, Glo, and Airtel.

## 5. Potential Improvement Areas (Brainstorming)
- **Multi-Bank Support**: Expand to Zenith, GTBank, Access, etc.
- **PDF Export**: Direct download of high-res PDF versions.
- **Transaction History**: Dashboard to view, edit, and re-generate past receipts.
- **Batch Generation**: Ability to upload CSV/Excel for mass receipt production.
- **User Accounts**: Secure login to save preferences and branding settings.
- **Custom Branding**: Option to add custom logos or text for business-specific receipts.
- **Mobile App**: PWA (Progressive Web App) support for offline generation.
