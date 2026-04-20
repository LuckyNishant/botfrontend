import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { api } from "./api";

const initialStockForm = { model: "M11", part: "screen", delta: 1 };
const initialAddItemForm = { model: "M11", part: "screen", stock: 0, price: 0, compatible: "" };
const initialPurchaseForm = { model: "M11", part: "screen", qty: 5, cost: 500, supplier: "" };
const initialWhitelistForm = { phoneNumber: "", label: "" };
const ADMIN_SESSION_KEY = "lucky_mobile_admin_auth";
const DEFAULT_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || "luckymobile@admin";

// --- SVG Icons ---
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Bot: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Orders: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  X: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  )
};

export default function App() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(ADMIN_SESSION_KEY) === "true"
  );
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [addItemForm, setAddItemForm] = useState(initialAddItemForm);
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [botEnabled, setBotEnabled] = useState(true);
  const [botLink, setBotLink] = useState(null);
  const [mentionPrefix, setMentionPrefix] = useState("@lucky");
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [whitelistForm, setWhitelistForm] = useState(initialWhitelistForm);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [whitelistedNumbers, setWhitelistedNumbers] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setDashboard(data);
      setSelectedGroups(data.selectedGroups || []);
      setSelectedGroupIds((data.selectedGroups || []).map((group) => group.groupId));
      setAvailableGroups(data.availableGroups || []);
      setWhitelistedNumbers(data.whitelistedNumbers || []);
      setBotEnabled(Boolean(data.botEnabled));
      setBotLink(data.botLink || null);
      setNotificationsEnabled(Boolean(data.notificationsEnabled));
      setMentionPrefix(data.mentionPrefix || "@lucky");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboard();
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;
    const renderQr = async () => {
      if (!botLink?.qr) {
        setQrDataUrl("");
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(botLink.qr, { width: 256, margin: 1 });
        if (mounted) setQrDataUrl(dataUrl);
      } catch (_error) {
        if (mounted) setQrDataUrl("");
      }
    };
    renderQr();
    return () => {
      mounted = false;
    };
  }, [botLink?.qr]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAction = async (action, successText, options = {}) => {
    const { refreshDashboard = true } = options;
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setMessage("");
      setError("");
      await action();
      setMessage(successText);
      if (refreshDashboard) {
        await loadDashboard();
      }
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      setError("Browser notifications are not supported on this device.");
      return;
    }
    try {
      setError("");
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === "granted") {
        setMessage("Notification permission granted!");
      } else {
        setMessage("Notification permission denied.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSelectedGroup = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const syncGroups = async () => {
    await runAction(
      async () => {
        const result = await api.syncGroups();
        setAvailableGroups(result.groups || []);
      },
      "WhatsApp groups synced.",
      { refreshDashboard: false }
    );
  };

  const saveSelectedGroups = async () => {
    await runAction(async () => {
      const groups = availableGroups.filter((group) => selectedGroupIds.includes(group.groupId));
      const result = await api.replaceGroups({ groups });
      setSelectedGroups(result.groups || []);
      setSelectedGroupIds((result.groups || []).map((group) => group.groupId));
    }, "Selected groups saved.");
  };

  const handleLogin = () => {
    if (passcode === DEFAULT_PASSCODE) {
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
      setIsAuthenticated(true);
      setError("");
      setPasscode("");
      return;
    }
    setError("Invalid admin passcode.");
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setDashboard(null);
  };

  const kpis = useMemo(
    () => [
      { title: "Total Stock", value: loading ? "..." : dashboard?.totalStock ?? 0, color: "var(--primary)" },
      { title: "Today Orders", value: loading ? "..." : dashboard?.todayOrders ?? 0, color: "var(--success)" },
      { title: "Low Stock", value: loading ? "..." : dashboard?.lowStockAlertCount ?? 0, color: "var(--danger)" },
      { title: "Groups Active", value: selectedGroups.length, color: "var(--warning)" },
    ],
    [dashboard, loading, selectedGroups.length]
  );

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container" style={{justifyContent: 'center'}}>
              <div className="logo-icon">LM</div>
            </div>
            <h1>Lucky Mobile</h1>
            <p>Admin Control Center</p>
          </div>
          {error ? <div className="badge badge-danger mb-4" style={{display: 'block', textAlign: 'center'}}>{error}</div> : null}
          <div className="form-group">
            <label className="label">Admin Passcode</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••"
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} onClick={handleLogin}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const NavItem = ({ id, label, icon: IconComponent }) => (
    <button 
      className={`nav-item ${activeTab === id ? 'active' : ''}`}
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
    >
      <IconComponent />
      <span>{label}</span>
      {id === 'inventory' && dashboard?.lowStockAlertCount > 0 && (
         <span className="badge badge-danger" style={{marginLeft: 'auto', fontSize: '0.65rem'}}>{dashboard.lowStockAlertCount}</span>
      )}
    </button>
  );

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="logo-container">
          <div className="logo-icon">LM</div>
          <span style={{fontWeight: 700}}>Lucky Mobile</span>
        </div>
        <button className="btn btn-ghost" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">LM</div>
            <span style={{fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em'}}>Lucky Mobile</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem id="overview" label="Dashboard" icon={Icons.Dashboard} />
          <NavItem id="bot" label="Bot Management" icon={Icons.Bot} />
          <NavItem id="inventory" label="Inventory" icon={Icons.Inventory} />
          <NavItem id="orders" label="Order History" icon={Icons.Orders} />
          <NavItem id="controls" label="Config & Whitelist" icon={Icons.Settings} />
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{color: 'var(--danger)'}}>
            <Icons.LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="flex-between mb-4">
          <div>
            <h1 style={{fontSize: '1.8rem', fontWeight: 800}}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p className="text-muted">Managed by Lucky Mobile Admin System</p>
          </div>
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
             {loading && <span className="badge badge-warning">Syncing...</span>}
             <button className="btn btn-ghost" onClick={loadDashboard} title="Refresh Data">
                <Icons.Refresh />
             </button>
          </div>
        </div>

        {message && <div className="notification"><Icons.Plus /> {message}</div>}
        {error && <div className="badge badge-danger mb-4" style={{width: '100%', padding: '1rem'}}>{error}</div>}

        {activeTab === "overview" && (
          <div className="fade-in">
            <div className="stats-grid">
              {kpis.map((item) => (
                <div key={item.title} className="panel stat-card">
                  <span className="stat-label">{item.title}</span>
                  <span className="stat-value" style={{color: item.color}}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">System Diagnostics</h2>
                  <span className="badge badge-success">Live</span>
                </div>
                <div className="data-table-container">
                  <table className="data-table">
                    <tbody>
                      <tr><td>Sheets Connection</td><td>{dashboard?.diagnostics?.sheetsReady ? <span className="badge badge-success">Ready</span> : <span className="badge badge-danger">Error</span>}</td></tr>
                      <tr><td>Bot Connection</td><td>{botLink?.started ? <span className="status-indicator status-online"></span> : <span className="status-indicator status-offline"></span>}{botLink?.started ? "CONNECTED" : "OFFLINE"}</td></tr>
                      <tr><td>Server Time</td><td>{dashboard?.diagnostics?.serverTime || "-"}</td></tr>
                      <tr><td>API Endpoint</td><td style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{import.meta.env.VITE_API_BASE_URL || "luckymobilebackend.onrender.com"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Quick Actions</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                   <button className="btn btn-primary" onClick={() => setActiveTab('inventory')}>Update Inventory</button>
                   <button className="btn btn-success" onClick={() => setActiveTab('orders')}>Record Purchase</button>
                   <button className="btn btn-ghost" onClick={requestNotificationPermission}>Test Notifications</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bot" && (
          <div className="fade-in">
             <div className="grid-2">
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">WhatsApp Bot Configuration</h2>
                    <span className={`badge ${botLink?.started ? 'badge-success' : 'badge-danger'}`}>
                      {botLink?.started ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="label">Mention Trigger Keyword</label>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <input 
                        className="input" 
                        value={mentionPrefix} 
                        onChange={(e) => setMentionPrefix(e.target.value)} 
                      />
                      <button 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        onClick={() => runAction(() => api.setMentionPrefix({ mentionPrefix }), "Trigger keyword updated.")}
                      >Save</button>
                    </div>
                  </div>

                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem'}}>
                    <button className="btn btn-success" disabled={isSubmitting} onClick={() => runAction(() => api.toggleBot({ enabled: true }), "Bot initialization started.")}>Enable Bot</button>
                    <button className="btn btn-danger" disabled={isSubmitting} onClick={() => runAction(() => api.toggleBot({ enabled: false }), "Bot shutdown.")}>Disable Bot</button>
                    <button className="btn btn-ghost" disabled={isSubmitting} onClick={() => runAction(() => api.getDashboard(), "Status refreshed.")}>Refresh Connection</button>
                  </div>

                  {botLink?.lastError && <p className="badge badge-danger mt-4" style={{width: '100%'}}>{botLink.lastError}</p>}
                  
                  <div className="qr-container mt-4">
                    {qrDataUrl ? (
                      <>
                        <img src={qrDataUrl} className="qr-image" alt="WhatsApp QR" />
                        <p className="text-muted" style={{textAlign: 'center', fontSize: '0.9rem'}}>Scan this QR code from your WhatsApp mobile app under <b>Linked Devices</b>.</p>
                      </>
                    ) : (
                      <div style={{textAlign: 'center', padding: '2rem'}}>
                        <div className="status-indicator status-online" style={{marginBottom: '1rem'}}></div>
                        <p>{botLink?.started ? "Bot is already connected and running." : "Waiting for QR generation..."}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Authorized Groups</h2>
                    <button className="btn btn-ghost btn-sm" onClick={syncGroups}>Sync List</button>
                  </div>
                  <p className="text-muted mb-4" style={{fontSize: '0.85rem'}}>Select groups where the bot is allowed to track and respond to inventory queries.</p>
                  
                  <div className="data-table-container" style={{maxHeight: '400px'}}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Allow</th><th>Group Name</th></tr>
                      </thead>
                      <tbody>
                        {availableGroups.length === 0 ? (
                          <tr><td colSpan="2" style={{textAlign: 'center'}}>No groups found. Please sync.</td></tr>
                        ) : (
                          availableGroups.map((group) => (
                            <tr key={group.groupId}>
                              <td>
                                <input 
                                  type="checkbox" 
                                  checked={selectedGroupIds.includes(group.groupId)} 
                                  onChange={() => toggleSelectedGroup(group.groupId)}
                                />
                              </td>
                              <td>
                                <div style={{fontWeight: 600}}>{group.groupName || "Unnamed"}</div>
                                <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{group.groupId}</div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn btn-primary mt-4" style={{width: '100%'}} disabled={isSubmitting} onClick={saveSelectedGroups}>Save Group Permissions</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="fade-in">
            <div className="grid-2">
              <div className="panel">
                <h2 className="panel-title mb-4">Stock Adjustment</h2>
                <div className="form-group">
                  <label className="label">Model Name</label>
                  <input className="input" value={stockForm.model} onChange={(e) => setStockForm({...stockForm, model: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Part / Component</label>
                  <input className="input" value={stockForm.part} onChange={(e) => setStockForm({...stockForm, part: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Delta Change (+ for add, - for sub)</label>
                  <input type="number" className="input" value={stockForm.delta} onChange={(e) => setStockForm({...stockForm, delta: Number(e.target.value)})} />
                </div>
                <button className="btn btn-primary" style={{width: '100%'}} disabled={isSubmitting} onClick={() => runAction(() => api.updateStock(stockForm), "Stock updated successfully.")}>Update Inventory</button>
              </div>

              <div className="panel">
                <h2 className="panel-title mb-4">New Entry</h2>
                <div className="grid-2" style={{gap: '1rem'}}>
                  <div className="form-group">
                    <label className="label">Model</label>
                    <input className="input" value={addItemForm.model} onChange={e => setAddItemForm({...addItemForm, model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Part</label>
                    <input className="input" value={addItemForm.part} onChange={e => setAddItemForm({...addItemForm, part: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2" style={{gap: '1rem'}}>
                   <div className="form-group">
                    <label className="label">Initial Stock</label>
                    <input type="number" className="input" value={addItemForm.stock} onChange={e => setAddItemForm({...addItemForm, stock: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Resell Price</label>
                    <input type="number" className="input" value={addItemForm.price} onChange={e => setAddItemForm({...addItemForm, price: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Compatibility Note</label>
                  <input className="input" placeholder="e.g. Compatible with M12/M13" value={addItemForm.compatible} onChange={e => setAddItemForm({...addItemForm, compatible: e.target.value})} />
                </div>
                <button className="btn btn-success" style={{width: '100%'}} disabled={isSubmitting} onClick={() => runAction(async () => { await api.addInventoryItem(addItemForm); setAddItemForm(initialAddItemForm); }, "Item added to catalog.")}>Create Item</button>
              </div>
            </div>

            <div className="panel mt-4">
              <div className="panel-header">
                <h2 className="panel-title">Low Stock Alerts</h2>
                <span className="badge badge-danger">{dashboard?.lowStockItems?.length || 0} ITEMS</span>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Model</th><th>Part</th><th>Stock</th><th>Price</th><th>Compatible</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {(dashboard?.lowStockItems || []).length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>All inventory items are above safety threshold.</td></tr>
                    ) : (
                      dashboard.lowStockItems.map((item, i) => (
                        <tr key={i}>
                          <td><b>{item.model}</b></td>
                          <td>{item.part}</td>
                          <td style={{color: 'var(--danger)', fontWeight: 700}}>{item.stock}</td>
                          <td>₹{item.price}</td>
                          <td>{item.compatible || "-"}</td>
                          <td><span className="badge badge-danger">CRITICAL</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="fade-in">
            <div className="panel">
               <h2 className="panel-title mb-4">Log Supplier Purchase</h2>
               <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
                  <div className="form-group">
                    <label className="label">Model</label>
                    <input className="input" value={purchaseForm.model} onChange={e => setPurchaseForm({...purchaseForm, model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Part</label>
                    <input className="input" value={purchaseForm.part} onChange={e => setPurchaseForm({...purchaseForm, part: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Qty</label>
                    <input type="number" className="input" value={purchaseForm.qty} onChange={e => setPurchaseForm({...purchaseForm, qty: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Unit Cost</label>
                    <input type="number" className="input" value={purchaseForm.cost} onChange={e => setPurchaseForm({...purchaseForm, cost: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Supplier</label>
                    <input className="input" value={purchaseForm.supplier} onChange={e => setPurchaseForm({...purchaseForm, supplier: e.target.value})} />
                  </div>
               </div>
               <button className="btn btn-primary" disabled={isSubmitting} onClick={() => runAction(() => api.addPurchase(purchaseForm), "Purchase recorded.")}>Add Purchase Entry</button>
            </div>

            <div className="panel mt-4">
              <h2 className="panel-title mb-4">Recent Transactions</h2>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Model</th><th>Part</th><th>Type</th><th>Qty</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {(dashboard?.recentOrders || []).length === 0 ? (
                       <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No transaction history available.</td></tr>
                    ) : (
                      dashboard.recentOrders.map((row, i) => (
                        <tr key={i}>
                          <td>{row[0] || "-"}</td>
                          <td><b>{row[1] || "-"}</b></td>
                          <td>{row[2] || "-"}</td>
                          <td><span className={`badge ${row[3] === 'Purchase' ? 'badge-success' : 'badge-warning'}`}>{row[3] || "Order"}</span></td>
                          <td>{row[4] || 0}</td>
                          <td>₹{row[6] || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "controls" && (
          <div className="fade-in">
             <div className="grid-2">
                <div className="panel">
                   <h2 className="panel-title mb-4">System Notifications</h2>
                   <div className="panel stat-card" style={{background: 'var(--bg-main)', border: 'none'}}>
                      <span className="stat-label">Permission Status</span>
                      <span className="stat-value" style={{fontSize: '1.2rem'}}>{permissionState.toUpperCase()}</span>
                   </div>
                   <div className="mt-4 mb-4">
                      <label className="flex-between" style={{cursor: 'pointer'}}>
                         <span>Enable Order Desktop Notifications</span>
                         <input 
                           type="checkbox" 
                           checked={notificationsEnabled} 
                           onChange={(e) => setNotificationsEnabled(e.target.checked)} 
                           style={{width: '20px', height: '20px'}}
                         />
                      </label>
                   </div>
                   <div style={{display: 'flex', gap: '1rem'}}>
                      <button className="btn btn-ghost" onClick={requestNotificationPermission}>Request Browser Permission</button>
                      <button className="btn btn-primary" disabled={isSubmitting} onClick={() => runAction(() => api.toggleNotifications({ enabled: notificationsEnabled }), "Settings saved.")}>Save Configuration</button>
                   </div>
                </div>

                <div className="panel">
                   <h2 className="panel-title mb-4">Access Whitelist</h2>
                   <p className="text-muted mb-4" style={{fontSize: '0.85rem'}}>Numbers here are bypass verification or receive specific alerts. Form: 91XXXXXXXXXX</p>
                   <div className="grid-2" style={{gap: '1rem'}}>
                      <div className="form-group">
                        <label className="label">Phone Number</label>
                        <input className="input" placeholder="91..." value={whitelistForm.phoneNumber} onChange={e => setWhitelistForm({...whitelistForm, phoneNumber: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="label">Name / Label</label>
                        <input className="input" placeholder="e.g. Owner" value={whitelistForm.label} onChange={e => setWhitelistForm({...whitelistForm, label: e.target.value})} />
                      </div>
                   </div>
                   <button className="btn btn-primary mb-4" style={{width: '100%'}} disabled={isSubmitting} onClick={() => runAction(async () => { const r = await api.addWhitelist(whitelistForm); setWhitelistedNumbers(r.numbers || []); setWhitelistForm(initialWhitelistForm); }, "Number whitelisted.")}>Add to Whitelist</button>
                   
                   <div className="data-table-container">
                      <table className="data-table">
                         <thead>
                            <tr><th>Identity</th><th>Number</th><th>Action</th></tr>
                         </thead>
                         <tbody>
                            {whitelistedNumbers.length === 0 ? (
                               <tr><td colSpan="3" style={{textAlign: 'center'}}>Whitelist is empty.</td></tr>
                            ) : (
                               whitelistedNumbers.map(row => (
                                 <tr key={row.phoneNumber}>
                                    <td><b>{row.label || "No Label"}</b></td>
                                    <td>{row.phoneNumber}</td>
                                    <td>
                                       <button className="btn btn-danger btn-sm" onClick={() => runAction(async () => { const r = await api.removeWhitelist(row.phoneNumber); setWhitelistedNumbers(r.numbers || []); }, "Removed.")}>Delete</button>
                                    </td>
                                 </tr>
                               ))
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
