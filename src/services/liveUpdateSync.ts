/**
 * Photo Bucket Nepal - Multi-Platform Live Update & Synchronization Engine
 * 
 * Guarantees that any updates made to the live website (photobucket.com.np)
 * are immediately and automatically synchronized across:
 *  - Web Browsers (Chrome, Safari, Firefox, Edge)
 *  - iOS Installed App (Home Screen PWA / WebClip)
 *  - Android Installed App (Chrome WebAPK / PWA / Standalone App)
 *  - Windows Installed App (Edge / Chrome PWA / Desktop App)
 */

import { api } from "./api";
import { realtime } from "./api";

export interface LiveSyncState {
  isLiveSynced: boolean;
  lastSyncTimestamp: number;
  serverBuildId: string;
  serverVersion: string;
  isUpdateAvailable: boolean;
  platform: "ios" | "android" | "windows" | "web";
  isStandalone: boolean;
}

type SyncListener = (state: LiveSyncState) => void;

class LiveUpdateSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private state: LiveSyncState = {
    isLiveSynced: true,
    lastSyncTimestamp: Date.now(),
    serverBuildId: "",
    serverVersion: "2.5.0",
    isUpdateAvailable: false,
    platform: "web",
    isStandalone: false,
  };

  private swRegistration: ServiceWorkerRegistration | null = null;
  private pollInterval: any = null;
  private isInitialized = false;

  constructor() {
    this.detectPlatformAndEnvironment();
  }

  private detectPlatformAndEnvironment() {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent.toLowerCase();
    let platform: "ios" | "android" | "windows" | "web" = "web";

    if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      platform = "ios";
    } else if (/android/.test(ua)) {
      platform = "android";
    } else if (/windows/.test(ua)) {
      platform = "windows";
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    this.state = {
      ...this.state,
      platform,
      isStandalone,
    };
  }

  public init(onDataRefreshNeeded?: () => void) {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    // 1. Service Worker Live Registration & Auto-Update
    this.registerAndWatchServiceWorker(onDataRefreshNeeded);

    // 2. Real-time WebSocket Live Sync Listeners
    this.setupRealtimeListeners(onDataRefreshNeeded);

    // 3. Lifecycle & App Resume Synchronization (iOS, Android, Windows)
    this.setupLifecycleSync(onDataRefreshNeeded);

    // 4. Initial Server Version Probe
    this.checkServerVersion(onDataRefreshNeeded);

    // 5. Periodic Polling fallback (Every 45s)
    this.pollInterval = setInterval(() => {
      this.checkServerVersion(onDataRefreshNeeded);
      this.checkForSWUpdates();
    }, 45000);
  }

  private registerAndWatchServiceWorker(onDataRefreshNeeded?: () => void) {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        this.swRegistration = registration;
        console.log("[LiveSync] Service Worker registered with scope:", registration.scope);

        // Check for updates on install/reload
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available; force skipWaiting
                console.log("[LiveSync] New update available in Service Worker. Activating...");
                installingWorker.postMessage({ type: "SKIP_WAITING" });
                this.updateState({ isUpdateAvailable: true });
              } else {
                console.log("[LiveSync] Service Worker installed and ready for offline caching.");
              }
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[LiveSync] SW Registration failed:", err);
      });

    // When the new Service Worker takes control, trigger refresh or data sync
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[LiveSync] Active Service Worker controller changed. Live reloading new bundle...");
      this.updateState({
        isLiveSynced: true,
        lastSyncTimestamp: Date.now(),
        isUpdateAvailable: false,
      });
      onDataRefreshNeeded?.();
    });

    // Listen to messages from Service Worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_ACTIVATED") {
        console.log("[LiveSync] New SW Activated:", event.data.version);
        this.updateState({
          isLiveSynced: true,
          lastSyncTimestamp: Date.now(),
          serverVersion: event.data.version || this.state.serverVersion,
        });
        onDataRefreshNeeded?.();
      }
    });
  }

  private setupRealtimeListeners(onDataRefreshNeeded?: () => void) {
    // Realtime live mutation broadcast from server
    realtime.subscribe("system:live_mutation", (payload: any) => {
      console.log("[LiveSync] Server broadcast live mutation:", payload);
      this.updateState({
        isLiveSynced: true,
        lastSyncTimestamp: Date.now(),
        serverBuildId: payload.buildId || this.state.serverBuildId,
      });
      onDataRefreshNeeded?.();
    });

    realtime.subscribe("system:sync_trigger", () => {
      this.forceSync(onDataRefreshNeeded);
    });
  }

  private setupLifecycleSync(onDataRefreshNeeded?: () => void) {
    if (typeof window === "undefined") return;

    // When user switches back to the app on iOS, Android or Windows, sync immediately!
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("[LiveSync] App regained focus/visibility. Checking for live updates...");
        this.checkForSWUpdates();
        this.checkServerVersion(onDataRefreshNeeded);
        onDataRefreshNeeded?.();
      }
    });

    window.addEventListener("focus", () => {
      this.checkForSWUpdates();
      this.checkServerVersion(onDataRefreshNeeded);
    });

    // When connectivity comes back online
    window.addEventListener("online", () => {
      console.log("[LiveSync] Network reconnected. Synchronizing latest state...");
      this.forceSync(onDataRefreshNeeded);
    });
  }

  public checkForSWUpdates() {
    if (this.swRegistration) {
      this.swRegistration.update().catch(() => {});
    }
  }

  public async checkServerVersion(onDataRefreshNeeded?: () => void) {
    try {
      const res = await api.getSystemVersion();
      if (res && res.success) {
        const hasBuildChanged =
          this.state.serverBuildId &&
          res.buildId &&
          this.state.serverBuildId !== res.buildId;

        this.updateState({
          isLiveSynced: true,
          lastSyncTimestamp: Date.now(),
          serverBuildId: res.buildId,
          serverVersion: res.version || this.state.serverVersion,
        });

        if (hasBuildChanged) {
          console.log("[LiveSync] New server build detected:", res.buildId);
          this.checkForSWUpdates();
          onDataRefreshNeeded?.();
        }
      }
    } catch {
      // Ignore network errors in background poll
    }
  }

  public async forceSync(onDataRefreshNeeded?: () => void) {
    this.checkForSWUpdates();
    await this.checkServerVersion(onDataRefreshNeeded);
    onDataRefreshNeeded?.();
    try {
      await api.triggerLiveSync({
        reason: "client_manual_sync",
        scope: this.state.platform,
      });
    } catch {}
  }

  public getState(): LiveSyncState {
    return { ...this.state };
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<LiveSyncState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public destroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.listeners.clear();
  }
}

export const liveUpdateSync = new LiveUpdateSyncManager();
