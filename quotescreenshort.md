# Alpha Steel Frames — Quotation Reference Specification (`quotescreenshort.md`)

This document synthesizes the complete visual and functional analysis of all 19 reference screenshots located in `Screenshort/quotes/`. It establishes the authoritative specifications for the Alpha Steel Frames Quotation & Accounting Application.

---

## 1. Screenshots Reviewed & Locations

| Screenshot File | Screen / Dialog / State | Key Visual & Functional Elements Identified |
|---|---|---|
| `Screenshort/quotes/image.png` | **Quotes List View** | Header breadcrumb (`Sales overview > Quotes`), status tabs with badge counters (`All`, `Draft`, `Sent`, `Declined`, `Accepted`, `Invoiced`), green primary action button `+ New quote` with menu split, omni-search input bar ("Enter a contact, amount, reference or quote number"), filter toggle button, item count indicator, full table columns (`Number`, `Reference`, `Customer`, `Issue date`, `Expiration date`, `Status`, `Amount`), pagination footer ("Showing items 1–N of N"). |
| `Screenshort/quotes/image copy.png` | **New Quote Creation View** | Top actions (`Save` dropdown, `Send` dropdown, 3-dots menu), customer selector (`Contact`), date pickers (`Issue date` with calendar icon, `Expiration date` with calendar icon), quote sequence identifier (`Quote number` e.g., `# QU-0007`), expandable title & summary (`+ Add a title & summary`), reference field (`Reference`), currency selector (`Currency`, default "Australian Dollar"), project allocation (`Project: Assign to project`), tax treatment selector (`Tax: Tax exclusive`), line items table with column visibility picker (`Columns (0 hidden)`), item row fields (`Item`, `Description`, `Qty.`, `Price`, `Disc. %`, `Account`, `Tax rate`, `Purchase order`, `Payments`, `Amount`, delete row trashcan), drag handle icon for line reordering, `+ Add row` button, bottom Terms & Conditions textarea, `Files` attachment popover trigger, live calculation summary (`Subtotal`, `Total GST 10.00%`, `Total`). |
| `Screenshort/quotes/image copy 2.png` | **Account Picker Dropdown & Tax Calculation** | Line item account code/name selector (e.g., `101 - Suppliers`, `200 - Sales`, `611 - Cash on Hand`, `620 - Prepayments`, `710 - Office Equipment`, `725 - Project work in progress`, `726 - Motor Vehicle`). Live calculation card demonstrating 10% GST on expenses/income: Subtotal: \$100.00, Total GST 10.00%: \$10.00, Total: \$110.00. |
| `Screenshort/quotes/image copy 3.png` | **Title & Summary Expanded State** | Shows the expanded state below Contact: `Title` input field (single-line string) and `Summary` input field (multi-line textarea), accompanied by `✕ Remove title & summary` toggle. |
| `Screenshort/quotes/image copy 4.png` | **Quote Creation Actions Menu (3-dots)** | Top right overflow actions: `Print PDF`, `Copy to` (copy to quote/invoice/bill), and `Invoice settings` (organization defaults). |
| `Screenshort/quotes/image copy 5.png` | **Send Split-Button Dropdown** | Actions: `Send` (opens send email modal / client portal dispatch) and `Mark as sent` (immediate status transition to `SENT` without emailing). |
| `Screenshort/quotes/image copy 6.png` | **Save Split-Button Dropdown** | Actions: `Save & close` (persists draft/updates and returns to Quotes list) and `Save & add another` (persists and opens a fresh quote form). |
| `Screenshort/quotes/image copy 7.png` | **Tax Treatment Dropdown** | Tax calculation mode selector: `Tax exclusive` (default: line prices are net of tax; 10% GST added on top), `Tax inclusive` (line prices contain tax; 10% GST backed out), `No tax` (no tax applied; tax total is 0.00). |
| `Screenshort/quotes/image copy 8.png` | **Currency Selector Dropdown** | Currency selector displaying `AUD Australian Dollar` with `+ Add currency` option. |
| `Screenshort/quotes/image copy 9.png` | **Files Attachment Popover** | Popover on `Files` button: Drag-and-drop file upload target area, manual "Upload files" button, validation alert: "Add a contact and save before attaching a file". |
| `Screenshort/quotes/image copy 10.png` | **Quote Detail / View Screen** | Read-only presentation of an active quote (`QU-0006`, Status: `Sent` badge). Actions: `Print PDF`, `Mark as accepted`, 3-dots overflow menu. Header metadata grid: Customer link, Issue date, Expiration date, Quote number, Reference, Currency, Branding theme. Line items table with explicit "Amounts are tax exclusive" badge, line breakdowns, subtotal, 10% GST, total. Collapsible `History and notes` bottom section with `Add note` button. |
| `Screenshort/quotes/image copy 11.png` | **Quote View Overflow Menu (3-dots)** | Complete lifecycle actions: `Send`, `Mark as declined`, `Revise` (creates new revision preserving version history), `Copy to` (Invoice, Purchase Order, Quote), `Get link` (client portal public URL), `Update project`, `Delete` (void/delete draft), `Invoice settings`. |
| `Screenshort/quotes/image copy 12.png` | **History & Notes Timeline** | Expanded audit and activity ledger table: `Date (Time zone AEST)` sorted descending, `User` (e.g., `System Generated`, user name), `Action` (`Quote viewed`, `Sent`, `Created`, `Note Added`, `Accepted`, `Declined`), `Detail` (descriptive log entry including timestamp, recipient email, amounts, or internal user notes), and `Add note` interactive modal. |
| `Screenshort/quotes/image copy 13.png` | **Contact Detail & Activity Hub** | Detailed contact view (`Kuljit Singh Birk`). Header avatar badge (`KSB`), contact details (email, phone, address: `3 Loran place, Taigum, Queensland, 4018`), `Invoice reminders: On`. Tabs: `Activity`, `Contact details`, `Financial details`, `Documents`. Financial metrics: `Invoices owed to you` (\$11,650.00), `Quotes awaiting reply` (1), `They pay in` (11 days). Cash-in 12-month graph/table toggle. Activity documents table filtering All/Invoices/Quotes with direct link to Quote `QU-0006`. |
| `Screenshort/quotes/image copy 14.png` | **System Settings — General & Sales** | Settings navigation: Organization details, Users & permissions, Subscription & billing, Connected apps, Email settings, Invoice settings (default quote expiry, numbering prefixes, branding themes, payment terms), Online payments. |
| `Screenshort/quotes/image copy 15.png` | **System Settings — Accounting & Reporting** | Financial settings, Currencies, Chart of accounts, Fixed assets, Tracking categories, Conversion balances. |
| `Screenshort/quotes/image copy 16.png` | **System Settings — Tax & Projects** | Manual tax rates (GST 10% standard, GST free 0%, Input taxed), Activity statement settings (BAS), Staff cost rates and permissions. |
| `Screenshort/quotes/image copy 17.png` | **Customers / Contacts List View** | Top filter tabs (`All`, `Customers`, `Suppliers`, `Archived`, `Groups`, `Smart lists`). Primary action `+ New contact`. Search bar, alphabetical sort, batch selection checkboxes, batch actions (`Add to group`, `Merge`, `Archive`). Rows displaying initial avatar, customer name, physical address, email, phone, `You owe` balance, `They owe` balance with overdue icon, and row action menu. |
| `Screenshort/quotes/image copy 18.png` | **Add Contact Form** | Structured contact entry layout with sidebar navigation (`Contact details`, `Addresses`, `Financial details`, `Sales defaults`, `Purchase defaults`). Fields: `Contact name` (required), `Account number`, `Primary person` (First name, Last name, Email), `Additional people` (+ Add another person), physical and postal addresses, default tax rates, and default payment terms. |

