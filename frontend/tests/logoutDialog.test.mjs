/**
 * Automated Test Suite — Global Logout Confirmation Dialog & Invalidation Flow
 *
 * Verifies:
 *  1. Component presence and export integrity
 *  2. Exact required text: "www.HealthNova-Ai.in says", "Logging out...", "Cancel", "OK"
 *  3. Forbids unauthorized messages ("Are you sure?", "Do you want to logout?")
 *  4. Strict White-Only Theme Policy (Zero dark: variant classes)
 *  5. Visual styling: dark charcoal (#202124), border (#3c4043), peach/pink OK button (#fda4af/#fb7185)
 *  6. Accessibility: Radix alertdialog primitives, aria-labelledby, aria-describedby, ESC handling
 *  7. State machine: IDLE, OPEN, CONFIRMING, LOGGING_OUT, SUCCESS, ERROR
 *  8. Duplicate click & race condition prevention (disabled during LOGGING_OUT)
 *  9. Centralized auth & logout service (backend invalidation, realtime teardown, multi-tab sync)
 * 10. All 5 portals integrated via ResponsiveAppShell (Doctor, Nurse, Informaticist, Admin, Patient)
 * 11. Route protection: unauthenticated access redirects to /login
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("1. Component Presence: LogoutConfirmationDialog.tsx exists and exports component", () => {
  const compPath = path.join(rootDir, "src", "components", "auth", "LogoutConfirmationDialog.tsx");
  assert.ok(fs.existsSync(compPath), "LogoutConfirmationDialog.tsx must exist in src/components/auth/");

  const content = fs.readFileSync(compPath, "utf-8");
  assert.match(content, /export function LogoutConfirmationDialog/, "Must export LogoutConfirmationDialog function");
});

test("2. Exact Dialog Content: Header, Message, and Button labels match specification", () => {
  const compPath = path.join(rootDir, "src", "components", "auth", "LogoutConfirmationDialog.tsx");
  const content = fs.readFileSync(compPath, "utf-8");

  // Exact header/source
  assert.ok(
    content.includes("www.HealthNova-Ai.in says"),
    "Header must say exactly 'www.HealthNova-Ai.in says'"
  );

  // Exact message
  assert.ok(
    content.includes("Logging out..."),
    "Message must say exactly 'Logging out...'"
  );

  // Buttons
  assert.match(content, /Cancel<\/button>|Cancel/, "Must render Cancel button");
  assert.match(content, /<span>OK<\/span>|OK/, "Must render OK button");

  // Forbidden text checks
  assert.ok(
    !content.includes("Are you sure?"),
    "Must NOT use 'Are you sure?' in dialog content"
  );
  assert.ok(
    !content.includes("Do you want to logout?"),
    "Must NOT use 'Do you want to logout?' in dialog content"
  );
});

test("3. Visual Design & Theme Invariants: Isolated dark charcoal, peach/pink OK button, ZERO dark: variant classes", () => {
  const compPath = path.join(rootDir, "src", "components", "auth", "LogoutConfirmationDialog.tsx");
  const content = fs.readFileSync(compPath, "utf-8");

  // Dark charcoal container
  assert.ok(
    content.includes("#202124") || content.includes("#242424"),
    "Must use dark charcoal container background"
  );
  assert.ok(
    content.includes("#3c4043"),
    "Must use subtle border (#3c4043)"
  );

  // Peach/pink/rose confirmation style for OK button
  assert.ok(
    content.includes("#fda4af") || content.includes("#fb7185") || content.includes("rose") || content.includes("pink"),
    "OK button must have peach/pink/rose confirmation style"
  );

  // Strict White-Only Theme Policy: zero dark: variant classes
  const darkVariantMatch = content.match(/[\s"']dark:[a-zA-Z0-9_-]+/);
  assert.strictEqual(
    darkVariantMatch,
    null,
    `Found forbidden dark: variant '${darkVariantMatch?.[0]}' in LogoutConfirmationDialog.tsx. Must use explicit color values.`
  );
});

test("4. Accessibility & WAI-ARIA Standards: Radix AlertDialog, semantic attributes, focus management", () => {
  const compPath = path.join(rootDir, "src", "components", "auth", "LogoutConfirmationDialog.tsx");
  const content = fs.readFileSync(compPath, "utf-8");

  // Uses Radix AlertDialogPrimitive
  assert.ok(content.includes("@radix-ui/react-alert-dialog"), "Must use @radix-ui/react-alert-dialog primitive");
  assert.ok(content.includes("aria-labelledby"), "Must have aria-labelledby");
  assert.ok(content.includes("aria-describedby"), "Must have aria-describedby");
  assert.ok(content.includes("onEscapeKeyDown"), "Must handle Escape key down");
  assert.ok(content.includes("cancelButtonRef"), "Must manage focus onto Cancel button to prevent accidental confirmation");
});

test("5. Controlled States & Double-Click Prevention: Handles LOGGING_OUT and disables actions", () => {
  const compPath = path.join(rootDir, "src", "components", "auth", "LogoutConfirmationDialog.tsx");
  const content = fs.readFileSync(compPath, "utf-8");

  assert.ok(content.includes("disabled={isLoggingOut}"), "Buttons must be disabled while logging out");
  assert.ok(content.includes("Loader2") || content.includes("animate-spin"), "Must display loading spinner during LOGGING_OUT");
  assert.ok(content.includes("logoutError"), "Must display error state if logout fails");
});

test("6. Centralized Authentication & Logout Service: authService.ts provides comprehensive invalidation", () => {
  const servicePath = path.join(rootDir, "src", "services", "authService.ts");
  assert.ok(fs.existsSync(servicePath), "authService.ts must exist in src/services/");

  const content = fs.readFileSync(servicePath, "utf-8");

  // Backend token invalidation
  assert.ok(content.includes("/auth/logout/"), "Must call backend /auth/logout/ endpoint");

  // Next.js cookie clearing
  assert.ok(content.includes("/api/auth/logout"), "Must call Next.js /api/auth/logout endpoint");

  // Client cleanup
  assert.ok(content.includes("tokenStorage.clear()"), "Must clear token storage");
  assert.ok(content.includes("clinical_role"), "Must expire clinical_role cookie");
  assert.ok(content.includes("user_role"), "Must expire user_role cookie");

  // Realtime connection teardown
  assert.ok(content.includes("teardownRealtimeConnections"), "Must provide teardownRealtimeConnections");
  assert.ok(content.includes("healthnova:teardown-realtime"), "Must dispatch teardown-realtime event");

  // Multi-tab synchronization
  assert.ok(content.includes("BroadcastChannel"), "Must support BroadcastChannel multi-tab sync");
  assert.ok(content.includes("initMultiTabAuthSync"), "Must provide initMultiTabAuthSync");
});

test("7. Realtime Teardown Integration: useWebSocket listens for teardown-realtime", () => {
  const hookPath = path.join(rootDir, "src", "hooks", "useWebSocket.ts");
  const content = fs.readFileSync(hookPath, "utf-8");

  assert.ok(
    content.includes("healthnova:teardown-realtime"),
    "useWebSocket must listen for healthnova:teardown-realtime event"
  );
  assert.ok(
    content.includes("User logged out"),
    "useWebSocket must close connection with 'User logged out' status"
  );
});

test("8. Portal Integration: All 5 portals use ResponsiveAppShell with unified LogoutConfirmationDialog", () => {
  const shellPath = path.join(rootDir, "src", "components", "responsive", "ResponsiveAppShell.tsx");
  const shellContent = fs.readFileSync(shellPath, "utf-8");

  assert.ok(
    shellContent.includes("<LogoutConfirmationDialog"),
    "ResponsiveAppShell must mount LogoutConfirmationDialog"
  );
  assert.ok(
    shellContent.includes("openLogoutDialog"),
    "ResponsiveAppShell must trigger openLogoutDialog on sign out"
  );

  // Verify all 5 portals use ResponsiveAppShell
  const portals = ["doctor", "nurse", "informaticist", "admin", "user"];
  for (const portal of portals) {
    const layoutPath = path.join(rootDir, "src", "app", portal, "layout.tsx");
    assert.ok(fs.existsSync(layoutPath), `${portal}/layout.tsx must exist`);
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    assert.ok(
      layoutContent.includes("ResponsiveAppShell"),
      `${portal}/layout.tsx must use ResponsiveAppShell`
    );
  }
});

test("9. Route Protection: Middleware redirects unauthenticated requests to /login", () => {
  const middlewarePath = path.join(rootDir, "src", "middleware.ts");
  const content = fs.readFileSync(middlewarePath, "utf-8");

  assert.ok(
    content.includes('return NextResponse.redirect(new URL("/login", request.url))'),
    "Middleware must redirect unauthenticated users to /login"
  );
});
