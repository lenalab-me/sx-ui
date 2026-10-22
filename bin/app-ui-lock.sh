#!/bin/sh
# 共通部品（@sx/ui）のロックの起動。アプリの scripts/ui-lock.sh に置く写しで、npm run ui:update が
# 新しい版のものに入れ替える（手で直さない。写しが部品の版のものと違うと検査が止まる）。
# 検査の本体（bin/ui-lock.sh）は node_modules からではなく vendor/ の tarball から取り出して流す。
# node_modules/@sx/ui は検査される側なので、そこにあるスクリプトを書き換えれば検査ごと消せてしまう。
# tarball そのものは、取り出す前にここで ui.lock と比べる。使い方（アプリのどこからでも）:
#   sh scripts/ui-lock.sh [check]        npm run check の先頭で流す
#   sh scripts/ui-lock.sh approve        今の vendor/ のハッシュを ui.lock に書く（npm run ui:approve。利用者の承認を得てから）
#   sh scripts/ui-lock.sh update <tgz>   別の版に入れ替える（npm run ui:update -- <tgz>。その版の bin/ui-update.sh を流す）
# 説明は sx-ui の README の「ロックと版の入れ替え」。
set -eu

mode=${1:-check}
if [ "$mode" = update ]; then
	if [ $# -ne 2 ] || [ ! -f "$2" ]; then
		echo "使い方: npm run ui:update -- <sx-ui-<版>.tgz のパス>" >&2
		exit 2
	fi
	new=$(cd "$(dirname "$2")" && pwd)/$(basename "$2")
fi
cd "$(git rev-parse --show-toplevel)"

sha256() {
	if command -v shasum >/dev/null 2>&1; then
		shasum -a 256
	else
		sha256sum
	fi
}
# vendor/ の追跡ファイルと、未追跡で無視されていないファイルを、パス順に並べる。
ui_files() {
	{
		git ls-files -z vendor
		git ls-files -z -o --exclude-standard vendor
	} | tr '\0' '\n' | LC_ALL=C sort -u
}
# 作業コピーの内容のハッシュ。パスと内容の両方を入れる（改名・削除でも変わる）。
ui_hash() {
	ui_files | while IFS= read -r file; do
		[ -f "$file" ] || continue
		printf '%s  %s\n' "$(sha256 <"$file" | cut -d' ' -f1)" "$file"
	done | sha256 | cut -d' ' -f1
}
# tarball の bin/ を一時の場所に取り出し、その中のスクリプト（$2）を残りの引数で流す。
run_from() {
	dir=$(mktemp -d)
	trap 'rm -rf "$dir"' EXIT
	tar xzf "$1" -C "$dir" package/bin
	script=$2
	shift 2
	sh "$dir/package/bin/$script" "$@"
}

case "$mode" in
approve)
	ui_hash >ui.lock
	echo "ui.lock を更新しました（$(cat ui.lock)）。vendor/・ui.lock・scripts/ui-lock.sh・package.json・package-lock.json だけを、部品のコミットにしてください。"
	;;
update)
	run_from "$new" ui-update.sh "$new"
	;;
check)
	want=$(cat ui.lock 2>/dev/null || true)
	got=$(ui_hash)
	if [ "$want" != "$got" ]; then
		echo "vendor/ が ui.lock と違います。部品の版を変えたら、利用者の承認を得て \`npm run ui:approve\` を実行し、部品だけのコミットにしてください。" >&2
		echo "  ui.lock: ${want:-（なし）}" >&2
		echo "  いまの値: $got" >&2
		exit 1
	fi
	set -- vendor/sx-ui-*.tgz
	if [ $# -ne 1 ] || [ ! -f "$1" ]; then
		echo "vendor/ に sx-ui の tarball がちょうど1つあるはずです: $*" >&2
		exit 1
	fi
	run_from "$1" ui-lock.sh check
	;;
*)
	echo "使い方: sh scripts/ui-lock.sh [check|approve|update <tgz>]" >&2
	exit 2
	;;
esac