---

## 2. Required Quotation Screens and Layouts

### 2.1 Quotation List (`/quotes`)
- **Header**: Organization switcher (`Alpha Steel Frames`), Main navigation (Home, Quotes/Sales, Contacts, Settings).
- **Sub-header / Tabs**:
  - `All` (total count)
  - `Draft` (count of quotes in DRAFT)
  - `Sent` (count of quotes in SENT)
  - `Declined` (count of quotes in DECLINED)
  - `Accepted` (count of quotes in ACCEPTED)
  - `Invoiced` (count of quotes converted to invoice)
- **Top Actions**:
  - Search input with debounced server-side query across Quote Number, Reference, Customer Name, and Description.
  - Filter modal/popover (date range, customer, amount bounds, status).
  - Primary button: `+ New quote` (direct route to `/quotes/new`).
- **Table Columns**:
  - `Number`: Unique identifier (e.g. `QU-0001`), clickable link to view.
  - `Reference`: Job description, site address, or project code (e.g. `Lot 3345 Coopers st Greenbank`).
  - `Customer`: Contact name (bold) with optional address line underneath.
  - `Issue date`: Formatted date with descending/ascending sort toggle.
  - `Expiration date`: Expiration date; highlighted with warning icon if expired or expiring within 3 days.
  - `Status`: Distinct styled badges:
    - `Draft`: Neutral gray badge
    - `Sent`: Blue badge
    - `Accepted`: Green badge
    - `Declined`: Red badge
    - `Invoiced`: Purple badge
  - `Amount`: Autoritative total in AUD currency formatting (e.g., `$22,110.00`).
