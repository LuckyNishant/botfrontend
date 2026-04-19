import { useEffect, useState } from "react";
import { api } from "./api";

const initialStockForm = { model: "M11", part: "screen", delta: 1 };
const initialPurchaseForm = { model: "M11", part: "screen", qty: 5, cost: 500, supplier: "" };
const initialWhitelistForm = { phoneNumber: "", label: "" };
const ADMIN_SESSION_KEY = "lucky_mobile_admin_auth";
const DEFAULT_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || "luckymobile@admin";

export default function App() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(ADMIN_SESSION_KEY) === "true"
  );
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stockForm, setStockForm] = useState(initialStockForm);
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const runAction = async (action, successText) => {
    try {
      setMessage("");
      setError("");
      await action();
      setMessage(successText);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
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
        setMessage("Notification permission granted for this browser.");
      } else {
        setMessage("Notification permission not granted.");
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
    await runAction(async () => {
      const result = await api.syncGroups();
      setAvailableGroups(result.groups || []);
    }, "WhatsApp groups synced.");
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

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="panel login-panel">
          <h1>Lucky Mobile Admin Login</h1>
          <p>Enter passcode to access control panel.</p>
          {error ? <div className="alert error">{error}</div> : null}
          <FormRow label="Admin Passcode" value={passcode} onChange={setPasscode} />
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Lucky Mobile Admin Panel</h1>
        <p>Backend: https://luckymobilebackend.onrender.com</p>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {message ? <div className="alert success">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <section className="grid cards">
        <Card title="Total Stock" value={loading ? "..." : dashboard?.totalStock ?? 0} />
        <Card title="Today Orders" value={loading ? "..." : dashboard?.todayOrders ?? 0} />
        <Card
          title="Low Stock Alerts"
          value={loading ? "..." : dashboard?.lowStockAlertCount ?? 0}
        />
      </section>

      <section className="grid quick-grid">
        <div className="panel">
          <h2>Quick Stock Update</h2>
          <FormRow
            label="Model"
            value={stockForm.model}
            onChange={(value) => setStockForm((prev) => ({ ...prev, model: value }))}
          />
          <FormRow
            label="Part"
            value={stockForm.part}
            onChange={(value) => setStockForm((prev) => ({ ...prev, part: value }))}
          />
          <FormRow
            label="Delta (+/-)"
            type="number"
            value={stockForm.delta}
            onChange={(value) =>
              setStockForm((prev) => ({ ...prev, delta: Number(value || 0) }))
            }
          />
          <button
            onClick={() =>
              runAction(() => api.updateStock(stockForm), "Inventory stock updated successfully.")
            }
          >
            Save Stock Change
          </button>
        </div>

        <div className="panel">
          <h2>WhatsApp Bot</h2>
          <FormRow
            label="Mention Trigger"
            value={mentionPrefix}
            onChange={setMentionPrefix}
          />
          <button
            onClick={() =>
              runAction(
                () => api.setMentionPrefix({ mentionPrefix }),
                `Mention trigger saved as ${mentionPrefix || "@lucky"}.`
              )
            }
          >
            Save Trigger (Example: @lucky)
          </button>
          <div className="bot-status-row">
            <span className={`status-badge ${botLink?.started ? "running" : "stopped"}`}>
              {botLink?.started ? "Connected" : botEnabled ? "Waiting for QR" : "Disabled"}
            </span>
            {botLink?.lastError ? <p className="error-text">{botLink.lastError}</p> : null}
          </div>
          <div className="button-row">
            <button
              onClick={() => runAction(() => api.toggleBot({ enabled: true }), "Bot turned on.")}
            >
              Enable Bot
            </button>
            <button
              className="danger-btn"
              onClick={() => runAction(() => api.toggleBot({ enabled: false }), "Bot turned off.")}
            >
              Disable Bot
            </button>
            <button onClick={() => runAction(() => api.getDashboard(), "Bot status refreshed.")}>
              Refresh QR
            </button>
          </div>
          {botLink?.qr ? (
            <div className="qr-wrap">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(botLink.qr)}`}
                alt="WhatsApp Web QR"
              />
              <p>Scan this QR from WhatsApp Web on your phone.</p>
            </div>
          ) : (
            <p className="helper-text">QR will appear here when WhatsApp needs linking.</p>
          )}
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Notifications</h2>
          <p className="helper-text">Permission status: {permissionState}</p>
          <button onClick={requestNotificationPermission}>Ask Notification Permission</button>
          <div className="toggle">
            <label>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              Enable Order Notifications
            </label>
          </div>
          <button
            onClick={() =>
              runAction(
                () => api.toggleNotifications({ enabled: notificationsEnabled }),
                "Notification setting updated."
              )
            }
          >
            Save Notification Setting
          </button>
        </div>

        <div className="panel">
          <h2>Purchase Entry</h2>
          <FormRow
            label="Model"
            value={purchaseForm.model}
            onChange={(value) => setPurchaseForm((prev) => ({ ...prev, model: value }))}
          />
          <FormRow
            label="Part"
            value={purchaseForm.part}
            onChange={(value) => setPurchaseForm((prev) => ({ ...prev, part: value }))}
          />
          <FormRow
            label="Qty"
            type="number"
            value={purchaseForm.qty}
            onChange={(value) => setPurchaseForm((prev) => ({ ...prev, qty: Number(value || 0) }))}
          />
          <FormRow
            label="Cost"
            type="number"
            value={purchaseForm.cost}
            onChange={(value) =>
              setPurchaseForm((prev) => ({ ...prev, cost: Number(value || 0) }))
            }
          />
          <FormRow
            label="Supplier"
            value={purchaseForm.supplier}
            onChange={(value) => setPurchaseForm((prev) => ({ ...prev, supplier: value }))}
          />
          <button
            onClick={() =>
              runAction(() => api.addPurchase(purchaseForm), "Purchase entry saved.")
            }
          >
            Add Purchase
          </button>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Group Sync + Selection</h2>
          <p className="helper-text">
            Bot reply karega sirf selected groups me jab message {mentionPrefix || "@lucky"} se start ho.
          </p>
          <div className="button-row">
            <button onClick={syncGroups}>Sync WhatsApp Groups</button>
            <button onClick={saveSelectedGroups}>Save Selected Groups</button>
          </div>
          <div className="mini-list">
            {availableGroups.length === 0 ? (
              <p>Groups not synced yet. Bot must be connected first.</p>
            ) : (
              availableGroups.map((group) => (
                <label className="group-pick-row" key={group.groupId}>
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.groupId)}
                    onChange={() => toggleSelectedGroup(group.groupId)}
                  />
                  <span>{group.groupName || "Unnamed Group"}</span>
                  <small>{group.groupId}</small>
                </label>
              ))
            )}
          </div>
          <div className="mini-list">
            <h3>Currently Active Groups</h3>
            {selectedGroups.length === 0 ? (
              <p>No group selected yet.</p>
            ) : (
              selectedGroups.map((group) => (
                <div className="mini-row" key={group.groupId}>
                  <span>{group.groupName || "Unnamed Group"}</span>
                  <span>{group.groupId}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <h2>Whitelist Numbers</h2>
          <FormRow
            label="Phone Number"
            value={whitelistForm.phoneNumber}
            onChange={(value) => setWhitelistForm((prev) => ({ ...prev, phoneNumber: value }))}
          />
          <FormRow
            label="Label"
            value={whitelistForm.label}
            onChange={(value) => setWhitelistForm((prev) => ({ ...prev, label: value }))}
          />
          <button
            onClick={() =>
              runAction(async () => {
                const result = await api.addWhitelist(whitelistForm);
                setWhitelistedNumbers(result.numbers || []);
                setWhitelistForm(initialWhitelistForm);
              }, "Whitelist number added.")
            }
          >
            Add Number
          </button>
          <div className="mini-list">
            {whitelistedNumbers.length === 0 ? (
              <p>No whitelist set. Bot allows all numbers.</p>
            ) : (
              whitelistedNumbers.map((row) => (
                <div className="mini-row" key={row.phoneNumber}>
                  <span>{row.label || "No Label"}</span>
                  <span>{row.phoneNumber}</span>
                  <button
                    className="danger-btn"
                    onClick={() =>
                      runAction(async () => {
                        const result = await api.removeWhitelist(row.phoneNumber);
                        setWhitelistedNumbers(result.numbers || []);
                      }, "Whitelist number removed.")
                    }
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Low Stock Items (&lt;= 5)</h2>
        <div className="orders">
          {(dashboard?.lowStockItems || []).length === 0 ? (
            <p>All items healthy.</p>
          ) : (
            (dashboard?.lowStockItems || []).map((item, index) => (
              <div className="order-row low-stock-row" key={`${item.model}-${item.part}-${index}`}>
                <span>{item.model}</span>
                <span>{item.part}</span>
                <span>Stock: {item.stock}</span>
                <span>Price: {item.price}</span>
                <span>{item.compatible || "-"}</span>
                <span className="low-stock-badge">LOW</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Recent Orders</h2>
        <div className="orders">
          {(dashboard?.recentOrders || []).length === 0 ? (
            <p>No recent orders found.</p>
          ) : (
            (dashboard?.recentOrders || []).map((row, index) => (
              <div className="order-row" key={`${index}-${row.join("-")}`}>
                <span>{row[0] || "-"}</span>
                <span>{row[1] || "-"}</span>
                <span>{row[2] || "-"}</span>
                <span>{row[3] || "-"}</span>
                <span>Qty: {row[4] || 0}</span>
                <span>Total: {row[6] || 0}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="panel card">
      <h3>{title}</h3>
      <p className="metric">{value}</p>
    </div>
  );
}

function FormRow({ label, value, onChange, type = "text" }) {
  return (
    <label className="form-row">
      <span>{label}</span>
      <input
        type={type === "text" && String(label).toLowerCase().includes("passcode") ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
