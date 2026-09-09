# Firestore Security Specification - Giezra Farms Limited

## System Context
Giezra Farms Limited poultry ERP system operating on Cloud Firestore with Role-Based Access Control (RBAC):
- Roles: `CEO`, `ASSISTANT_CEO`, `OPERATIONS_MANAGER`, `SALES_MANAGER`, `STOCKING_MANAGER`, `DEVELOPER`
- Root Admin Email: `giezrafarmslimited@gmail.com`
- Documents & Collections:
  - `/users/{userId}`
  - `/customers/{customerId}`
  - `/products/{productId}`
  - `/stock_movements/{movementId}`
  - `/orders/{orderId}`
  - `/orders/{orderId}/items/{itemId}`
  - `/payments/{paymentId}`
  - `/expenses/{expenseId}`
  - `/invoices/{invoiceId}`
  - `/quotations/{quotationId}`
  - `/documents/{documentId}`
  - `/activity_logs/{logId}`
  - `/settings/{settingId}`
  - `/backups/{backupId}`

## Core Data Invariants
1. **Identity Integrity**: Users can never escalate their own `role` or `status` during self-registration or profile update. Role assignments are strictly managed by `CEO` or `DEVELOPER` (or bootstrapped admin `giezrafarmslimited@gmail.com`).
2. **Audit Immutability**: `stock_movements` and `activity_logs` documents are append-only. Once written, they can never be modified or deleted.
3. **Financial Consistency**: Payment creations must reference a valid `customerId` and specify a positive non-zero `amount`. Order line items cannot have negative quantity or price.
4. **Tenant Isolation**: Only authenticated staff with valid permissions can access business data. Unauthenticated or public reads/writes are denied by default across all documents.
5. **PII and Salary Isolation**: User documents containing personal phones and emergency contacts can only be read by authenticated active staff, and private updates are restricted to the user themselves or CEO/Admin.

## The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Self-Escalation to CEO**: Unprivileged user creates/updates their `/users/{uid}` document with `role: "CEO"` or `status: "ACTIVE"`.
2. **Unauthenticated Public Read**: Anonymous or unauthenticated actor attempts to query `/customers` or `/financials`.
3. **Negative Stock Movement**: Malicious client submits a stock movement with `quantity: -5000` to artificially reduce stock without approval.
4. **Orphaned Order Item Write**: Write to `/orders/{orderId}/items/{itemId}` where parent order does not exist or orderId is invalid.
5. **Tampering with Stock Movement History**: Attempt to call `update` or `delete` on an existing `/stock_movements/{movementId}` document.
6. **Altering Verified Payment Amount**: Attempt to update the `amount` of a confirmed `/payments/{paymentId}` record after receipt generation.
7. **Junk ID Resource Exhaustion**: Document ID exceeding 128 characters or containing non-whitelisted characters (e.g. SQL/XSS injections).
8. **Shadow Field Injection**: Attempt to create a customer document containing undeclared admin override keys like `isSystemAdmin: true`.
9. **Fake Payment Method**: Record with payment method `BITCOIN_EXCHANGE` outside the validated enum set `['CASH', 'BANK', 'MOBILE_MONEY', 'OTHER']`.
10. **Tampering with Activity Log**: Attempt to delete or overwrite an audit log entry in `/activity_logs/{logId}`.
11. **Negative Price on Product**: Attempt to set `selling_price: -100` on `/products/{productId}`.
12. **Tampering with System Settings**: Non-admin/Sales user attempting to alter company bank account number in `/settings/company`.