- **Pagination & Counter**:
  - Display "Showing items X–Y of Z".
  - Standard pagination controls (Previous, Page numbers, Next).

### 2.2 Quotation Editor (`/quotes/new` and `/quotes/[id]/edit`)
- **Top Bar**:
  - Breadcrumb: `Quotes > New quote` or `Quotes > QU-XXXX (Edit)`.
  - Actions:
    - `Save` split button: `Save` (default), `Save & close`, `Save & add another`.
    - `Send` split button: `Send` (dispatches to email & marks sent), `Mark as sent`.
    - `Cancel` / 3-dots overflow (`Print PDF`, `Quotation settings`).
- **Header Fields**:
  - `Contact`: Autocomplete dropdown querying real database contacts; ability to quick-add new customer inline.
  - `Issue date`: Defaults to today (`YYYY-MM-DD`), date picker.
  - `Expiration date`: Defaults to issue date + 30 days (or configured default terms), date picker.
  - `Quote number`: Read-only or editable sequential identifier (e.g., `QU-0007`).
  - `+ Add a title & summary` toggle:
    - `Title`: Project/Scope title (e.g., "Steel Framing Supply & Installation").
    - `Summary`: Project overview / scope notes.
  - `Reference`: Customer PO, job number, site address.
  - `Currency`: Default `AUD Australian Dollar` (read-only or selectable).
  - `Tax`: Dropdown with `Tax exclusive`, `Tax inclusive`, `No tax`.
- **Line Items Grid**:
  - Columns: Drag handle, `Item` (predefined catalog selector e.g. Steel Studs, Track, Trusses, Labor), `Description` (detailed scope item), `Qty.` (decimal allowed), `Price` (unit rate), `Disc. %` (0 to 100%), `Account` (e.g., 200 - Sales), `Tax rate` (e.g., 10% GST on Income), `Amount` (calculated net line total).
  - Row Actions: Delete trash can, duplicate row.
  - `+ Add row`: Appends a fresh row at the bottom.
- **Footer Section**:
  - Left: `Terms` textarea (defaults to organization payment and quotation terms), `Files` attachment button.
  - Right: Authoritative live calculation card:
    - `Subtotal`: Sum of all net line amounts.
    - `Total GST 10.00%` (or applicable tax): Accurate tax sum.
    - `Total`: Subtotal + TaxTotal (bold, large font).

### 2.3 Quotation View & Client Presentation (`/quotes/[id]`)
- **Header Actions**:
  - `Edit` (if Draft or Sent)
  - `Print PDF` (generates high-resolution Alpha Steel Frames branded quotation PDF)
  - `Mark as accepted`
  - 3-dots Menu: `Send`, `Mark as declined`, `Revise`, `Copy to Invoice`, `Get client link`, `Delete`.
- **Metadata Cards**:
  - Customer details (name, email, phone, billing address).
  - Dates, Quote number, Reference, Tax treatment badge.
- **Items Breakdown Table**:
  - Clean printable table showing all items, descriptions, quantities, rates, discounts, and amounts.
  - Financial reconciliation card with Subtotal, GST, and Total.
- **Collapsible Audit & Notes Timeline**:
  - `History and notes` table tracking all changes: timestamp (AEST), user, action, detail.
  - `Add note` button to append team discussion notes without modifying financial values.

---

## 3. Financial Calculation and Rounding Rules

