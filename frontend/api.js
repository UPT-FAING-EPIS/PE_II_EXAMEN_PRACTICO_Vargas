const Api = {
  tokenKey: "peti_auth_token",

  token() {
    return localStorage.getItem(this.tokenKey);
  },

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  },

  clearToken() {
    localStorage.removeItem(this.tokenKey);
  },

  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const token = this.token();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`/api${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Error de servidor");
    return data;
  },

  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(payload) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async me() {
    return this.request("/auth/me");
  },

  async savePeti(peti) {
    return this.request("/peti", {
      method: "PUT",
      body: JSON.stringify({ peti }),
    });
  },

  async createUser(payload) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateUser(userId, payload) {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
