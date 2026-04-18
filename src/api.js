const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://luckymobilebackend.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }
  return data;
}

export const api = {
  getDashboard: () => request("/admin/dashboard"),
  updateStock: (payload) =>
    request("/admin/inventory/update-stock", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addPurchase: (payload) =>
    request("/admin/purchase/add", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  saveDeviceToken: (payload) =>
    request("/admin/notifications/device-token", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  toggleNotifications: (payload) =>
    request("/admin/notifications/toggle", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  toggleBot: (payload) =>
    request("/admin/bot/toggle", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getGroups: () => request("/admin/bot/groups"),
  addGroup: (payload) =>
    request("/admin/bot/groups", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  removeGroup: (groupId) =>
    request(`/admin/bot/groups/${encodeURIComponent(groupId)}`, {
      method: "DELETE"
    }),
  getWhitelist: () => request("/admin/bot/whitelist"),
  addWhitelist: (payload) =>
    request("/admin/bot/whitelist", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  removeWhitelist: (phoneNumber) =>
    request(`/admin/bot/whitelist/${encodeURIComponent(phoneNumber)}`, {
      method: "DELETE"
    })
};
