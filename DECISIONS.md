# Decisions

## 1. Tenant and role flow

Login accepts `tenantSlug`, `email`, and `password`. Missing or unknown tenants are treated as `401 Invalid credentials`, the same as a bad password, so the API does not reveal which tenant slugs exist. The JWT contains `sub`, `tenantId`, `role`, and `email`. Protected controllers read that identity through `JwtAuthGuard` and `CurrentUser`, and database queries use `tenantId` as the first security filter. Role checks are enforced with `RolesGuard`, not with frontend hiding.

## 2. Product search and indexes

Product search is `GET /api/products?search=&page=&limit=` and always filters by current tenant and active products. It returns only `_id`, `name`, `sku`, `price`, and `stock`; `costPrice` is `select:false` and not selected. The product indexes are `{ tenantId: 1, sku: 1 }` unique and `{ tenantId: 1, isActive: 1, name: 1 }`. `tenantId` comes first because all SaaS reads are tenant-scoped, `isActive` follows because catalog reads only active products, and `name` supports the search/sort path.

## 3. Cart trust boundary

The client cart is trusted only for `productId` and `quantity`. The server re-reads product ownership, active state, price, cost, stock, name, and sku from MongoDB. The client cannot send price, cost, line totals, or order totals. This prevents a cashier or modified browser request from creating discounted or fake-price orders.

## 4. No-oversell guarantee

Order creation uses a MongoDB transaction and conditional stock updates. Each product decrement matches `{ _id, tenantId, stock: { $gte: quantity } }` and applies `{ $inc: { stock: -quantity } }`. If two cashiers buy the last unit concurrently, only one update can match; the other gets an insufficient-stock conflict. The transaction makes stock changes and order creation commit or roll back together. This guarantee requires MongoDB replica set mode; without it, MongoDB does not support transactions.

## 5. Margin boundary

Cashier endpoints never return `costPrice`, `unitCost`, or margin. Product `costPrice` and order item `unitCost` are hidden at schema/query level and responses are explicitly mapped to safe fields. Admin margin exists only in `GET /api/reports/sales`, which is protected by `JwtAuthGuard`, `RolesGuard`, and `@Roles(Role.ADMIN)`.

## 6. Webhook idempotency

The payment webhook verifies `x-payment-signature` using HMAC SHA-256 with `PAYMENT_WEBHOOK_SECRET` and Node's built-in `crypto`. Each event is stored by unique `eventId`, so duplicate deliveries return a duplicate response without reapplying state changes. The webhook updates only an order matching both `orderId` and `tenantId`, and only moves `pending_payment` to `paid`. Unknown order or wrong tenant is rejected.

## 7. Missing tenant decision

A missing or unknown tenant is an authentication failure. The API returns the same generic `401 Invalid credentials` response as a wrong email or password, because exposing tenant existence would help enumeration.

## 8. Tradeoffs

I prioritized the coherent backend truth path first: tenant-safe login, product search, server-priced order creation, no-oversell stock updates, signed idempotent payment confirmation, paid-only receipt, and admin-only margin report. The report cache is in-memory with webhook invalidation, which is enough for this test and simple to explain; in production or multi-instance deployment I would push for Redis or another shared cache. I would also push back on a PM asking for real payment behavior without a clear event contract, because webhook ordering, tenant identity, retries, and signature payload format need to be specified before launch.
