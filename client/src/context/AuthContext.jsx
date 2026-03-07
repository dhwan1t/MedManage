import { createContext, useState } from "react";

const AuthContext = createContext();

function getInitialToken() {
  const storedToken = localStorage.getItem("token");
  if (storedToken && storedToken.split(".").length === 3) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          return storedToken;
        }
      } catch {
        // invalid JSON
      }
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return null;
}

function getInitialUser() {
  const storedToken = localStorage.getItem("token");
  if (storedToken && storedToken.split(".").length === 3) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          return parsed;
        }
      } catch {
        // invalid JSON
      }
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return null;
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(getInitialUser);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  /**
   * Helper to build fetch headers with Authorization.
   * Usage: fetch(url, { headers: authHeaders() })
   * Or:    fetch(url, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: ... })
   */
  const authHeaders = (extra = {}) => {
    const headers = { ...extra };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const isAuthenticated = !!token && !!user;
  const loading = false;

  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        authHeaders,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider };
export default AuthContext;
