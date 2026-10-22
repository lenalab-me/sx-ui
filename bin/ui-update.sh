#!/bin/sh
# Takes another version of the shared parts into an app: puts its tarball in vendor/ in place of the
# old one, installs it, and puts that version's lock launcher (bin/app-ui-lock.sh) at scripts/ui-lock.sh.
# Make the tarball in the sx-ui repository with `npm run release`.
# Usage (from anywhere in the app): npm run ui:update -- <path of sx-ui-<version>.tgz>
#   (sh scripts/ui-lock.sh update <path>, which runs this file from inside the new tarball)
# Then npm run check and npm run e2e, and with the user's approval npm run ui:approve; commit vendor/,
# package.json, package-lock.json, ui.lock and scripts/ui-lock.sh without the screens (sx-ui's README).
set -eu
# npm install may replace this very file (when it runs from node_modules/@sx/ui), so run from a copy.
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
mkdir -p vendor scripts
if [ "$tarball" != "$(pwd)/vendor/$name" ]; then
	cp "$tarball" "vendor/$name"
fi
# 入れ終わってから古い版を消す（入れるのに失敗したら、新しい版を消して前のままにする）。
if ! npm install --no-audit --no-fund "./vendor/$name"; then
	set -- vendor/sx-ui-*.tgz
	if [ $# -gt 1 ]; then
		rm -f "vendor/$name"
	fi
	echo "vendor/$name を入れられませんでした。vendor/ は前のままです。" >&2
	exit 1
fi
for old in vendor/sx-ui-*.tgz; do
	if [ "$old" != "vendor/$name" ]; then
		rm -f "$old"
	fi
done
tar xzOf "vendor/$name" package/bin/app-ui-lock.sh >scripts/ui-lock.sh
npm pkg set "scripts.ui:approve=sh scripts/ui-lock.sh approve" "scripts.ui:update=sh scripts/ui-lock.sh update"
echo "vendor/$name と scripts/ui-lock.sh を入れました。npm run check と npm run e2e で画面を確かめ、利用者の承認を得て npm run ui:approve を実行してください。"
