# Security Specification (`security_spec.md`) — Aditya Online Center

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Every unmatched path is denied (`allow read, write: if false;`).
2. **Verified Identity & Admin Isolation**:
   - Standard user/order writes require a signed-in user with `request.auth.token.email_verified == true`.
   - Admin status (`isAdmin()`) requires `isSignedIn()`, `request.auth.token.email_verified == true`, and either existence of `/databases/$(database)/documents/admins/$(request.auth.uid)` or the bootstrapped owner email `adityakty77@gmail.com`.
   - Customers can NEVER write to `/admins/{adminId}`, `/services/{serviceId}`, or `/settings/{settingId}`.
3. **PII Isolation (`/users/{userId}`)**:
   - Contains customer PII (`email`, `phone`, `villageOrTown`).
   - Read (`get`, `list`) and write (`create`, `update`) are strictly restricted to `isOwner(userId) || isAdmin()`. Blanket `isSignedIn()` reads are forbidden.
4. **Order Isolation & Terminal State Locking (`/orders/{orderId}`)**:
   - Customers can only `get` or `list` orders where `resource.data.customerId == request.auth.uid`.
   - On `create`, `incoming().customerId == request.auth.uid`, `incoming().status == 'Submitted'`, `incoming().paymentStatus == 'Unpaid'`, `incoming().hasDeliverable == false`, and `incoming().createdAt == request.time`.
   - On customer `update`, terminal states (`Delivered`, `Cancelled`) cannot be mutated by customers, immutable fields (`orderNumber`, `customerId`, `serviceId`, `createdAt`) must remain unchanged, and customers may only perform specific allowed actions:
     - **Submit UPI Reference**: updates `['paymentUtr', 'paymentStatus', 'status', 'updatedAt']` setting `paymentStatus == 'Pending Verification'`.
     - **Provide Missing Information**: updates `['customerInfoReply', 'status', 'updatedAt']` when `existing().status == 'Needs Customer Information'`.
     - **Upload File Counter Sync**: updates `['uploadedFileCount', 'updatedAt']`.
     - **Customer Cancellation**: updates `['status', 'updatedAt']` to `'Cancelled'` only when `existing().status in ['Submitted', 'Under Review', 'Awaiting Payment']`.
   - Verified Admins (`isAdmin()`) can update order status, price, payment verification status, admin notes, and deliverables as long as `isValidServiceOrder(incoming())` holds and immutable fields (`customerId`, `orderNumber`, `createdAt`) are preserved.
5. **Relational Master Gate for Subcollections (`/orders/{orderId}/files/{fileId}` & `/orders/{orderId}/history/{historyId}`)**:
   - Subcollection operations verify parent `/orders/$(orderId)` ownership (`get(...).data.customerId == request.auth.uid`) or `isAdmin()`.
   - Customers cannot upload `final_deliverable` files (`uploadedByRole == 'customer'` and `fileCategory in ['customer_document', 'payment_receipt']`). Only `isAdmin()` can upload `final_deliverable`.
   - File size (`sizeBytes <= 524288`) and allowed MIME types (`application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) are strictly enforced.
6. **Contact Messages Isolation (`/contact_messages/{messageId}`)**:
   - Public visitors and signed-in customers can `create` a contact inquiry document ONLY if it strictly satisfies `isValidContactMessage(incoming(), messageId)`, `incoming().status == 'New'`, and `incoming().createdAt == request.time`.
   - Read (`get`, `list`), `update`, and `delete` on `/contact_messages/{messageId}` are strictly restricted to authorized admins (`isAdmin()` / `isBootstrappedAdmin()`). Non-admin users and unauthenticated visitors can NEVER read or list submitted contact messages.

---

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on User Profile**: Authenticated user sends `isAdmin: true` inside `/users/{uid}`. Rejected by `data.keys().hasOnly(...)`.
2. **Self-Admin Escalation**: Customer writes a document to `/admins/{uid}`. Rejected because only bootstrapped admin can create `/admins/{uid}`.
3. **Unverified Admin Email Spoof**: Attacker signs in with unverified token claiming `adityakty77@gmail.com`. Rejected by `request.auth.token.email_verified == true`.
4. **Cross-Tenant PII Read**: Customer A requests `get(/users/customerB)`. Rejected by `isOwner(userId) || isAdmin()`.
5. **Blanket Order List Scraping**: Customer A executes an unconstrained `list` query on `/orders`. Rejected because `allow list` checks `resource.data.customerId == request.auth.uid || isBootstrappedAdmin()`.
6. **Pre-Verified Payment Spoof on Order Creation**: Customer creates an order with `paymentStatus: "Verified"` or `status: "Completed"`. Rejected by `create` invariant requiring `status == 'Submitted'` and `paymentStatus == 'Unpaid'`.
7. **Order Price Manipulation by Customer**: Customer updates `priceInr: 1` during payment submission. Rejected by action-based `affectedKeys().hasOnly(...)` and `incoming().priceInr == existing().priceInr`.
8. **Terminal State Resurrection**: Customer attempts to mutate an order after status is `'Delivered'` or `'Cancelled'`. Rejected by terminal state lock.
9. **Unauthorized Deliverable Upload by Customer**: Customer uploads a file with `fileCategory: 'final_deliverable'` or `uploadedByRole: 'admin'`. Rejected by role/category gate.
10. **Disallowed Executable Upload**: User attempts to create an `OrderFile` with `mimeType: 'application/x-msdownload'` or `sizeBytes: 9999999`. Rejected by `isValidOrderFile` enum and boundary limits.
11. **Timestamp Forgery**: Client provides a past/future `createdAt` or `updatedAt` timestamp instead of `request.time`. Rejected by `incoming().createdAt == request.time` / `incoming().updatedAt == request.time`.
12. **Unauthorized Contact Message Read / Spoof**: Unauthenticated or non-admin user attempts `get` or `list` on `/contact_messages`, or submits a contact message with `status: 'Replied'` or oversized payload. Rejected by admin-only read rules and `isValidContactMessage` schema enforcement.
