import { useEffect, useState } from "react";
import { api } from "./api";

const initialStockForm = { model: "M11", part: "screen", delta: 1 };
const initialPurchaseForm = {
  model: "M11",
  part: "screen",
  qty: 5,
  cost: 500,
  supplier: "Default Supplier"
};
const initialGroupForm = { groupId: "", groupName: "" };
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
  const [deviceToken, setDeviceToken] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [botEnabled, setBotEnabled] = useState(true);
  const [botStarted, setBotStarted] = useState(false);
  const [groupForm, setGroupForm] = useState(initialGroupForm);
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
      setWhitelistedNumbers(data.whitelistedNumbers || []);
      setBotEnabled(Boolean(data.botEnabled));
      setBotStarted(Boolean(data.botStarted));
      setNotificationsEnabled(Boolean(data.notificationsEnabled));
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

      <section className="grid">
        <div className="panel">
          <h2>Inventory Stock +/-</h2>
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
            Update Stock
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
            Save Purchase
          </button>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>FCM Notification Settings</h2>
          <FormRow label="Device Token" value={deviceToken} onChange={setDeviceToken} />
          <button
            onClick={() =>
              runAction(
                () => api.saveDeviceToken({ token: deviceToken }),
                "Admin device token saved."
              )
            }
          >
            Save Device Token
          </button>

          <div className="toggle">
            <label>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              Enable Notifications
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
            Update Notification Setting
          </button>
        </div>

        <div className="panel">
          <h2>Bot Control</h2>
          <div className="bot-status-row">
            <span className={`status-badge ${botStarted ? "running" : "stopped"}`}>
              {botStarted ? "Running" : botEnabled ? "Enabled, starting..." : "Stopped"}
            </span>
            <span className="status-text">
              {botEnabled
                ? "Bot is allowed to run on the backend."
                : "Bot is disabled from admin panel."}
            </span>
          </div>
          <div className="button-row">
            <button
              disabled={botEnabled && botStarted}
              onClick={() =>
                runAction(() => api.toggleBot({ enabled: true }), "Bot started from admin panel.")
              }
            >
              Run Bot
            </button>
            <button
              className="danger-btn"
              disabled={!botEnabled && !botStarted}
              onClick={() =>
                runAction(() => api.toggleBot({ enabled: false }), "Bot stopped from admin panel.")
              }
            >
              Stop Bot
            </button>
          </div>
          <p className="helper-text">
            Laptop ya server sleep/off hone par bot waise bhi ruk jayega. Ye control sirf running
            backend process ko start/stop karta hai.
          </p>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Allowed WhatsApp Groups</h2>
          <FormRow
            label="Group ID"
            value={groupForm.groupId}
            onChange={(value) => setGroupForm((prev) => ({ ...prev, groupId: value }))}
          />
          <FormRow
            label="Group Name"
            value={groupForm.groupName}
            onChange={(value) => setGroupForm((prev) => ({ ...prev, groupName: value }))}
          />
          <button
            onClick={() =>
              runAction(async () => {
                const result = await api.addGroup(groupForm);
                setSelectedGroups(result.groups || []);
                setGroupForm(initialGroupForm);
              }, "Group added for bot messaging.")
            }
          >
            Add Group
          </button>
          <div className="mini-list">
            {selectedGroups.length === 0 ? (
              <p>No groups selected. Bot will allow all groups.</p>
            ) : (
              selectedGroups.map((group) => (
                <div className="mini-row" key={group.groupId}>
                  <span>{group.groupName || "Unnamed Group"}</span>
                  <span>{group.groupId}</span>
                  <button
                    className="danger-btn"
                    onClick={() =>
                      runAction(async () => {
                        const result = await api.removeGroup(group.groupId);
                        setSelectedGroups(result.groups || []);
                      }, "Group removed.")
                    }
                  >
                    Remove
                  </button>
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
