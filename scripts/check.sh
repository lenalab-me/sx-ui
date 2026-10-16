#!/bin/sh
# Every check to run before a commit: formatting, the tests (the parts' catalogue and how the parts
# and the gallery are written, with the checks' own tests), the types, and that the checks build for
# the package (dist/check and dist/vite, what `@sx/ui/check` and `@sx/ui/vite` give to the apps).
set -eu
cd "$(dirname "$0")/.."
npx prettier --check src gallery check vite audit test e2e playwright.config.ts
shellcheck bin/*.sh scripts/*.sh
npm test
npx tsc --noEmit
npx tsc --noEmit -p e2e
rm -rf dist && npx tsc -p tsconfig.check.json
echo "すべてのチェックが通りました"
