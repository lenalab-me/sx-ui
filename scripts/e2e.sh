#!/bin/sh
# Runs the Playwright E2E tests (playwright.config.ts starts Vite itself).
# On a failure it says how to rerun only the failed tests, where the agent fixing them reads it.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
status=0
npx playwright test "$@" || status=$?
if [ "$status" -ne 0 ]; then
	echo "失敗した分だけ流し直す: npm run e2e -- --last-failed（直ったら最後に全件を1回）" >&2
fi
exit "$status"
