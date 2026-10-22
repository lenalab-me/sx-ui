#!/bin/sh
# 共通部品のロックの本体。アプリは部品を版ごとの tarball（vendor/sx-ui-<版>.tgz）で入れ
# （package.json の "@sx/ui": "file:vendor/…"）、この検査を部品から呼ぶ（写さない）。アプリの scripts/ui-lock.sh
# （bin/app-ui-lock.sh の写し）が vendor/ を ui.lock と比べてから、tarball から取り出したこのファイルを流す:
#   sh scripts/ui-lock.sh [check]   scripts/ui-lock.sh が部品の写しと同じか、node_modules/@sx/ui が tarball と同じか、
#                                   部品のコミットが部品の外に触っていないかを見る
# node_modules/@sx/ui の中のこのファイルは流さない（検査される側なので、書き換えれば検査ごと消せる）。
# 説明は sx-ui の README。
set -eu
here=$(cd "$(dirname "$0")" && pwd)
cd "$(git rev-parse --show-toplevel)"

case "$here" in
*/node_modules/*)
	echo "node_modules/@sx/ui/bin/ui-lock.sh は流しません（node_modules は検査される側なので、tarball から取り出して流します）。" >&2
	echo "sx-ui の README の「ロックと版の入れ替え」のとおり、scripts/ui-lock.sh を置き、check の先頭と ui:approve・ui:update を" >&2
	echo "sh scripts/ui-lock.sh [check|approve|update] に替えてください。" >&2
	exit 1
	;;
esac
if [ "${1:-check}" != check ]; then
	echo "使い方: sh scripts/ui-lock.sh [check|approve|update <tgz>]（このファイルは check だけを受けます）" >&2
	exit 2
fi

failed=0

# (1) アプリの scripts/ui-lock.sh が、この版の bin/app-ui-lock.sh と同じ。ui.lock と比べるのはあちらなので、
# 書き換えると比べないまま通ってしまう。
if ! cmp -s scripts/ui-lock.sh "$here/app-ui-lock.sh"; then
	echo "scripts/ui-lock.sh が、部品の版の bin/app-ui-lock.sh と違います。手で直さず、npm run ui:update -- <tarball> で入れ直してください。" >&2
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
	if [ ! -d node_modules/@sx/ui ]; then
		echo "node_modules/@sx/ui がありません。npm ci で入れてください（worktree なら、その worktree でも）。" >&2
		failed=1
	else
		unpacked=$(mktemp -d)
		tar xzf "$tarballs" -C "$unpacked"
		# 部品の依存がアプリの依存と版で食い違うと、npm は node_modules/@sx/ui/node_modules に入れる。
		# それは部品の中身ではないので比べない。
		if ! changed=$(diff -rq -x node_modules "$unpacked/package" node_modules/@sx/ui 2>&1); then
			echo "node_modules/@sx/ui が $tarballs の中身と違います。部品は sx-ui のリポジトリで直して版を上げてください（入れ直すだけなら npm ci）:" >&2
			printf '%s\n' "$changed" | sed "s|$unpacked/package/||g; s/^/  /" >&2
			failed=1
		fi
		rm -rf "$unpacked"
	fi
fi

# (3) 部品のコミット（origin にまだ無いもの）と作業コピーは、部品のファイルだけに触る。部品のファイルは
# vendor/・packages/・ui.lock・scripts/ui-lock.sh と、版を指す package.json・package-lock.json。
# 画面も検査（scripts/check.sh・テスト・設定）も、部品と同じコミットに入れない。push 済みの履歴は見ない。
# 画面の見た目の変化は、部品のコミットとは別に撮影で確かめる。
touches_ui() {
	grep -Eq '^(vendor/|packages/|ui\.lock$|scripts/ui-lock\.sh$)'
}
outside_ui() {
	grep -Ev '^(vendor/|packages/|ui\.lock$|scripts/ui-lock\.sh$|package\.json$|package-lock\.json$)'
}
# 触ったファイルの一覧（$1）と説明（$2）を受け取って、部品とその外の両方に触っていれば表示する。
judge() {
	files=$1
	label=$2
	if printf '%s\n' "$files" | touches_ui && others=$(printf '%s\n' "$files" | grep . | outside_ui); then
		echo "${label}が、部品（vendor/・ui.lock・scripts/ui-lock.sh など）と部品の外のファイルの両方に触っています。部品と、画面・検査は別のコミットにしてください:" >&2
		printf '%s\n' "$others" | sed 's/^/  /' >&2
		failed=1
	fi
}

# 対象のコミットは、origin の既定のブランチ（origin/HEAD。無ければ origin/main・origin/master）にまだ無いもの。
# どれも無ければ全部を見るが、そのときは最初のコミット（雛形を写したもの。部品と画面の両方を含むのが
# 当たり前）は見ない。改名は削除と追加として見る（改名で src/ のパスが消えないように）。
base=
for ref in origin/HEAD origin/main origin/master; do
	if git rev-parse --verify --quiet "$ref^{commit}" >/dev/null; then
		base=$ref
		break
	fi
done
if git rev-parse --verify --quiet HEAD >/dev/null; then
	if [ -n "$base" ]; then
		commits=$(git rev-list HEAD --not "$base")
	else
		commits=$(git rev-list --min-parents=1 HEAD)
	fi
	for commit in $commits; do
		judge "$(git show --format= --name-only --no-renames "$commit")" "コミット $(git rev-parse --short "$commit")"
	done
	judge "$(
		git diff --name-only --no-renames HEAD
		git ls-files -o --exclude-standard
	)" "作業コピー"
else
	echo "まだコミットが無いので、部品と画面のコミットの分離は見ません（最初のコミットは雛形を写したものとして扱う）。" >&2
fi

if [ "$failed" -ne 0 ]; then
	exit 1
fi
echo "ui.lock は vendor/ と一致し、node_modules/@sx/ui は $tarballs と同じです"
