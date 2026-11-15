import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  ExternalLink,
  Play,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Code,
  Layers,
  ShoppingBag,
  Sliders,
  Boxes,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Activity,
  FileCode2,
  FolderTree,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Edit3,
  UserCheck,
  Tag
} from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: string;
  uptimeSeconds: number;
  environment: string;
  server: {
    framework: string;
    runtime: string;
    port: number | string;
  };
  mongodb: {
    connected: boolean;
    readyState: number;
    statusText: string;
    host: string | null;
    name: string | null;
    error: string | null;
    usingMemoryFallback: boolean;
  };
  api: {
    version: string;
    service: string;
    endpoints: string[];
    adminSecurity?: {
      protectedEndpoints: string[];
      authMethods: string[];
    };
  };
  cors: {
    allowedClients: string[];
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'catalog' | 'integration' | 'atlas' | 'architecture'>('playground');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin JWT Auth State
  const [adminAuthEnabled, setAdminAuthEnabled] = useState<boolean>(true);
  const [adminJwtToken, setAdminJwtToken] = useState<string>('');
  const [adminUserEmail, setAdminUserEmail] = useState<string>('admin@shopco.com');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);

  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/products');
  const [queryParams, setQueryParams] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);

  // Catalog tab state
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogPagination, setCatalogPagination] = useState<any>(null);
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  // Automatic initial login to obtain real JWT token
  const performInitialAdminLogin = async () => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@shopco.com',
          password: 'adminpassword123',
        }),
      });
      const data = await res.json();
      if (data.token) {
        setAdminJwtToken(data.token);
        if (data.admin?.email) setAdminUserEmail(data.admin.email);
      }
    } catch {
      // Fallback secret key if network hiccup
      setAdminJwtToken('shopco_admin_secret_key_2026');
    }
  };

  const handleManualAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@shopco.com',
          password: 'adminpassword123',
        }),
      });
      const data = await res.json();
      if (data.token) {
        setAdminJwtToken(data.token);
        setAdminUserEmail(data.admin?.email || 'admin@shopco.com');
        setLoginSuccessMsg(`Authenticated as ${data.admin?.email} (JWT Generated)`);
        setTimeout(() => setLoginSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health check:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchCatalog = async (page: number = 1) => {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`/api/products?page=${page}&limit=8`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCatalogProducts(json.data);
        setCatalogPagination(json.pagination || null);
        setCatalogPage(page);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchCatalog(1);
    performInitialAdminLogin();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Endpoint presets for the Playground
  const endpointPresets: Record<
    string,
    { method: string; url: string; defaultParams?: string; defaultBody?: string; description: string; requiresAdmin?: boolean }
  > = {
    'POST /api/auth/admin-login': {
      method: 'POST',
      url: '/api/auth/admin-login',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          email: 'admin@shopco.com',
          password: 'adminpassword123',
        },
        null,
        2
      ),
      description: 'Admin Login using email and password. Generates and returns a secure JWT authentication token.',
      requiresAdmin: false,
    },
    'GET /api/auth/me (Admin)': {
      method: 'GET',
      url: '/api/auth/me',
      defaultParams: '',
      description: 'Fetch the authenticated admin profile from JWT token.',
      requiresAdmin: true,
    },
    'GET /api/dashboard/stats (Admin)': {
      method: 'GET',
      url: '/api/dashboard/stats',
      defaultParams: '',
      description: 'Protected: Fetch complete admin metrics (total revenue, sales by category, status counts, low stock alerts).',
      requiresAdmin: true,
    },
    'GET /api/products': {
      method: 'GET',
      url: '/api/products',
      defaultParams: '?page=1&limit=6&category=t-shirts&sort=price-asc',
      description: 'Public: Fetch paginated products with filtering by category, style, price range, search, and sorting.',
      requiresAdmin: false,
    },
    'GET /api/products/slug': {
      method: 'GET',
      url: '/api/products/t-shirt-with-tape-details',
      defaultParams: '',
      description: 'Public: Fetch single product details by slug or MongoDB ObjectId.',
      requiresAdmin: false,
    },
    'POST /api/products (Admin)': {
      method: 'POST',
      url: '/api/products',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          name: 'Classic Black Polo Shirt',
          description: 'Timeless pique cotton black polo with tipped collar and cuffs.',
          price: 135,
          originalPrice: 150,
          discount: 10,
          discountPercentage: 10,
          category: 'shirts',
          dressStyle: 'casual',
          colors: ['#000000', '#1E3A8A'],
          sizes: ['Small', 'Medium', 'Large', 'X-Large'],
          images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80'],
          stockQuantity: 35,
        },
        null,
        2
      ),
      description: 'Protected: Create a new product. (Requires Admin JWT; returns 401 Unauthorized if auth is toggled off).',
      requiresAdmin: true,
    },
    'PUT /api/products/:id (Admin)': {
      method: 'PUT',
      url: '/api/products/t-shirt-with-tape-details',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          price: 110,
          stockQuantity: 60,
          discount: 25,
          description: 'Updated: Premium combed cotton t-shirt with signature tape accents.',
        },
        null,
        2
      ),
      description: 'Protected: Update an existing product by slug or ObjectId with input validation. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'DELETE /api/products/:id (Admin)': {
      method: 'DELETE',
      url: '/api/products/t-shirt-with-tape-details',
      defaultParams: '',
      description: 'Protected: Delete a product by slug or ObjectId from catalog. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'GET /api/categories': {
      method: 'GET',
      url: '/api/categories',
      defaultParams: '',
      description: 'Public: Get all categories and dress styles with live product counts.',
      requiresAdmin: false,
    },
    'POST /api/categories (Admin)': {
      method: 'POST',
      url: '/api/categories',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          name: 'Sweaters & Cardigans',
          description: 'Chunky knit and cashmere blend cardigans',
          displayOrder: 7,
        },
        null,
        2
      ),
      description: 'Protected: Create a new product category. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'PUT /api/categories/:id (Admin)': {
      method: 'PUT',
      url: '/api/categories/t-shirts',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          description: 'Updated description: Premium streetwear and classic graphic tees.',
        },
        null,
        2
      ),
      description: 'Protected: Update an existing category by slug or ObjectId. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'DELETE /api/categories/:id (Admin)': {
      method: 'DELETE',
      url: '/api/categories/shorts',
      defaultParams: '',
      description: 'Protected: Delete a category from the catalog. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'GET /api/orders (Admin)': {
      method: 'GET',
      url: '/api/orders',
      defaultParams: '?status=all&page=1&limit=10',
      description: 'Protected: Fetch all customer orders with status filter & pagination. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'POST /api/orders': {
      method: 'POST',
      url: '/api/orders',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          customer: {
            name: 'Sarah Connor',
            email: 'sarah.c@example.com',
            phone: '+1 555-0988',
            address: {
              street: '400 Cyber Way',
              city: 'Los Angeles',
              state: 'CA',
              postalCode: '90001',
              country: 'USA',
            },
          },
          items: [
            {
              name: 'T-shirt with Tape Details',
              price: 120,
              quantity: 1,
              size: 'Large',
              color: '#000000',
              image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            },
          ],
          paymentMethod: 'credit_card',
          discount: 0,
        },
        null,
        2
      ),
      description: 'Public: Customer Shopping Website checkout endpoint to place a new order.',
      requiresAdmin: false,
    },
    'PUT /api/orders/:id/status (Admin)': {
      method: 'PUT',
      url: '/api/orders/ORD-2026-1003/status',
      defaultParams: '',
      defaultBody: JSON.stringify(
        {
          status: 'shipped',
          paymentStatus: 'paid',
        },
        null,
        2
      ),
      description: 'Protected: Update order status (pending, processing, shipped, delivered, cancelled). (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'DELETE /api/orders/:id (Admin)': {
      method: 'DELETE',
      url: '/api/orders/ORD-2026-1003',
      defaultParams: '',
      description: 'Protected: Cancel or delete an order. (Requires Admin JWT).',
      requiresAdmin: true,
    },
    'GET /api/health': {
      method: 'GET',
      url: '/api/health',
      defaultParams: '',
      description: 'Check server uptime, health status, and live MongoDB Atlas connection.',
      requiresAdmin: false,
    },
    'POST /api/seed': {
      method: 'POST',
      url: '/api/seed',
      defaultParams: '',
      defaultBody: JSON.stringify({ force: false }, null, 2),
      description: 'Populate MongoDB Atlas with realistic Shop-Co clothing items, categories, and sample orders.',
      requiresAdmin: false,
    },
  };

  const handleSelectPreset = (key: string) => {
    setSelectedEndpoint(key);
    const preset = endpointPresets[key];
    setQueryParams(preset.defaultParams || '');
    setRequestBody(preset.defaultBody || '');
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleExecuteRequest = async () => {
    const preset = endpointPresets[selectedEndpoint];
    if (!preset) return;

    setRequestLoading(true);
    const startTime = performance.now();

    try {
      const fullUrl = `${preset.url}${queryParams}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Inject JWT authentication if enabled
      if (adminAuthEnabled && adminJwtToken) {
        headers['Authorization'] = `Bearer ${adminJwtToken}`;
        headers['x-admin-key'] = adminJwtToken;
      }

      const options: RequestInit = {
        method: preset.method,
        headers,
      };

      if (preset.method !== 'GET' && preset.method !== 'HEAD' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(fullUrl, options);
      const latency = Math.round(performance.now() - startTime);
      setResponseLatency(latency);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(json);

      // If login endpoint was called, update token state
      if (preset.url === '/api/auth/admin-login' && json.token) {
        setAdminJwtToken(json.token);
        if (json.admin?.email) setAdminUserEmail(json.admin.email);
      }

      // If seed or product modified, refresh catalog
      if (preset.url.includes('/seed') || preset.method !== 'GET') {
        fetchCatalog(catalogPage);
        fetchHealth();
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseLatency(Math.round(performance.now() - startTime));
      setResponseData({ error: err.message || 'Request failed' });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSeedCatalog = async (force: boolean = false) => {
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      setSeedSuccessMsg(data.message || 'Catalog seeded successfully!');
      setTimeout(() => setSeedSuccessMsg(null), 4000);
      fetchCatalog(1);
      fetchHealth();
    } catch (err) {
      console.error('Failed to seed:', err);
    }
  };

  const handleDeleteProduct = async (idOrSlug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This uses Admin Authentication.`)) return;

    try {
      const res = await fetch(`/api/products/${idOrSlug}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminJwtToken || 'shopco_admin_secret_key_2026'}`,
          'x-admin-key': adminJwtToken || 'shopco_admin_secret_key_2026',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSeedSuccessMsg(data.message || `Deleted product "${name}"`);
        setTimeout(() => setSeedSuccessMsg(null), 3000);
        fetchCatalog(catalogPage);
      } else {
        alert(`Delete failed: ${data.message || 'Unauthorized'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-b border-neutral-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-400 text-slate-950 tracking-wide uppercase">
            Backend API Active
          </span>
          <span className="hidden sm:inline text-slate-400">Powering Shop-Co E-Commerce Project</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://shop-co-assignment.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>Customer Website</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <span className="text-neutral-700">|</span>
          <a
            href="https://shop-co-assignment-dashbord.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
            <span>Admin Dashboard</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-neutral-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black text-xl">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl tracking-tight text-white">SHOP.CO</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  v1.2.0
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  JWT Admin Auth Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Express.js + MongoDB Atlas + JWT Authentication API
              </p>
            </div>
          </div>

          {/* Live Status Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Server Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Server:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Port {health?.server?.port || '3000'}
              </span>
            </div>

            {/* MongoDB Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                health?.mongodb?.connected
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="text-slate-400">MongoDB:</span>
              {health?.mongodb?.connected ? (
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Atlas Connected ({health.mongodb.name})
                </span>
              ) : (
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  In-Memory Fallback
                </span>
              )}
            </div>

            <button
              onClick={fetchHealth}
              disabled={loadingHealth}
              title="Refresh Server Diagnostics"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'playground'
                ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Play className="w-4 h-4" />
            API Playground
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'catalog'
                ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Catalog &amp; Products
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'integration'
                ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-4 h-4" />
            Dashboard Integration
          </button>
          <button
            onClick={() => setActiveTab('atlas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'atlas'
                ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            MongoDB Atlas Setup
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Architecture &amp; Security
          </button>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {loginSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{loginSuccessMsg}</span>
            </div>
            <span className="font-mono text-[10px] text-purple-400 bg-purple-900/60 px-2 py-0.5 rounded">
              JWT Active
            </span>
          </div>
        )}

        {/* Notice banner if MongoDB Atlas is in Fallback Mode */}
        {health && !health.mongodb.connected && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-200">
                  Resilient In-Memory Mode Active (MongoDB Atlas Unconfigured)
                </h4>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  All Admin JWT authentication, Product &amp; Category management, Orders, and Dashboard stats are 100% operational in memory. To permanently persist to Atlas, add your <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono text-amber-200">MONGODB_URI</code> in <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono text-amber-200">.env</code>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('atlas')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5"
            >
              <span>Atlas Setup Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: API PLAYGROUND */}
        {/* ======================================================== */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Endpoints list */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Endpoint
                </span>
                <span className="text-xs text-slate-500">
                  {Object.keys(endpointPresets).length} Endpoints
                </span>
              </div>

              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {Object.entries(endpointPresets).map(([key, item]) => {
                  const isSelected = selectedEndpoint === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-400/80 shadow-md shadow-amber-500/5'
                          : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                            item.method === 'GET'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : item.method === 'POST'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.method === 'PUT'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.method}
                        </span>
                        <span className="text-xs font-medium text-slate-200 truncate font-mono">
                          {item.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.requiresAdmin && (
                          <span
                            title="Admin authentication required"
                            className="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 flex items-center gap-0.5"
                          >
                            <Lock className="w-2.5 h-2.5 text-purple-400" />
                            Admin
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick cURL generator helper */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    cURL Command
                  </span>
                  <button
                    onClick={() => {
                      const p = endpointPresets[selectedEndpoint];
                      const authPart =
                        adminAuthEnabled && p.requiresAdmin && adminJwtToken
                          ? ` -H "Authorization: Bearer ${adminJwtToken}"`
                          : '';
                      const curl =
                        p.method === 'GET'
                          ? `curl -X GET "${window.location.origin}${p.url}${queryParams}"${authPart}`
                          : `curl -X ${p.method} "${window.location.origin}${p.url}" -H "Content-Type: application/json"${authPart} -d '${requestBody.replace(/\n/g, '')}'`;
                      copyToClipboard(curl, 'curl');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-[11px] font-mono p-2 rounded bg-black/60 text-slate-300 overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                  {endpointPresets[selectedEndpoint]?.method === 'GET'
                    ? `curl -X GET "${window.location.origin}${endpointPresets[selectedEndpoint]?.url}${queryParams}"`
                    : `curl -X ${endpointPresets[selectedEndpoint]?.method} "${window.location.origin}${endpointPresets[selectedEndpoint]?.url}" -H "Content-Type: application/json"${
                        adminAuthEnabled && endpointPresets[selectedEndpoint]?.requiresAdmin && adminJwtToken
                          ? ` -H "Authorization: Bearer ${adminJwtToken.slice(0, 16)}..."`
                          : ''
                      }`}
                </pre>
              </div>
            </div>

            {/* Right Panel: Interactive Request & Response */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                {/* Admin JWT Auth Bar */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${adminAuthEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                      {adminAuthEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>Admin JWT Bearer Header:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${adminAuthEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                          {adminAuthEnabled ? 'ENABLED' : 'DISABLED (Public/Guest)'}
                        </span>
                        {adminAuthEnabled && (
                          <span className="text-[11px] text-purple-300 font-mono">
                            ({adminUserEmail})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {adminAuthEnabled
                          ? 'Requests will send `Authorization: Bearer <JWT>` to authorize admin operations.'
                          : 'Toggle OFF to test that protected endpoints return 401 Unauthorized!'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleManualAdminLogin}
                      disabled={loginLoading}
                      title="Run POST /api/auth/admin-login to refresh JWT"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold border border-purple-500/40 flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loginLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh JWT</span>
                    </button>
                    <button
                      onClick={() => setAdminAuthEnabled(!adminAuthEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        adminAuthEnabled
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{adminAuthEnabled ? 'Auth Active' : 'Enable Auth'}</span>
                    </button>
                  </div>
                </div>

                {/* Method & URL Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">
                      Target Endpoint
                    </label>
                    {endpointPresets[selectedEndpoint]?.requiresAdmin && (
                      <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Requires Admin JWT Authentication
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-3 py-2 rounded-lg font-mono ${
                        endpointPresets[selectedEndpoint]?.method === 'GET'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : endpointPresets[selectedEndpoint]?.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : endpointPresets[selectedEndpoint]?.method === 'PUT'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {endpointPresets[selectedEndpoint]?.method}
                    </span>
                    <div className="flex-1 flex items-center bg-black/40 rounded-lg border border-slate-700/80 overflow-hidden font-mono text-xs">
                      <span className="px-3 py-2 text-slate-500 bg-slate-800/40 border-r border-slate-700/60 select-none">
                        /api
                      </span>
                      <span className="px-3 py-2 text-slate-200">
                        {endpointPresets[selectedEndpoint]?.url.replace('/api', '')}
                      </span>
                    </div>
                    <button
                      onClick={handleExecuteRequest}
                      disabled={requestLoading}
                      className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                    >
                      {requestLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Send Request</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {endpointPresets[selectedEndpoint]?.description}
                  </p>
                </div>

                {/* Query Parameters Input for GET */}
                {endpointPresets[selectedEndpoint]?.method === 'GET' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                      Query Parameters (Supports Pagination, Filtering, Sorting)
                    </label>
                    <input
                      type="text"
                      value={queryParams}
                      onChange={(e) => setQueryParams(e.target.value)}
                      placeholder="e.g. ?page=1&limit=6&category=t-shirts&sort=price-asc"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Request Body Input for POST/PUT */}
                {endpointPresets[selectedEndpoint]?.method !== 'GET' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-400">
                        JSON Request Body (Input Validation Enforced)
                      </label>
                      <button
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(JSON.parse(requestBody), null, 2);
                            setRequestBody(formatted);
                          } catch {
                            // ignore syntax error
                          }
                        }}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Format JSON
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/50 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Live Response Viewer */}
                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      Live API Response
                    </span>
                    {responseStatus !== null && (
                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold ${
                            responseStatus >= 200 && responseStatus < 300
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : responseStatus === 401 || responseStatus === 403
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          Status: {responseStatus} {responseStatus === 401 ? 'Unauthorized (Auth Required)' : ''}
                        </span>
                        {responseLatency !== null && (
                          <span className="text-slate-400 font-mono">
                            {responseLatency} ms
                          </span>
                        )}
                        <button
                          onClick={() =>
                            copyToClipboard(JSON.stringify(responseData, null, 2), 'response')
                          }
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy JSON Response"
                        >
                          {copiedKey === 'response' ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-black/70 border border-slate-800 p-4 font-mono text-xs overflow-x-auto max-h-96 text-slate-300">
                    {responseData !== null ? (
                      <pre>{JSON.stringify(responseData, null, 2)}</pre>
                    ) : (
                      <div className="text-center py-8 text-slate-500 flex flex-col items-center justify-center gap-2">
                        <Play className="w-6 h-6 stroke-1 text-slate-600" />
                        <span>Click &quot;Send Request&quot; above to test this endpoint live.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CATALOG & PRODUCTS */}
        {/* ======================================================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  Shop-Co Product Catalog &amp; Inventory
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Mongoose schema supports: Name, Description, Price, Images, Category, Stock Quantity, Discount, and Timestamps.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSeedCatalog(false)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Catalog</span>
                </button>
                <button
                  onClick={() => handleSeedCatalog(true)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {seedSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{seedSuccessMsg}</span>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalogProducts.map((p) => {
                const stockQty = p.stockQuantity !== undefined ? p.stockQuantity : p.stock;
                const discountVal = p.discount !== undefined ? p.discount : (p.discountPercentage || 0);

                return (
                  <div
                    key={p._id || p.slug}
                    className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden flex flex-col group hover:border-slate-700 transition-all"
                  >
                    <div className="relative aspect-square bg-slate-800 overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discountVal > 0 && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow">
                          -{discountVal}% OFF
                        </span>
                      )}
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/70 backdrop-blur text-slate-200 capitalize">
                        {p.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100 line-clamp-1">{p.name}</h4>
                        <p className="text-xs text-slate-400 capitalize">{p.dressStyle} style</p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-white text-base">${p.price}</span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-xs text-slate-500 line-through">
                              ${p.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-amber-400 font-semibold">
                          ★ {p.rating}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          stockQty <= 10
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          Stock: {stockQty} units
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedEndpoint('PUT /api/products/:id (Admin)');
                              const preset = endpointPresets['PUT /api/products/:id (Admin)'];
                              preset.url = `/api/products/${p.slug || p._id}`;
                              setRequestBody(
                                JSON.stringify(
                                  {
                                    price: Math.round(p.price * 0.9),
                                    stockQuantity: (stockQty || 0) + 10,
                                    discount: discountVal,
                                  },
                                  null,
                                  2
                                )
                              );
                              setActiveTab('playground');
                            }}
                            title="Edit Product in Playground"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.slug || p._id, p.name)}
                            title="Delete Product (Admin)"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-1 flex items-center justify-between">
                        <span>Updated: {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recent'}</span>
                        <span className="font-mono text-[9px] text-slate-600">ID: {String(p._id).slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {catalogPagination && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-slate-400">
                  Page <strong className="text-white">{catalogPagination.currentPage}</strong> of{' '}
                  <strong className="text-white">{catalogPagination.totalPages}</strong> ({catalogPagination.totalProducts} Total Products)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchCatalog(catalogPage - 1)}
                    disabled={!catalogPagination.hasPrevPage || loadingCatalog}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchCatalog(catalogPage + 1)}
                    disabled={!catalogPagination.hasNextPage || loadingCatalog}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DASHBOARD & FRONTEND INTEGRATION */}
        {/* ======================================================== */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <LayoutDashboard className="w-5 h-5 text-sky-400" />
                Admin Dashboard Integration Guide (JWT Authentication)
              </h2>
              <p className="text-slate-300 text-sm max-w-4xl leading-relaxed">
                Connect your existing admin dashboard (<code className="text-sky-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">https://shop-co-assignment-dashbord.vercel.app/</code>) using secure JWT authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Step 1: Admin Login with JWT */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">1. Admin Login &amp; Storing JWT</h3>
                      <p className="text-xs text-slate-400">Email + Password with bcrypt &amp; JWT</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    POST /api/auth/admin-login
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p className="font-semibold text-slate-200">
                    React Login Hook / Function for your Dashboard:
                  </p>
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function loginAdmin(email, password) {
  const res = await fetch(\`\${API_URL}/auth/admin-login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await res.json();
  if (data.success && data.token) {
    // Store JWT in localStorage
    localStorage.setItem('shopco_admin_token', data.token);
    return data.admin;
  }
  throw new Error(data.message || 'Login failed');
}`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';\n\nexport async function loginAdmin(email, password) {\n  const res = await fetch(\`\${API_URL}/auth/admin-login\`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ email, password }),\n  });\n  const data = await res.json();\n  if (data.success && data.token) {\n    localStorage.setItem('shopco_admin_token', data.token);\n    return data.admin;\n  }\n  throw new Error(data.message || 'Login failed');\n}`,
                          'code_login'
                        )
                      }
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'code_login' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-slate-200">Default Admin Credentials:</strong>
                    <br />
                    Email: <code className="text-amber-300">admin@shopco.com</code> | Password:{' '}
                    <code className="text-amber-300">adminpassword123</code>
                  </div>
                </div>
              </div>

              {/* Step 2: Dashboard Statistics */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">2. Fetching Dashboard Stats</h3>
                      <p className="text-xs text-slate-400">Protected with JWT Authorization</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    GET /api/dashboard/stats
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p className="font-semibold text-slate-200">
                    Fetching Revenue, Orders &amp; Low Stock Alerts:
                  </p>
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`export async function getDashboardStats() {
  const token = localStorage.getItem('shopco_admin_token');

  const res = await fetch(\`\${API_URL}/dashboard/stats\`, {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  const { data } = await res.json();
  // Returns:
  // - data.metrics.totalRevenue
  // - data.metrics.totalOrders
  // - data.metrics.totalProducts
  // - data.metrics.statusCounts (pending, processing, shipped, etc.)
  // - data.lowStockProducts
  // - data.recentOrders
  return data;
}`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `export async function getDashboardStats() {\n  const token = localStorage.getItem('shopco_admin_token');\n  const res = await fetch(\`\${API_URL}/dashboard/stats\`, {\n    headers: { 'Authorization': \`Bearer \${token}\` },\n  });\n  const { data } = await res.json();\n  return data;\n}`,
                          'code_stats'
                        )
                      }
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'code_stats' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Managing Products & Categories */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">3. Managing Products &amp; Categories</h3>
                      <p className="text-xs text-slate-400">Create, Update, Delete with JWT</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`const getAdminHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': \`Bearer \${localStorage.getItem('shopco_admin_token')}\`,
});

// Create product:
export async function createProduct(productData) {
  return fetch(\`\${API_URL}/products\`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(productData),
  }).then((r) => r.json());
}

// Create category:
export async function createCategory(categoryData) {
  return fetch(\`\${API_URL}/categories\`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(categoryData),
  }).then((r) => r.json());
}`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `const getAdminHeaders = () => ({\n  'Content-Type': 'application/json',\n  'Authorization': \`Bearer \${localStorage.getItem('shopco_admin_token')}\`,\n});\n\nexport async function createProduct(productData) {\n  return fetch(\`\${API_URL}/products\`, {\n    method: 'POST',\n    headers: getAdminHeaders(),\n    body: JSON.stringify(productData),\n  }).then((r) => r.json());\n}`,
                          'code_prod_cat'
                        )
                      }
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'code_prod_cat' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4: Managing Orders */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">4. Managing Customer Orders</h3>
                      <p className="text-xs text-slate-400">Tracking, Filter by Status &amp; Updates</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`// List orders:
export async function getOrders(status = 'all', page = 1) {
  return fetch(\`\${API_URL}/orders?status=\${status}&page=\${page}\`, {
    headers: getAdminHeaders(),
  }).then((r) => r.json());
}

// Update order status (pending -> processing -> shipped -> delivered):
export async function updateOrderStatus(orderId, status) {
  return fetch(\`\${API_URL}/orders/\${orderId}/status\`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    body: JSON.stringify({ status }),
  }).then((r) => r.json());
}`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `export async function updateOrderStatus(orderId, status) {\n  return fetch(\`\${API_URL}/orders/\${orderId}/status\`, {\n    method: 'PUT',\n    headers: getAdminHeaders(),\n    body: JSON.stringify({ status }),\n  }).then((r) => r.json());\n}`,
                          'code_ord'
                        )
                      }
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'code_ord' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: MONGODB ATLAS SETUP GUIDE */}
        {/* ======================================================== */}
        {activeTab === 'atlas' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                MongoDB Atlas Setup Walkthrough
              </h2>
              <p className="text-slate-400 text-sm">
                Follow these 5 simple steps to connect your free MongoDB Atlas cloud cluster to this backend.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Create Free M0 Cluster</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Go to{' '}
                  <a
                    href="https://www.mongodb.com/cloud/atlas"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline"
                  >
                    mongodb.com/cloud/atlas
                  </a>
                  , create an account, and choose the <strong>M0 Free</strong> tier.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Create Database User</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Under <strong>Security &gt; Database Access</strong>, click <strong>Add New Database User</strong>. Set username (e.g. <code className="text-slate-200">shopco_user</code>) and password.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Allow Network Access (IP Whitelist)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Under <strong>Security &gt; Network Access</strong>, click <strong>Add IP Address</strong>, select <strong>&quot;Allow Access from Anywhere&quot;</strong> (<code className="text-slate-200">0.0.0.0/0</code>).
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Copy Connection URI</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong>Connect</strong> on your cluster, choose <strong>Drivers (Node.js)</strong>, and copy the URI. Append <code className="text-emerald-400">/shopco</code> before query parameters.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 md:col-span-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Add to .env File</h3>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
MONGODB_URI=mongodb+srv://shopco_user:YOUR_PASSWORD@cluster0.abcde.mongodb.net/shopco?retryWrites=true&amp;w=majority
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'MONGODB_URI=mongodb+srv://shopco_user:<password>@cluster0.abcde.mongodb.net/shopco?retryWrites=true&w=majority',
                        'atlas_env'
                      )
                    }
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'atlas_env' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ARCHITECTURE & SECURITY */}
        {/* ======================================================== */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-amber-400" />
                Clean, Beginner-Friendly ES Module Architecture with JWT &amp; bcrypt
              </h2>
              <p className="text-slate-400 text-sm">
                Organized following the industry-standard Model-View-Controller (MVC) pattern, structured with native ES Modules (<code className="text-slate-200">import/export</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>models/Admin.ts &amp; bcrypt</span>
                </div>
                <p className="text-xs text-slate-400">
                  Mongoose Admin schema with pre-save bcrypt salt hashing (10 rounds), <code className="font-mono text-slate-300">comparePassword()</code>, and <code className="font-mono text-slate-300">generateAuthToken()</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>middleware/authMiddleware.ts</span>
                </div>
                <p className="text-xs text-slate-400">
                  JWT verification middleware enforcing Bearer tokens on admin routes (Products, Categories, Orders, Dashboard stats). Returns 401 on missing or expired tokens.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>controllers/dashboardController.ts</span>
                </div>
                <p className="text-xs text-slate-400">
                  Computes total revenue, orders count, product count, status distribution, low-stock warnings, and category sales charts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Tag className="w-4 h-4" />
                  <span>models/Category.ts &amp; Routes</span>
                </div>
                <p className="text-xs text-slate-400">
                  Category management schema and endpoints (GET, POST, PUT, DELETE) for adding and customizing store categories with live item counts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Boxes className="w-4 h-4" />
                  <span>controllers/orderController.ts</span>
                </div>
                <p className="text-xs text-slate-400">
                  Handles customer checkout, order number generation, status progression (pending, processing, shipped, delivered), and admin deletion.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <FileCode2 className="w-4 h-4" />
                  <span>models/Product.ts</span>
                </div>
                <p className="text-xs text-slate-400">
                  Complete product model with name, description, price, images, category, stockQuantity, discount, and timestamps.
                </p>
              </div>
            </div>

            {/* How to run locally instructions */}
            <div className="p-6 rounded-2xl bg-black/60 border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Local Execution Commands
              </h3>
              <div className="space-y-2 font-mono text-xs text-slate-300">
                <p className="text-slate-400">1. Install dependencies:</p>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  npm install
                </div>
                <p className="text-slate-400 pt-1">2. Run in development:</p>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  npm run dev
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-6 mt-12 text-center text-xs text-slate-500 space-y-2">
        <p>Shop-Co E-Commerce Backend • Node.js, Express.js, MongoDB Atlas (Mongoose)</p>
        <p className="text-slate-600">
          JWT Authentication • Admin Operations • Customer Storefront API
        </p>
      </footer>
    </div>
  );
}
