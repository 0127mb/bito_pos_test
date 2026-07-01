import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002/api';

type Role = 'admin' | 'cashier';

type AuthUser = {
  id: string;
  tenantId: string;
  role: Role;
  email: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type CartItem = Product & {
  quantity: number;
};

type OrderResponse = {
  id: string;
  status: 'pending_payment' | 'paid';
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
};

type Receipt = OrderResponse & {
  paidAt?: string;
};

type SalesReport = {
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
    margin: number;
  }>;
  totalRevenue: number;
  totalMargin: number;
};

function money(value: number) {
  return new Intl.NumberFormat('uz-UZ').format(value);
}

async function api<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed: ${response.status}`);
  }

  return data as T;
}

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenantSlug, setTenantSlug] = useState('demo-store');
  const [email, setEmail] = useState('cashier@demo.com');
  const [password, setPassword] = useState('password123');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  async function login(nextEmail = email) {
    setLoading(true);
    setError('');
    setReport(null);
    setReceipt(null);
    setOrder(null);
    setCart([]);

    try {
      const response = await api<{ accessToken: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ tenantSlug, email: nextEmail, password }),
      });

      setToken(response.accessToken);
      setUser(response.user);
      setEmail(nextEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    if (!token) {
      return;
    }

    setError('');

    try {
      const params = new URLSearchParams({ search, page: '1', limit: '20' });
      const response = await api<{ items: Product[] }>(`/products?${params}`, { token });
      setProducts(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load products');
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [token]);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function checkout() {
    if (!token || cart.length === 0) {
      return;
    }

    setLoading(true);
    setError('');
    setReceipt(null);

    try {
      const response = await api<OrderResponse>('/orders', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      setOrder(response);
      setCart([]);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  async function loadReceipt() {
    if (!token || !order) {
      return;
    }

    setError('');

    try {
      const response = await api<Receipt>(`/orders/${order.id}/receipt`, { token });
      setReceipt(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Receipt is not paid yet');
    }
  }

  async function loadReport() {
    if (!token) {
      return;
    }

    setError('');

    try {
      const response = await api<SalesReport>('/reports/sales', { token });
      setReport(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report request failed');
      setReport(null);
    }
  }

  const paymentCommand =
    user && order
      ? `cd "/home/rembo/Desktop/Btio Test/backend/test_backend" && node scripts/pay-order.js ${user.tenantId} ${order.id}`
      : '';

  return (
    <main className="app">
      <section className="topbar">
        <div>
          <h1>BITO POS</h1>
          <p>Tenant-safe cashier checkout and admin margin report</p>
        </div>
        {user ? (
          <div className="session">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
            <button onClick={() => login(user.role === 'admin' ? 'cashier@demo.com' : 'admin@demo.com')}>
              Switch to {user.role === 'admin' ? 'Cashier' : 'Admin'}
            </button>
          </div>
        ) : null}
      </section>

      {error ? <div className="alert">{error}</div> : null}

      {!user ? (
        <section className="panel login">
          <h2>Login</h2>
          <label>
            Tenant
            <input value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>
          <button onClick={() => login()} disabled={loading}>
            Login
          </button>
          <div className="quick-logins">
            <button onClick={() => login('cashier@demo.com')}>Cashier Demo</button>
            <button onClick={() => login('admin@demo.com')}>Admin Demo</button>
          </div>
        </section>
      ) : null}

      {user ? (
        <div className="workspace">
          <section className="panel catalog">
            <div className="panel-head">
              <h2>Catalog</h2>
              <div className="search">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products"
                />
                <button onClick={loadProducts}>Search</button>
              </div>
            </div>
            <div className="product-list">
              {products.map((product) => (
                <article key={product.id} className="product-row">
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                  </div>
                  <div>
                    <strong>{money(product.price)}</strong>
                    <span>Stock {product.stock}</span>
                  </div>
                  <button onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                    Add
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="panel cart">
            <h2>Cart</h2>
            {cart.length === 0 ? <p className="muted">No items selected</p> : null}
            {cart.map((item) => (
              <div key={item.id} className="cart-row">
                <div>
                  <strong>{item.name}</strong>
                  <span>{money(item.price)} each</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) => changeQuantity(item.id, Number(event.target.value))}
                />
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div className="total">
              <span>Total</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <button onClick={checkout} disabled={loading || cart.length === 0}>
              Place Order
            </button>
          </section>

          {order ? (
            <section className="panel order">
              <h2>Order</h2>
              <p>
                <strong>{order.id}</strong>
              </p>
              <p>Status: {receipt?.status ?? order.status}</p>
              <p>Total: {money(order.total)}</p>
              <label>
                Provider webhook command
                <textarea readOnly value={paymentCommand} />
              </label>
              <button onClick={() => navigator.clipboard.writeText(paymentCommand)}>
                Copy Command
              </button>
              <button onClick={loadReceipt}>Refresh Receipt</button>
            </section>
          ) : null}

          {receipt ? (
            <section className="panel receipt">
              <h2>Receipt</h2>
              {receipt.items.map((item) => (
                <div key={item.productId} className="receipt-row">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <strong>{money(item.lineTotal)}</strong>
                </div>
              ))}
              <div className="total">
                <span>Grand total</span>
                <strong>{money(receipt.total)}</strong>
              </div>
              <p>Paid at: {receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '-'}</p>
            </section>
          ) : null}

          <section className="panel report">
            <div className="panel-head">
              <h2>Sales Report</h2>
              <button onClick={loadReport}>Load Report</button>
            </div>
            {report ? (
              <>
                <div className="report-totals">
                  <div>
                    <span>Revenue</span>
                    <strong>{money(report.totalRevenue)}</strong>
                  </div>
                  <div>
                    <span>Margin</span>
                    <strong>{money(report.totalMargin)}</strong>
                  </div>
                </div>
                {report.topProducts.map((product) => (
                  <div key={product.productId} className="receipt-row">
                    <span>
                      {product.name} x {product.quantity}
                    </span>
                    <strong>{money(product.margin)} margin</strong>
                  </div>
                ))}
              </>
            ) : (
              <p className="muted">
                Admin can load margin. Cashier receives 403 from the API.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
