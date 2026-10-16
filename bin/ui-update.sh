#!/bin/sh
# Takes another version of the shared parts into an app: puts its tarball in vendor/ in place of the
# old one and installs it. Make the tarball in the sx-ui repository with `npm run release`.
# Usage (from anywhere in the app): sh node_modules/@sx/ui/bin/ui-update.sh <path of sx-ui-<version>.tgz>
#   (npm run ui:update -- <path>)
# Then npm run check and npm run e2e, and with the user's approval npm run ui:approve; commit vendor/,
# package.json, package-lock.json and ui.lock without the screens (sx-ui's README).
set -eu
# npm install replaces this very file (it is in node_modules/@sx/ui), so run from a copy.
if [ -z "${SX_UI_UPDATE_COPY:-}" ]; then
	copy=$(mktemp)
	cp "$0" "$copy"
	SX_UI_UPDATE_COPY=$copy exec sh "$copy" "$@"
fi
trap 'rm -f "$SX_UI_UPDATE_COPY"' EXIT
if [ $# -ne 1 ] || [ ! -f "$1" ]; then
	echo "使い方: npm run ui:update -- <sx-ui-<版>.tgz のパス>（sx-ui のリポジトリで npm run release で作る）" >&2
	exit 2
fi
tarball=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
cd "$(git rev-parse --show-toplevel)"
name=$(basename "$tarball")
case "$name" in
sx-ui-*.tgz) ;;
*)
	echo "$name は sx-ui の tarball（sx-ui-<版>.tgz）ではありません。" >&2
	exit 2
	;;
esac
mkdir -p vendor
for old in vendor/sx-ui-*.tgz; do
	if [ -e "$old" ] && [ "$old" != "vendor/$name" ]; then
		rm -f "$old"
	fi
done
cp "$tarball" "vendor/$name"
npm install --no-audit --no-fund "./vendor/$name"
echo "vendor/$name を入れました。npm run check と npm run e2e で画面を確かめ、利用者の承認を得て npm run ui:approve を実行してください。"
