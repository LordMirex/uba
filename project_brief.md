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

## 3. Technical Architecture & Core Logic
### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Routing**: `wouter` for lightweight client-side navigation.
- **Form Management**: `react-hook-form` with `zod` for strict input validation.

### Canvas Rendering Logic (The "Heart" of the System)
The system uses the HTML5 Canvas API to manually "paint" receipts pixel-by-pixel. This ensures absolute control over layout that CSS cannot guarantee across different devices.

**Key Logic Steps:**
1. **DPI Scaling**: To avoid "blurry" receipts on high-resolution screens, the canvas is initialized at 2x the display size (`width * 2`), and then the context is scaled down (`ctx.scale(2, 2)`). This ensures 300DPI-equivalent sharpness.
2. **Background Layering**:
   - Background color: `#f2f3f7`.
   - Card segments: Rounded rectangles (`ctx.roundRect`) with precise shadow properties (`shadowBlur: 8`, `shadowOffsetY: 1`).
3. **Asset Handling (Logo Logic)**:
   - **Preloading**: Images are initialized in a `useEffect` hook to ensure they are in the browser cache before the user clicks "Generate".
   - **Circular Clipping**: To place logos perfectly, the system uses `ctx.save()`, draws a `ctx.arc`, calls `ctx.clip()`, then `ctx.drawImage()`, and finally `ctx.restore()`. This creates a perfect circular mask for any network logo.
4. **Dynamic Text Rendering**:
   - **Alignment**: Mix of `textAlign = 'center'` for headers and `textAlign = 'left' / 'right'` for key-value pairs in the transaction details.
   - **Font Precision**: Uses specific font strings like `400 14.5px sans-serif` to match the native OPay app typography.
   - **Price Formatting**: Logic to convert strings to localized currency (e.g., `NGN 100.00`) using `toLocaleString`.

### Backend & Storage
- **Server**: Express.js with TypeScript.
- **Persistence**: PostgreSQL with Drizzle ORM.
- **Schema**: Centralized `shared/schema.ts` defining user and transaction tables, allowing for future "History" features.

## 4. Design Standards & Spacing Logic
- **Vertical Rhythm**: OPay details use a fixed `lineHeight` of 32px to ensure items like "Transaction No." and "Order No." align perfectly with the mobile app's spacing.
- **Margins**: Consistent 15px horizontal padding (`cardMargin`) for all content blocks.

## 5. Potential Improvement Areas (Brainstorming)
- **Automatic Batch Mode**: Implement a system to generate N receipts in bulk, bundle them into a ZIP, and provide a progress indicator.
- **Extended Bank Support**: Focus on Top 10 banks including OPay and PalmPay, plus Access, UBA, Zenith, GTBank, First Bank, Fidelity, FCMB, and Stanbic IBTC.
- **Data Generation Engine**: Implement realistic NUBAN (10-digit check-digit) and Nigerian phone number generation using NCC prefixes.
- **PDF Export**: Direct download of high-res PDF versions.
- **Transaction History**: Dashboard to view, edit, and re-generate past receipts.
- **Custom Branding**: Option to add custom logos or text for business-specific receipts.
