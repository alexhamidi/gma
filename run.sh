#!/bin/bash
set -e

# === Config ===
SCHEME="gma"       # Change to your scheme name
SIM_NAME="test"    # Exact name from `xcrun simctl list devices`
CONFIGURATION="Debug"

# === Find Simulator ID by exact match ===
SIM_ID=$(xcrun simctl list devices | grep -E "^[[:space:]]+$SIM_NAME " | grep -oE '\([A-F0-9-]{36}\)' | tr -d '()' | head -n 1)
if [ -z "$SIM_ID" ]; then
  echo "Simulator '$SIM_NAME' not found!"
  exit 1
fi

echo "Using simulator: $SIM_NAME ($SIM_ID)"

# === Boot Simulator ===
open -a Simulator >/dev/null 2>&1
xcrun simctl boot "$SIM_ID" 2>/dev/null || true

# === Build ===
xcodebuild \
  -scheme "$SCHEME" \
  -sdk iphonesimulator \
  -configuration "$CONFIGURATION" \
  -destination "id=$SIM_ID" \
  -derivedDataPath build \
  build

# === Find .app path ===
APP=$(find build -type d -name "${SCHEME}.app" -print -quit)
if [ -z "$APP" ]; then
  echo "Built app not found!"
  exit 1
fi

# === Get bundle ID ===
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print:CFBundleIdentifier' "$APP/Info.plist")

# === Install & Launch ===
xcrun simctl install "$SIM_ID" "$APP"
xcrun simctl launch "$SIM_ID" "$BUNDLE_ID"
