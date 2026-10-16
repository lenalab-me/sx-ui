#!/bin/sh
# Packs the version in package.json for the apps, after the checks, from a clean checkout:
# writes sx-ui-<version>.tgz here and tags the commit v<version>. An app takes it with its
# own update script (in network-designer: sh scripts/ui-update.sh <path of the .tgz>).
# Usage: npm run release (raise "version" in package.json and commit first)
set -eu
cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
	echo "コミットしていない変更があります。コミットしてから実行してください。" >&2
	exit 1
fi
version=$(node -p 'require("./package.json").version')
if git rev-parse -q --verify "refs/tags/v$version" >/dev/null &&
	[ "$(git rev-parse "v$version^{commit}")" != "$(git rev-parse HEAD)" ]; then
	echo "v$version は別のコミットに付いています。package.json の version を上げてください。" >&2
	exit 1
fi
sh scripts/check.sh
npm pack --silent >/dev/null
git rev-parse -q --verify "refs/tags/v$version" >/dev/null || git tag -a "v$version" -m "v$version"
echo "$(pwd)/sx-ui-${version}.tgz を作りました（タグ v${version}）。"
