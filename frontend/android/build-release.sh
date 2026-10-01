#!/usr/bin/env bash
# Compila l'app Android firmata per Google Play (AAB) dentro un container Docker.
#
#   frontend/android/build-release.sh /percorso/cartella-chiavi
#
# La cartella chiavi contiene upload-keystore.jks e keystore.properties
# (storeFile=/chiavi/upload-keystore.jks, storePassword, keyAlias, keyPassword).
# Risultato: frontend/android/app/build/outputs/bundle/release/app-release.aab
set -euo pipefail

CHIAVI="${1:?Indica la cartella con keystore e keystore.properties}"
ANDROID_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(dirname "$ANDROID_DIR")"
REPO_DIR="$(dirname "$FRONTEND_DIR")"
CACHE="${HOME}/.android-build"
mkdir -p "$CACHE/gradle"

echo "▶ Build web (configurazione capacitor) e sync Android (Node 22, richiesto da Capacitor 8)"
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/home \
  -v "$REPO_DIR:/work" -w /work/frontend \
  node:22-bookworm-slim \
  sh -c 'npx ng build --configuration capacitor && npx cap sync android'

echo "▶ Immagine Docker di build"
docker build -q -t santeligio-android-build -f "$ANDROID_DIR/build.Dockerfile" "$ANDROID_DIR"

echo "▶ Gradle bundleRelease"
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/home -e GRADLE_USER_HOME=/gradle \
  -e SANTELIGIO_KEYSTORE_PROPERTIES=/chiavi/keystore.properties \
  -v "$REPO_DIR:/work" \
  -v "$CACHE/gradle:/gradle" \
  -v "$(cd "$CHIAVI" && pwd):/chiavi:ro" \
  santeligio-android-build \
  ./gradlew --no-daemon bundleRelease

ls -la "$ANDROID_DIR/app/build/outputs/bundle/release/"
