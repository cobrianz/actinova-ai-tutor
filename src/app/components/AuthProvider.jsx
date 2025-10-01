// components/AuthProvider.jsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch user on initial load
  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      setUser(data.user);
      if (data.user) {
        sessionStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.removeItem('user');
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      sessionStorage.removeItem('user');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      } else {
        // Refresh failed, user needs to login again
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
      setUser(null);
      return false;
    }
  }, []);

  // Initial user fetch
  useEffect(() => {
    // Only fetch if no user in sessionStorage
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  // Auto refresh token
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const success = await refreshToken();
      if (!success) {
        clearInterval(interval);
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // Redirect after login if on an auth page
  useEffect(() => {
    if (!loading && user && pathname.startsWith("/auth")) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      return {
        success: true,
        message: data.message,
        requiresVerification: data.requiresVerification,
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      sessionStorage.removeItem('user');
      setError(null);
      router.push("/");
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (token, password, confirmPassword) => {
    try {
      setError(null);
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      setError(null);
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify email");
      }

      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const setUserData = (userData) => {
    setUser(userData);
    setLoading(false);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        refreshToken,
        setUserData,
        fetchUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
