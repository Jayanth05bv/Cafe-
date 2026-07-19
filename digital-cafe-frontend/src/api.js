// Use proxy in dev (npm start): leave REACT_APP_API_URL unset so requests go to same origin and get proxied to backend. Or set REACT_APP_API_URL=http://localhost:8081
const API_URL = process.env.REACT_APP_API_URL || "";

export const api = {
  async login(usernameOrEmail, password) {
    let res;
    try {
      res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
    } catch (e) {
      throw new Error(
        "Cannot reach server. Is the backend running at " + API_URL + "?"
      );
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || (res.status === 401 ? "Invalid username or password" : res.status === 0 ? "Cannot reach server. Is the backend running?" : "Login failed");
      throw new Error(msg);
    }
    return res.json();
  },

  async register(username, email, password, role = "CUSTOMER") {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Registration failed");
    }
    return res.json();
  },

  async forgotPassword(email) {
    let res;
    try {
      res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || "" }),
      });
    } catch (e) {
      throw new Error("Cannot reach server. Is the backend running? (Start it with: mvn spring-boot:run in the backend folder, port 8081)");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg =
        res.status === 404
          ? "Backend not reachable. Start the backend first: open a terminal, go to the backend folder, run mvn spring-boot:run (port 8081), then try again."
          : err.message || err.error || (res.status === 400 ? "Invalid request. Check the email and try again." : "Request failed. Try again or check the backend.");
      throw new Error(msg);
    }
    return res.json();
  },

  async resetPassword(token, newPassword) {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Reset failed");
    }
    return res.json();
  },

  /** Public health check: backend + database (no auth). */
  async getHealthDb() {
    const res = await fetch(`${API_URL}/api/health/db`);
    if (!res.ok) throw new Error("Backend or database not reachable");
    return res.json();
  },

  getToken() {
    return localStorage.getItem("token");
  },

  setToken(token) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  },

  getDashboardPath(roles = []) {
    if (roles.includes("CHEF")) return "/chef";
    if (roles.includes("WAITER")) return "/waiter";
    if (roles.includes("ADMIN")) return "/admin";
    if (roles.includes("OWNER")) return "/owner";
    if (roles.includes("CUSTOMER")) return "/user";
    return "/";
  },

  authHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async authFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...this.authHeaders(), ...options.headers },
    });
    if (res.status === 401) {
      this.setToken(null);
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    return res;
  },

  async getAdminStats() {
    const res = await this.authFetch("/api/admin/stats");
    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
  },

  async getAdminUsers() {
    const res = await this.authFetch("/api/admin/users");
    if (!res.ok) throw new Error("Failed to load users");
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.content ?? data?.users ?? []);
  },

  async getAdminCafes() {
    const res = await this.authFetch("/api/admin/cafes");
    if (!res.ok) throw new Error("Failed to load cafes");
    return res.json();
  },

  async createUser(body) {
    const res = await this.authFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create user");
    }
    return res.json();
  },

  async updateUserEnabled(userId, enabled) {
    const res = await this.authFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error("Failed to update user");
    return res.json();
  },

  async updateUserCafe(userId, cafeId) {
    const res = await this.authFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ cafeId: cafeId || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to assign owner to cafe");
    }
    return res.json();
  },

  async createCafe(body) {
    const res = await this.authFetch("/api/admin/cafes", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create cafe");
    }
    return res.json();
  },

  async updateCafe(id, body) {
    const res = await this.authFetch(`/api/admin/cafes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to update cafe");
    return res.json();
  },

  async getAdminOrders() {
    const res = await this.authFetch("/api/admin/orders");
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
  },

  async purgeUserData() {
    const res = await this.authFetch("/api/admin/users/data", {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete user data");
    }
    return res.json();
  },

  async getChefOrders(cafeId) {
    const res = await this.authFetch(`/api/chef/cafes/${cafeId}/orders`);
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
  },

  async getChefMe() {
    const res = await this.authFetch("/api/chef/me");
    if (!res.ok) throw new Error("Failed to load chef profile");
    return res.json();
  },

  async updateChefMe(body) {
    const res = await this.authFetch("/api/chef/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update chef profile");
    }
    return res.json();
  },

  async updateOrderStatus(orderId, status) {
    const res = await this.authFetch(`/api/chef/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update order");
    return res.json();
  },

  async updateWaiterOrderStatus(orderId, status) {
    const res = await this.authFetch(`/api/waiter/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update order");
    return res.json();
  },

  async getWaiterMe() {
    const res = await this.authFetch("/api/waiter/me");
    if (!res.ok) throw new Error("Failed to load waiter profile");
    return res.json();
  },

  async updateWaiterMe(body) {
    const res = await this.authFetch("/api/waiter/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update waiter profile");
    }
    return res.json();
  },

  async getWaiterOrders(cafeId) {
    const res = await this.authFetch(`/api/waiter/cafes/${cafeId}/orders`);
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
  },

  async getWaiterTables(cafeId) {
    const res = await this.authFetch(`/api/waiter/cafes/${cafeId}/tables`);
    if (!res.ok) throw new Error("Failed to load tables");
    return res.json();
  },

  async getOwnerMe() {
    const res = await this.authFetch("/api/owner/me");
    if (!res.ok) throw new Error("Failed to load current owner");
    return res.json();
  },

  async updateOwnerMe(body) {
    const res = await this.authFetch("/api/owner/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update owner profile");
    }
    return res.json();
  },

  async updateOwnerPassword(body) {
    const res = await this.authFetch("/api/owner/me/password", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update password");
    }
    return res.json();
  },

  async logoutOwnerAllDevices() {
    const res = await this.authFetch("/api/owner/me/logout-all", {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to logout from all devices");
    }
    return res.json();
  },

  async acceptOwnerAssignment() {
    const res = await this.authFetch("/api/owner/accept-assignment", {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to accept assignment");
    }
    return res.json();
  },

  async getOwnerCafe(id) {
    const res = await this.authFetch(`/api/owner/cafes/${id}`);
    if (!res.ok) throw new Error("Failed to load cafe");
    return res.json();
  },

  async updateOwnerCafe(id, body) {
    const res = await this.authFetch(`/api/owner/cafes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update cafe");
    }
    return res.json();
  },

  async getOwnerTables(cafeId) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/tables`);
    if (!res.ok) throw new Error("Failed to load tables");
    return res.json();
  },

  async getOwnerMenu(cafeId) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/menu`);
    if (!res.ok) throw new Error("Failed to load menu");
    return res.json();
  },

  async getOwnerOrders(cafeId) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/orders`);
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
  },

  async getOwnerOrder(orderId) {
    const res = await this.authFetch(`/api/owner/orders/${orderId}`);
    if (!res.ok) throw new Error("Failed to load order details");
    return res.json();
  },

  async createOwnerStaff(body) {
    const res = await this.authFetch("/api/owner/staff", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create staff");
    }
    return res.json();
  },

  async getOwnerStaff(cafeId) {
    const res = await this.authFetch(`/api/owner/staff?cafeId=${encodeURIComponent(cafeId)}`);
    if (!res.ok) throw new Error("Failed to load staff");
    return res.json();
  },

  async updateOwnerStaff(staffId, body) {
    const res = await this.authFetch(`/api/owner/staff/${staffId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update staff");
    }
    return res.json();
  },

  async addOwnerTable(cafeId, body) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/tables`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to add table");
    }
    return res.json();
  },

  async deleteOwnerTable(cafeId, tableId) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/tables/${tableId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete table");
    }
    return res.json();
  },

  async updateOwnerTable(cafeId, tableId, body) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/tables/${tableId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update table");
    }
    return res.json();
  },

  async addOwnerMenuItem(cafeId, body) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/menu`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to add menu item");
    }
    return res.json();
  },

  async uploadOwnerMenuImages(files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/owner/uploads/menu-images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.status === 401) {
      this.setToken(null);
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload images");
    }
    return res.json();
  },

  async uploadOwnerProfileImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/owner/uploads/profile-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.status === 401) {
      this.setToken(null);
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload profile image");
    }
    return res.json();
  },

  async updateOwnerMenuItem(cafeId, menuId, body) {
    const res = await this.authFetch(`/api/owner/cafes/${cafeId}/menu/${menuId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update menu item");
    }
    return res.json();
  },

  async getCustomerMyOrders() {
    const res = await this.authFetch("/api/customer/my-orders");
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
  },

  async getCustomerMe() {
    const res = await this.authFetch("/api/customer/me");
    if (!res.ok) throw new Error("Failed to load profile");
    return res.json();
  },

  async updateCustomerMe(body) {
    const res = await this.authFetch("/api/customer/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update profile");
    }
    return res.json();
  },

  async getCustomerCafes() {
    const res = await fetch(`${API_URL}/api/customer/cafes`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load cafes");
    return res.json();
  },

  async getCustomerMenu(cafeId) {
    const res = await fetch(`${API_URL}/api/customer/cafes/${cafeId}/menu`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load menu");
    return res.json();
  },

  async getCustomerTables(cafeId) {
    const res = await fetch(`${API_URL}/api/customer/cafes/${cafeId}/tables`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load tables");
    return res.json();
  },

  async placeOrder(cafeId, items, options = {}) {
    const {
      tableId = null,
      reservationDate = null,
      reservationTimeSlot = null,
      guestCount = null,
      seatingPreference = null,
      seatingNotes = null,
    } = options || {};
    const body = {
      cafeId,
      tableId: tableId || undefined,
      reservationDate: reservationDate || undefined,
      reservationTimeSlot: reservationTimeSlot || undefined,
      guestCount: guestCount || undefined,
      seatingPreference: seatingPreference || undefined,
      seatingNotes: seatingNotes || undefined,
      items: items.map(({ menuId, quantity, specialInstructions }) => ({
        menuId,
        quantity: quantity || 1,
        specialInstructions: specialInstructions || undefined,
      })),
    };
    const res = await this.authFetch("/api/customer/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to place order");
    }
    return res.json();
  },

  async payCustomerOrder(orderId) {
    const res = await this.authFetch(`/api/customer/orders/${orderId}/pay`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to mark order as paid");
    }
    return res.json();
  },

  async createRazorpayOrder(orderId) {
    const res = await this.authFetch(`/api/customer/orders/${orderId}/payment/razorpay-order`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create Razorpay order");
    }
    return res.json();
  },

  async verifyRazorpayPayment(orderId, body) {
    const res = await this.authFetch(`/api/customer/orders/${orderId}/payment/verify`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to verify Razorpay payment");
    }
    return res.json();
  },

  async cancelCustomerOrder(orderId) {
    const res = await this.authFetch(`/api/customer/orders/${orderId}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to cancel order");
    }
    return res.json();
  },
};
