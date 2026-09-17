/**
 * Security Guard & Anti-Reverse-Engineering Shield
 * 
 * Provides client-side defense layers:
 * 1. Anti-Inspection: Prevents context menu view-source & devtools hotkeys (F12, Ctrl+Shift+I/J/C/U/S)
 * 2. Anti-Scraping: Prevents unauthorized bulk image drag-and-drop / asset ripping
 * 3. Anti-Tamper & Anti-Cloning Console Shield
 * 4. Source Protection Notice & Watermark Integrity
 */

interface SecurityGuardOptions {
  enableHotkeyShield?: boolean;
  enableContextMenuShield?: boolean;
  enableAntiDrag?: boolean;
  enableConsoleWatermark?: boolean;
}

let isInitialized = false;

export function initSecurityGuard(options: SecurityGuardOptions = {}) {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  const {
    enableHotkeyShield = true,
    enableContextMenuShield = true,
    enableAntiDrag = true,
    enableConsoleWatermark = true,
  } = options;

  // 1. Console Shield & Warning to Intruders / Clopers
  if (enableConsoleWatermark) {
    try {
      const bannerStyle = "color: #DC143C; font-size: 20px; font-weight: 900; text-shadow: 1px 1px 2px black;";
      const subStyle = "color: #003893; font-size: 13px; font-weight: bold;";
      const warnStyle = "color: #D97706; font-size: 12px; font-weight: 600;";
      
      console.log("%c⛔ PHOTO BUCKET NEPAL - SECURITY SHIELD ACTIVE", bannerStyle);
      console.log("%c🇳🇵 Proprietary Intellectual Property of Chautari Systems Nepal.", subStyle);
      console.log(
        "%c⚠️ WARNING: Copying, decompiling, automated scraping, or unauthorized rebuilding of this codebase is strictly prohibited and monitored.",
        warnStyle
      );
    } catch {}
  }

  // 2. Keyboard Devtools & Source Extraction Shortcuts Interceptor
  if (enableHotkeyShield) {
    window.addEventListener(
      "keydown",
      (e: KeyboardEvent) => {
        // Allow normal typing inside input, textarea, or contentEditable
        const target = e.target as HTMLElement | null;
        const isInputField =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);

        // F12 key (DevTools)
        if (e.key === "F12") {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+Shift+I or Cmd+Option+I (Inspect)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+Shift+J or Cmd+Option+J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+Shift+C or Cmd+Option+C (Element Inspector)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c")) {
          if (!isInputField) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }

        // Ctrl+U or Cmd+U (View Page Source)
        if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+S or Cmd+S (Save Complete Webpage / Clone HTML)
        if ((e.ctrlKey || e.metaKey) && (e.key === "S" || e.key === "s") && !isInputField) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      },
      { capture: true }
    );
  }

  // 3. Context Menu Right-Click Shield (Permits inputs, blocks raw asset ripping)
  if (enableContextMenuShield) {
    window.addEventListener(
      "contextmenu",
      (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Allow right-click inside normal editable input/textarea for copy/paste convenience
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        // For images or app UI elements, prevent inspect/save-as menu
        if (
          target.tagName === "IMG" ||
          target.tagName === "VIDEO" ||
          target.closest(".protected-asset") ||
          target.closest("#root")
        ) {
          e.preventDefault();
          return false;
        }
      },
      { capture: true }
    );
  }

  // 4. Anti-Asset Drag & Ghost Image Ripping
  if (enableAntiDrag) {
    window.addEventListener(
      "dragstart",
      (e: DragEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "IMG" || target.tagName === "VIDEO")) {
          // Allow internal file drag upload but prevent dragging feed images out to desktop
          if (!target.closest(".allow-drag")) {
            e.preventDefault();
          }
        }
      },
      { capture: true }
    );
  }
}
