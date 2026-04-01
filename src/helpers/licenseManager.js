const { ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const LICENSE_API_URL = "https://neato-dictate-web.vercel.app/api/license";
const SUPABASE_URL = "https://djrgoduukyqarozqyxbu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcmdvZHV1a3lxYXJvenF5eGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODQzODksImV4cCI6MjA5MDU2MDM4OX0.H6yqcj2KAr5bXqj82q9Kp0qbwxPEC6PcsLuccwm8hQA";

// Cache license data locally
const LICENSE_CACHE_FILE = "license-cache.json";

class LicenseManager {
  constructor(app) {
    this.app = app;
    this.license = null;
    this.cachePath = path.join(app.getPath("userData"), LICENSE_CACHE_FILE);
    this._loadCache();
  }

  _loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = JSON.parse(fs.readFileSync(this.cachePath, "utf8"));
        // Cache valid for 24 hours
        if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          this.license = data;
          return;
        }
      }
    } catch {
      // ignore cache errors
    }
    this.license = null;
  }

  _saveCache(data) {
    try {
      fs.writeFileSync(
        this.cachePath,
        JSON.stringify({ ...data, timestamp: Date.now() }),
        "utf8"
      );
    } catch {
      // ignore
    }
  }

  _clearCache() {
    try {
      if (fs.existsSync(this.cachePath)) fs.unlinkSync(this.cachePath);
    } catch {
      // ignore
    }
    this.license = null;
  }

  getTokenPath() {
    return path.join(this.app.getPath("userData"), "auth-token.json");
  }

  getSavedToken() {
    try {
      const tokenPath = this.getTokenPath();
      if (fs.existsSync(tokenPath)) {
        return JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      }
    } catch {
      // ignore
    }
    return null;
  }

  saveToken(tokenData) {
    try {
      fs.writeFileSync(this.getTokenPath(), JSON.stringify(tokenData), "utf8");
    } catch {
      // ignore
    }
  }

  clearToken() {
    try {
      const tokenPath = this.getTokenPath();
      if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
    } catch {
      // ignore
    }
  }

  async verifyLicense(accessToken) {
    try {
      const res = await fetch(LICENSE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!res.ok) {
        console.log("[LicenseManager] License check failed:", res.status);
        return null;
      }

      const data = await res.json();
      if (data.valid) {
        this.license = data;
        this._saveCache(data);
        return data;
      }

      return null;
    } catch (error) {
      console.error("[LicenseManager] License check error:", error.message);
      // Fall back to cache if network fails
      if (this.license) {
        console.log("[LicenseManager] Using cached license");
        return this.license;
      }
      return null;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (data.access_token) {
        this.saveToken({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        });
        return data;
      }

      return null;
    } catch {
      return null;
    }
  }

  async checkAndRefresh() {
    const saved = this.getSavedToken();
    if (!saved) return null;

    let accessToken = saved.access_token;

    // Refresh if expired or about to expire (5 min buffer)
    if (saved.expires_at && Date.now() > saved.expires_at - 5 * 60 * 1000) {
      const refreshed = await this.refreshToken(saved.refresh_token);
      if (refreshed) {
        accessToken = refreshed.access_token;
      } else {
        this.clearToken();
        this._clearCache();
        return null;
      }
    }

    return this.verifyLicense(accessToken);
  }

  getPlan() {
    return this.license?.plan || "free";
  }

  getLimits() {
    return (
      this.license?.limits || {
        wordsPerWeek: 2000,
        meetingHoursPerMonth: 5,
        cloudTranscription: false,
        agentMode: false,
        prioritySupport: false,
      }
    );
  }

  getUser() {
    return this.license?.user || null;
  }

  isSignedIn() {
    return this.license?.valid === true;
  }

  registerIpcHandlers() {
    ipcMain.handle("license-get-status", async () => {
      const license = await this.checkAndRefresh();
      return {
        signedIn: !!license,
        plan: this.getPlan(),
        limits: this.getLimits(),
        user: this.getUser(),
      };
    });

    ipcMain.handle("license-sign-in", async (_event, email, password) => {
      try {
        // Authenticate directly with Supabase via API
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ email, password }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return {
            success: false,
            error: err.error_description || err.msg || "Invalid email or password",
          };
        }

        const data = await res.json();

        if (!data.access_token) {
          return { success: false, error: "No access token received" };
        }

        // Save token
        this.saveToken({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        });

        // Verify license / subscription
        await this.verifyLicense(data.access_token);

        return {
          success: true,
          plan: this.getPlan(),
          limits: this.getLimits(),
          user: this.getUser(),
        };
      } catch (error) {
        console.error("[LicenseManager] Sign in error:", error);
        return { success: false, error: "Connection failed. Check your internet." };
      }
    });

    ipcMain.handle("license-sign-out", async () => {
      this.clearToken();
      this._clearCache();
      return { success: true };
    });

    ipcMain.handle("license-reset-password", async (_event, email) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.msg || "Failed to send reset email" };
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: "Connection failed" };
      }
    });

    ipcMain.handle("license-get-plan", () => {
      return this.getPlan();
    });

    ipcMain.handle("license-get-limits", () => {
      return this.getLimits();
    });

    ipcMain.handle("license-is-feature-allowed", (_event, feature) => {
      const limits = this.getLimits();
      switch (feature) {
        case "cloudTranscription":
          return limits.cloudTranscription === true;
        case "agentMode":
          return limits.agentMode === true;
        case "unlimitedWords":
          return limits.wordsPerWeek === -1;
        case "unlimitedMeetings":
          return limits.meetingHoursPerMonth === -1;
        default:
          return true;
      }
    });
  }
}

module.exports = LicenseManager;
