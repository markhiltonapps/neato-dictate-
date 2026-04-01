import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "../stores/settingsStore";

interface LicenseUser {
  id: string;
  email: string;
  full_name: string;
}

interface LicenseLimits {
  wordsPerWeek: number;
  meetingHoursPerMonth: number;
  cloudTranscription: boolean;
  agentMode: boolean;
  prioritySupport: boolean;
}

interface LicenseStatus {
  signedIn: boolean;
  plan: string;
  limits: LicenseLimits;
  user: LicenseUser | null;
}

const DEFAULT_LIMITS: LicenseLimits = {
  wordsPerWeek: 2000,
  meetingHoursPerMonth: 5,
  cloudTranscription: false,
  agentMode: false,
  prioritySupport: false,
};

export function useLicense() {
  const [status, setStatus] = useState<LicenseStatus>({
    signedIn: false,
    plan: "free",
    limits: DEFAULT_LIMITS,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const syncSignedIn = useSettingsStore((s) => s.setIsSignedIn);

  const refresh = useCallback(async () => {
    try {
      const result = await window.electronAPI.licenseGetStatus();
      setStatus(result);
      syncSignedIn(result.signedIn);
    } catch (err) {
      console.error("[useLicense] Failed to get status:", err);
    }
    setIsLoading(false);
  }, [syncSignedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await window.electronAPI.licenseSignIn(email, password);
      if (result.success) {
        setStatus({
          signedIn: true,
          plan: result.plan,
          limits: result.limits,
          user: result.user,
        });
        syncSignedIn(true);
      }
      return result;
    } catch (err) {
      console.error("[useLicense] Sign in failed:", err);
      return { success: false, error: "Sign in failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await window.electronAPI.licenseSignOut();
      setStatus({
        signedIn: false,
        plan: "free",
        limits: DEFAULT_LIMITS,
        user: null,
      });
      syncSignedIn(false);
    } catch (err) {
      console.error("[useLicense] Sign out failed:", err);
    }
  }, []);

  const isFeatureAllowed = useCallback(
    (feature: string) => {
      switch (feature) {
        case "cloudTranscription":
          return status.limits.cloudTranscription;
        case "agentMode":
          return status.limits.agentMode;
        case "unlimitedWords":
          return status.limits.wordsPerWeek === -1;
        case "unlimitedMeetings":
          return status.limits.meetingHoursPerMonth === -1;
        default:
          return true;
      }
    },
    [status.limits]
  );

  const isPro = status.plan === "pro" || status.plan === "business" || status.plan === "enterprise";

  return {
    ...status,
    isPro,
    isLoading,
    signIn,
    signOut,
    refresh,
    isFeatureAllowed,
  };
}
