# SecureFirst Update Notes (May 2026)

This document outlines all the critical updates, fixes, and standardization tasks completed to ensure a seamless experience for both administrators and mobile users.

## 📱 Mobile App: Resilient Downloads & Native Viewing

We completely overhauled the policy document downloading flow on Android to bypass restrictive permission issues common in Expo Go and Android 13+.

*   **Bypassed `AUDIO` Permission Crash**: Removed reliance on aggressive media library permissions that were crashing the application in Expo Go.
*   **Silent Folder Saving**: The app now attempts to directly save files to a native `SecureFirst` album in the background.
*   **Native Intent Launcher**: Implemented `expo-intent-launcher`. Clicking "Open" on a downloaded policy now uses a direct native Android intent (`ACTION_VIEW`) to open the file in the device's default PDF viewer or Image gallery immediately.
*   **Graceful Fallbacks**: If the automated save is restricted by the OS, the app presents an "Open" prompt that invokes the native Share Sheet as a foolproof fallback, guaranteeing the user always receives their file.

## 💻 Admin Dashboard: UI Standardization

The sales lead management interface has been polished to match the robust functionality of the policy dashboard.

*   **Unified Action Menus**: Replaced cluttered inline buttons with a clean, standardized **3-dot dropdown menu** on the Sales Leads table.
*   **Full CRUD Integration**:
    *   **Issue Policy**: Instantly migrate a lead to a formal policy.
    *   **Edit Lead**: Modify client information, vehicle details, and statuses.
    *   **Delete Lead**: Cleanly remove invalid or completed leads with a confirmation prompt.
*   **TypeScript Fixes**: Resolved all compilation warnings and unused variable errors to ensure a clean, stable production build.

## 🌐 Server & Deployment

All code has been synced across the entire ecosystem.

*   **Live Backend**: Deployed updated API endpoints (Leads & Policies CRUD) to the production EC2 server (`api.securefirst.co`).
*   **Live Admin Panel**: Compiled the React Vite build and deployed it directly to Nginx (`admin.securefirst.co`).
*   **Version Control**: All fixes have been pushed to the remote `main` branch on GitHub.

> [!TIP]
> The current mobile APK is building. Once the Gradle build finishes, it will be available for direct installation on Android devices, fully disconnected from the Metro server.
