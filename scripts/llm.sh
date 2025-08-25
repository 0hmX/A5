#!/usr/bin/env bash
set -euo pipefail

OUT="project_report.txt"
exec > >(tee "$OUT") 2>&1

section() { printf "\n===== %s =====\n" "$*"; }

section "System versions"
uname -a || true
node -v || true
npm -v || true
pnpm -v || true
yarn -v || true
npx expo --version || expo --version || true
java -version 2>&1 || true
ruby --version || true
pod --version || true

section "Repo root info"
pwd
ls -la

section "Git status (if git repo)"
git rev-parse --show-toplevel 2>/dev/null || true
git status -sb 2>/dev/null || true
git remote -v 2>/dev/null || true

section "package.json (root)"
sed -n '1,300p' package.json 2>/dev/null || true

section "Expo config (resolved)"
npx expo config --json 2>/dev/null || true

section "Other root configs (if present)"
for f in app.json app.config.js app.config.ts tsconfig.json babel.config.js babel.config.ts metro.config.js expo-env.d.ts pnpm-workspace.yaml; do
  [ -f "$f" ] && { echo "--- $f ---"; sed -n '1,200p' "$f"; }
done

section "Project tree (top-level, depth=3)"
# Exclude heavy dirs
tree -L 3 -I 'node_modules|.git|.expo|dist|build|.next|android/build|ios/Pods|.gradle' . 2>/dev/null || true

section "Local Expo modules overview"
ls -la modules 2>/dev/null || true
for m in modules/*; do
  [ -d "$m" ] || continue
  section "Module: $m"
  [ -f "$m/expo-module.config.json" ] && { echo ">>> $m/expo
