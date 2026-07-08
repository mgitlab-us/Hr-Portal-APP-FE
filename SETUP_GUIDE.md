# Setup Guide: React Native Mobile Application (`Hr-Portal-App-FE`)

This guide explains how to set up and run the `Hr-Portal-App-FE` repository on a new Windows PC. It outlines how to prevent the 3-4 most common Windows development blockers: **Windows Max Path Limitation**, **Ninja/CMake native compilation errors**, and **React 19/Expo 55 legacy peer dependency conflicts**.

---

## 🛠️ Step 1: Prerequisite Environment Setup

Make sure the following development tools are installed and configured on the new PC:

1. **Node.js (LTS v20)**: Download and install Node.js v20. Matching the runtime version prevents native package rebuild failures.
2. **Java Development Kit (JDK 17)**: React Native / Expo v55 requires JDK 17.
   - Install JDK 17 (e.g., Eclipse Temurin or Microsoft OpenJDK).
   - Set the System Environment Variable: `JAVA_HOME` pointing to your JDK installation path.
3. **Android Studio & SDK**:
   - Install Android Studio.
   - Open SDK Manager and install **Android SDK Platform 34/35**, **Android SDK Command-line Tools**, and **Android SDK Build-Tools**.
   - Create a virtual device (emulator).
   - Configure Environment Variables:
     - `ANDROID_HOME` pointing to `C:\Users\<Your-Username>\AppData\Local\Android\Sdk`.
     - Add `%ANDROID_HOME%\platform-tools` to your system `PATH`.

---

## 📂 Step 2: Resolve Windows "Path Too Long" Errors

Windows has a historic path limit of 260 characters (`MAX_PATH`). This causes checkout and build failures due to deeply nested paths inside `node_modules` and CMake build cache directories (`.cxx`).

To resolve this on the new PC:

### 1. Enable Long Paths in Windows (Registry)
Open a **PowerShell terminal as Administrator** and run:
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### 2. Configure Git to Support Long Paths
In any terminal, run:
```bash
git config --global core.longpaths true
```

### 3. Keep the Project Folder Path Short
Clone the repository into a short directory path (e.g., `C:\Projects\Hr-portal` or `D:\Hr-portal`) rather than burying it deep inside user folders.

---

## ⚡ Step 3: Install Ninja 1.12+ (Fix CMake & Reanimated Native Builds)

Libraries like `react-native-reanimated` compile C++ native code via CMake during execution. On Windows, default SDK Ninja compilers fail because of path length limitations during native build steps. 

We resolve this by downloading **Ninja 1.12+** and using our custom Expo configuration plugin `./plugins/withNinjaLongPaths.js` to set `-DCMAKE_OBJECT_PATH_MAX=1024`.

To install Ninja:
1. Open a PowerShell terminal.
2. Navigate to the `Hr-Portal-App-FE` directory.
3. Run the installation script:
   ```powershell
   powershell -File .\tools\install-ninja.ps1
   ```
4. This script downloads Ninja 1.12.1 from GitHub, extracts it as `tools/ninja.exe`, and validates the installation.

Our configuration in `app.json` will automatically detect `tools/ninja.exe` on Windows and resolve native build path limitations.

---

## 📦 Step 4: Resolve Peer Dependency Conflicts

This repository uses React 19 alongside specific compatible expo plugins, which triggers peer dependency warnings on older npm versions because of strict peer audits.

1. We have configured a `.npmrc` file in the root of `Hr-Portal-App-FE` containing:
   ```npmrc
   package-manager=npm
   legacy-peer-deps=true
   ```
2. **On the new PC, always use `npm` to install packages.**
3. Navigate to the `Hr-Portal-App-FE` folder and run:
   ```bash
   npm install
   ```
   *Npm will automatically inherit the `.npmrc` config and successfully install packages without crashing on peer conflicts.*

---

## 🚀 Step 5: Run the App

Once everything is installed:

1. **Start the Expo Development Server**:
   ```bash
   npm run start
   ```
2. **Run on Android Emulator / Physical Device**:
   - Ensure an emulator is running or a device is connected via USB debugging.
   - In another terminal, run:
     ```bash
     npm run android
     ```
