#!/bin/sh
# 共通部品のロック。アプリは部品を版ごとの tarball（vendor/sx-ui-<版>.tgz）で入れ
# （package.json の "@sx/ui": "file:vendor/…"）、この検査を部品から呼ぶ（写さない）。使い方（アプリのどこからでも）:
#   sh node_modules/@sx/ui/bin/ui-lock.sh [check]   vendor/ のハッシュが ui.lock と同じか、node_modules/@sx/ui が
#                                                   tarball と同じか、部品のコミットが画面に触っていないかを見る
#   sh node_modules/@sx/ui/bin/ui-lock.sh approve   今の vendor/ のハッシュを ui.lock に書く（利用者の承認を得てから）
# アプリは npm run check の先頭で check を動かし、npm run ui:approve で approve を呼ぶ。説明は sx-ui の README。
set -eu
cd "$(git rev-parse --show-toplevel)"

mode=${1:-check}
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

case "$mode" in
approve)
	ui_hash >ui.lock
	echo "ui.lock を更新しました（$(cat ui.lock)）。vendor/・package.json・package-lock.json・ui.lock を、画面（src/・e2e/）に触らない部品だけのコミットにしてください。"
	exit 0
	;;
check) ;;
*)
	echo "使い方: sh node_modules/@sx/ui/bin/ui-lock.sh [check|approve]" >&2
	exit 2
	;;
esac

failed=0

# (1) vendor/ が ui.lock と同じか。
want=$(cat ui.lock 2>/dev/null || true)
got=$(ui_hash)
if [ "$want" != "$got" ]; then
	echo "vendor/ が ui.lock と違います。部品の版を変えたら、利用者の承認を得て \`npm run ui:approve\` を実行し、部品だけのコミットにしてください。" >&2
	echo "  ui.lock: ${want:-（なし）}" >&2
	echo "  いまの値: $got" >&2
	failed=1
fi

# (2) vendor/ の tarball は1つで、package.json の @sx/ui がそれを指し、node_modules/@sx/ui が
# その中身と同じ。node_modules の部品を直接書き換えても、画面には効くのにどこにも残らないので止める
# （部品は sx-ui のリポジトリで直して版を上げる）。
tarballs=$(ls vendor/sx-ui-*.tgz 2>/dev/null || true)
if [ "$(printf '%s' "$tarballs" | grep -c .)" -ne 1 ]; then
	echo "vendor/ に sx-ui の tarball がちょうど1つあるはずです: ${tarballs:-（なし）}" >&2
	failed=1
else
	pinned=$(node -p 'require("./package.json").dependencies["@sx/ui"]')
	if [ "$pinned" != "file:$tarballs" ]; then
		echo "package.json の @sx/ui（$pinned）が $tarballs を指していません。npm run ui:update -- <tarball> で入れ直してください。" >&2
		failed=1
	fi
	unpacked=$(mktemp -d)
	tar xzf "$tarballs" -C "$unpacked"
	if ! changed=$(diff -rq "$unpacked/package" node_modules/@sx/ui 2>&1); then
		echo "node_modules/@sx/ui が $tarballs の中身と違います。部品は sx-ui のリポジトリで直して版を上げてください（入れ直すだけなら npm ci）:" >&2
		printf '%s\n' "$changed" | sed "s|$unpacked/package/||g; s/^/  /" >&2
		failed=1
	fi
	rm -rf "$unpacked"
fi

# (3) 部品（vendor/・packages/）に触るコミット（origin/main にまだ無いもの）と作業コピーは、画面側
# （src/・e2e/・playwright.config.ts・index.html）に触らない。push 済みの履歴は見ない。
# 画面の見た目の変化は、部品のコミットとは別に撮影で確かめる。
touches_ui() {
	grep -Eq '^(vendor|packages)/'
}
touches_screen() {
	grep -E '^(src/|e2e/|playwright\.config\.ts$|index\.html$)'
}
# 部品と画面に同時に触るファイル一覧（$1 = 説明）を受け取って、違反なら表示する。
judge() {
	files=$1
	label=$2
	if printf '%s\n' "$files" | touches_ui && screen=$(printf '%s\n' "$files" | touches_screen); then
		echo "${label}が部品（vendor/・packages/）と画面側のファイルの両方に触っています。部品と画面は別のコミットにしてください:" >&2
		printf '%s\n' "$screen" | sed 's/^/  /' >&2
		failed=1
	fi
}

# 対象のコミットは、origin/main にまだ無いもの（origin/main が無ければ全部）。最初のコミット（雛形を写した
# もの）は部品と画面の両方を含むのが当たり前なので見ない。
if git rev-parse --verify --quiet HEAD >/dev/null; then
	if git rev-parse --verify --quiet origin/main >/dev/null; then
		commits=$(git rev-list --min-parents=1 HEAD --not origin/main)
	else
		commits=$(git rev-list --min-parents=1 HEAD)
	fi
	for commit in $commits; do
		judge "$(git show --format= --name-only "$commit")" "コミット $(git rev-parse --short "$commit")"
	done
	judge "$(
		git diff --name-only HEAD
		git ls-files -o --exclude-standard
	)" "作業コピー"
else
	echo "まだコミットが無いので、部品と画面のコミットの分離は見ません（最初のコミットは雛形を写したものとして扱う）。" >&2
fi

if [ "$failed" -ne 0 ]; then
	exit 1
fi
echo "ui.lock は vendor/ と一致し、node_modules/@sx/ui は $tarballs と同じです"