### 3.1 Line Item Arithmetic
For each line $i$:
1. **Undiscounted Gross**: $\text{Gross}_i = \text{Quantity}_i \times \text{UnitPrice}_i$
2. **Line Discount**: $\text{DiscountAmount}_i = \text{Gross}_i \times \left(\frac{\text{DiscountPercent}_i}{100}\right)$
3. **Net Discounted Base**: $\text{NetBase}_i = \text{Gross}_i - \text{DiscountAmount}_i$

### 3.2 Tax Treatment Rules (Australian GST = 10%)
- **Tax Exclusive (Standard / Default)**:
  - $\text{LineAmount}_i = \text{round}_2(\text{NetBase}_i)$
  - $\text{LineTax}_i = \text{round}_2\left(\text{LineAmount}_i \times \frac{\text{TaxRate}_i}{100}\right)$
  - $\text{Subtotal} = \sum \text{LineAmount}_i$
  - $\text{TaxTotal} = \sum \text{LineTax}_i$
  - $\text{TotalAmount} = \text{Subtotal} + \text{TaxTotal}$
- **Tax Inclusive**:
  - The entered price already includes 10% GST.
  - $\text{GrossLine}_i = \text{round}_2(\text{NetBase}_i)$
  - $\text{LineTax}_i = \text{round}_2\left(\text{GrossLine}_i \times \frac{\text{TaxRate}_i}{100 + \text{TaxRate}_i}\right)$
  - $\text{LineAmount}_i = \text{GrossLine}_i - \text{LineTax}_i$
  - $\text{Subtotal} = \sum \text{LineAmount}_i$
  - $\text{TaxTotal} = \sum \text{LineTax}_i$
  - $\text{TotalAmount} = \text{Subtotal} + \text{TaxTotal} = \sum \text{GrossLine}_i$
- **No Tax**:
  - $\text{LineAmount}_i = \text{round}_2(\text{NetBase}_i)$
  - $\text{LineTax}_i = 0$
  - $\text{TaxTotal} = 0$
  - $\text{TotalAmount} = \text{Subtotal}$

### 3.3 Precision & Reconciliation
- To prevent floating-point drift (e.g., `0.1 + 0.2 = 0.30000000000000004`), calculations must execute with exact cents integer arithmetic or rounded decimal arithmetic.
- Server validation recalculates and asserts exact mathematical reconciliation before saving to the database.

---

## 4. Quotation Revision Workflow

1. When a quote is in `SENT`, `ACCEPTED`, or `DECLINED` status and the scope or pricing changes, clicking **Revise**:
2. Sets the current quote status to superseded or increments the revision sequence (e.g. `QU-0006-R1` or creates revision history).
3. Clones the line items, customer details, and terms into a new active draft version.
4. Preserves the full previous quotation record in the database for auditing and compliance.
5. Logs a revision entry in the History timeline referencing the parent quote.

---

## 5. Responsive Behavior & Validation

- **Desktop (>= 1024px)**: Full multi-column data table with inline editing, visible dropdowns, split action buttons, side-by-side totals.
- **Tablet (768px – 1023px)**: Responsive horizontal scroll for table with sticky Action and Amount columns; touch-friendly 44px tap targets.
- **Mobile (< 768px)**: Stacked card-based layout for line items or fluid compact table; bottom sticky action bar for Save/Send; collapsible metadata sections.
- **Validation**:
  - Contact must exist and be valid.
  - Expiration date must not precede Issue date.
  - Must contain at least one line item with Quantity > 0 and UnitPrice >= 0.
  - Line discounts must be between 0.00% and 100.00%.

---

## 6. Branding & Alpha Steel Frames Identity

- **Company Name**: Alpha Steel Frames
- **Website**: https://alphasteelframes.com.au/
- **Logo**: Alpha Steel Frames geometric 'α' icon with bold typography (located at `/public/logo.png`).
- **Brand Colors**:
  - Primary Dark / Navy: `#001e4d`
  - Alpha Steel Blue Accent: `#0084c7` / `#006fe6`
  - Background Neutral: `#f4f5f7`
  - Card & Surface: `#ffffff`
  - Status Accents: Sent (`#006fe6`), Accepted (`#10b981`), Declined (`#ef4444`), Invoiced (`#8b5cf6`).
- **Prohibited**:
  - No Xero branding, links, logos, or references anywhere in UI, code, or docs.
  - No dummy AI assistants (JAX removed completely).
