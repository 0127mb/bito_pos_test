# BITO POS Test Task

End-to-end multi-tenant POS workflow:

```text
cashier login -> product search -> cart -> order -> signed payment webhook -> receipt
admin login -> sales report with margin
```

## Run With Docker

From this folder:

```bash
docker compose up --build
```

Open:

```text
Frontend: http://localhost:5173
Backend Swagger: http://localhost:3002/api/docs
```

Seeded demo credentials:

```text
Tenant: demo-store
Cashier: cashier@demo.com / password123
Admin: admin@demo.com / password123
```

## Local Backend

```bash
cd backend/test_backend
pnpm install
pnpm run start:dev
```

Seed demo data:

```bash
node scripts/seed-demo.js
```

Simulate payment provider callback:

```bash
node scripts/pay-order.js <tenantId> <orderId>
```

## Local Frontend

```bash
cd fronted
pnpm install
pnpm dev
```

## Review Flow

1. Login as cashier.
2. Search products.
3. Add items to cart.
4. Place order.
5. Run the provider webhook command shown in the UI.
6. Refresh receipt.
7. Switch to admin and load sales report.
8. Switch back to cashier and confirm report returns `403`.

## Notes

NestJS uses the default Express adapter, so the backend is Node.js + Express under Nest.

MongoDB runs as a single-node replica set because order creation uses transactions for all-or-nothing stock decrement plus order creation.

The Compose file exposes MongoDB on host port `27020` and the backend connects through `host.docker.internal:27020`. This keeps the demo working on this machine where older containers already occupy `27017`, while Mongo still runs as a replica set for transaction support.
