# sx-ui（`@sx/ui`）

画面の共通部品（React 19＋Tailwind v4）と、それを使うアプリの画面ファイルを検査する道具。全部品を全状態で並べた見本ページ（`gallery/`）が部品の台帳を兼ねる。network-designer の `packages/ui`（`@nd/ui`）から履歴ごと切り出した（2026-10-17）。新しいアプリの画面は、この部品で組むのが既定。

## アプリでの使い方

- **入れ方**：版ごとの tarball（`npm run release` で作る `sx-ui-<版>.tgz`）をアプリの `vendor/` に置き、`"@sx/ui": "file:vendor/sx-ui-<版>.tgz"` で入れる。レジストリも認証も要らず、Docker のビルドでもそのまま入る。peer は `react`・`react-dom` 19 と `tailwindcss` 4（Vite なら `@tailwindcss/vite` も）。アイコン（`lucide-react`）とフォントは部品が持つので、アプリは入れない。
- **CSS**：アプリの CSS の入口を1つ作り、部品の CSS を読んで画面のファイルを走査させる（部品の CSS が走査するのは部品と見本ページだけ）。
  ```css
  @import "@sx/ui/styles.css";
  @source "./";
  ```
- **Vite**：`vite.config.mjs` に部品のプラグインを足す（`import { sxUi } from "@sx/ui/vite";`、`plugins: [tailwindcss(), sxUi()]`）。部品は TSX のソースのまま node_modules に入り、Vite の esbuild は node_modules の中の tsconfig を読まないので、プラグインが JSX を automatic runtime にし、見本ページ用に React を事前の束ねに入れる。足さないと画面が白くなる（`React is not defined`）。
- **TypeScript**：部品は TS のソースのまま配り、Vite が変換する（ビルドの手順は無い）。アプリの tsconfig は `jsx: "react-jsx"`・`moduleResolution: "bundler"`・`allowImportingTsExtensions: true`。
- **入口**：アプリが読めるのは `@sx/ui`（部品）・`@sx/ui/styles.css`（CSS）・`@sx/ui/check`（検査の道具。テストだけが読む）・`@sx/ui/vite`（Vite のプラグイン。`vite.config.mjs` だけが読む）の4つだけで、`@sx/ui/src/...` のような深い import はしない。
- **検査**：`@sx/ui/check` の `scan`（文字列リテラルの取り出し）・`disallowedWords`（配置のクラスの許可リスト `allowedLayout` に無い語）・`colorPattern`・`rolePattern`・`stripCssComments`・`lineOf` で、画面ファイルが配置のクラスしか書かず、色・`role="alert"`／`"status"`・`style=` を書かないことをテストする（network-designer の `src/screen-style.test.ts` が例）。許可リストはこのリポジトリでだけ直す。
- **見本ページ**：アプリの開発サーバーで `/node_modules/@sx/ui/gallery/` を開くと、入れている版の部品が出る。
- **node_modules の部品は直接直さない**：直すのはこのリポジトリで、版を上げて入れ直す。network-designer は `node_modules/@sx/ui` が tarball の中身と違うと check で止まる（`scripts/ui-lock.sh`）。

## 版を出す

1. 直して `npm run check` を通し、コミットする。
2. `package.json` の `version` を上げてコミットする（0.x のあいだ、引数の名前を変える・部品を消すなど画面を直す必要がある変更は minor、それ以外は patch。画面の直し方はコミットの文に書く）。
3. `npm run release`：check を流し、`sx-ui-<版>.tgz` を作り、タグ `v<版>` を付ける。`git push --follow-tags`。
4. アプリで取り込む（network-designer は `npm run ui:update -- <tgz のパス>` のあと、check・e2e・承認・`npm run ui:approve`）。

## 開発

`npm install` のあと `npm run dev` で `/gallery/` を開く。`npm run check` が整形・テスト（台帳と書き方）・型・検査の道具のビルドを見る。

## CSS とトークン

`styles.css` の `@source` は部品（`src`）と見本ページ（`gallery`）だけを走査する。画面のファイルは、アプリの CSS の入口が自分で `@source` に足す（上の「アプリでの使い方」）。

## 部品の書き方

- 見た目は `tone`・`variant`・`size`（`sm`・`md`・`lg`）のような意味の指定で受ける。`className` を受けるのは配置のためだけで、`Field`・`Card`・`Button`／`ButtonLink`・`Input`／`Select`／`Textarea`／`NumberInput`・`Checkbox` に限る。ほかの部品は受けない（表のセルの寄せ・折り返しは `Th`／`Td` の `align`・`numeric`・`nowrap`・`truncate`）。
- アイコンは名前（`IconName`）で渡す。アイコンのライブラリを import するのはこのパッケージだけで、画面は `lucide-react` を import しない。
- 色・角丸・影はトークンの名前（`bg-sx-accent`・`rounded-sx-control` など）だけで書き、`#` の色の直書きは `tokens.css` の外に置かない。文字サイズも `text-[16px]` のような任意値でなく名前つきのトークンを使う。
- 読み上げ（`role="alert"`・`"status"`）は部品が持つ。画面は `Notice` に `live`（出た瞬間に読み上げる。`error`・`warn` は alert、`info`・`ok` は status）、`SaveStatus` に `live` を渡すだけで、role を書かない。
- 開いたら重なって出る部品（`Menu` の一覧、`anchor` つきの `Popover`）は、HTML の popover（`popover="manual"` と `showPopover()`）で最前面の層に出し、置き方は CSS anchor positioning（押したボタンの下、`Menu` は右端・`Popover` は `align` に揃え、下に収まらなければ上）にする。表の枠（`overflow`）にもモーダル（`<dialog>`）の中にも切られない。モーダルの中で開いた `Menu`・`Popover` は、Esc で自分だけを閉じ（`preventDefault` で `<dialog>` の閉じる要求を止める）、モーダルは次の Esc で閉じる。`anchor` の無い `Popover` は、呼び出し側の `relative` の枠の中に置く。置き方と最前面の出し方は `src/topLayer.ts` の1か所に持つ。
- 画面ごとの形を持つ部品の引数は次のとおり（見本ページの `use` が正）。`PageTitle` の `subtitle` は h1 の右に出す画面の対象（Project名など）。`CardHead` は `Card` の上端の帯で、下罫線の上に下線タブ（`Tabs variant="underline"`）を置き、`note` は右寄せの案内文。`EmptyState` の `support` は2行目の小さい文。`DescriptionList` は `{ term, value }` の並びを2列で見せる（STEP1の値のように、ここでは直せない項目の表示）。`Field` の `inline` はラベル左・部品右の1行（機種ごとの台数の欄）。`Modal` の `size` は `sm`・`md`・`lg`（760px。5つのタブを持つ申込など）。`StatusLine` の `tone="neutral"` はアイコン無しの控えめな表示（「読み込み中…」）。
- 作図は `DiagramFrame`（枠。React Flow はこの中に置く）・`DiagramDevice`（機器の箱）・`DiagramPort`（箱の中のポート。React Flow の `Handle` を中身として渡す）・`DiagramRouteError`（配線できない印と理由）で見た目を持ち、`@xyflow/react` はこのパッケージが読まない。箱とポートの寸法は `diagramGeometry` の1か所で、整列の見積もり（network-designer の `src/Physical.tsx`）も同じ値を読む。作図の中（`[data-diagram]`）の機器名・ポート番号は 14px 未満でもよい（コントラストは見る。network-designer の `e2e/contrast-audit.ts`）。ポートを置く段（上・下・右端）は配線の向きで決まるので、呼び出し側が並べて渡す。
- 論理接続図（L3 の見取り図）は `LadderDiagram`（はしご図）で描く。縦の線＝ルーティングする機器（`rails`）、横の帯＝台帳の VLAN（`bands`。`tone` は `normal`・`warn`（琥珀色＝注意の色。理由を `note` に）・`l2only`（破線））、交点の点と文字＝その機器がそこに持つ IP（`taps`）で、上の破線の楕円（`top`。WAN など対象外）と下の一覧（`footer`。静的経路など）も受ける。受けるのは導いた結果だけで、画面や API の形を知らず、IP の求め方も検証もしない（サーバーが導く）。React Flow は使わず SVG で描き（`stable: "diagram"` のノード数の待ちとぶつからない）、`DiagramFrame` の `fit`（内容の高さ）の枠に入れる。行の高さ・列の間隔は一定で、帯が増えれば縦に、機器が増えれば横に伸び、横は枠の中でスクロールする（キーボードでも動かせる）。文字は SVG の中の `foreignObject` に置き、はみ出す分は行数で切ってブラウザの実際の字幅で収める（全文は `title` と表にある）。寸法は `Ladder.tsx` の1か所、色と文字サイズ（`text-sx-ladder-*`）はトークン。絵は読み上げに出さず（`role="img"`）、同じ内容の表（`sr-only`）を部品が併せて持つので、画面は別の代わりを用意しない。
- 生成した Config や設計データの JSON のような整形済みの長い文字列は `CodeBlock`（`label` で枠に名前を付ける。等幅・折り返しなし・あふれたら枠の中でスクロール）で見せ、画面は `<pre>` に色や枠を書かない。部品ごとの使い分けは見本ページの `use` が正。
- 機器設定の表の指摘は、欄に `invalid`（`CellInput`・`Pick`。赤枠だけ）を付け、文は行の直下に `DenseRowMessages` で出す（表の幅いっぱいで折り返す。文の頭に「欄の名前：」を付け、同じ文は1回だけ。使い分けは見本ページの `use`）。指摘ではなく注意の文は、messages の組に `tone: "warn"` を付けると琥珀色の三角のアイコン（読み上げには「注意：」が付く）で出る。注意には欄の赤枠を付けず、文だけを出す。指摘でも注意でもない補足（直す必要のない、読んでおくと分かりやすいこと）は `tone: "note"` で、アイコンなし・本文の淡い色で出る（指摘・注意より目立たない。欄の赤枠は付けない）。入力の途中で指摘が出続けないよう、`DenseRow` と、その下の `DenseRowMessages` に同じ `group`（行の鍵。行の inputId など。LAG の組のように2行で1つの入力になるものは2行に同じ値）を渡すと、フォーカスがその `group` の中にあるあいだは、欄の赤枠（`invalid`）と指摘・注意（`tone: "note"` の補足は残る）を出さず、`group` の外に出ると出る。`group` を渡さない行は今までどおりすぐ出す。`DenseTable` の `fit` は表を中身の幅で止めて左寄せにする。`Pick` の幅は一番長い選択肢に合うが、1つの列の選択の右に別の欄を並べて「選択＋右の欄」の組にするとき（アクセスリストの送信元・宛先）は `PickWithField`（右の欄を子で渡す）を使う。選択は最小11rem（1440pxの画面で表が横に溢れない幅）で、セルに空きがあれば20rem（長い名前が読める幅）まで広がり、右の欄の場所は空の行も空けておくので、どの行も選択の幅と右の欄の左端がそろう（長い名前は後ろが切れ、開いた一覧と選んだ名前のツールチップには選択肢の文言がそのまま出る）。表に空きがあるときだけ広げるには、その組を入れた列の定義に `DenseColumn` の `grow` を付ける。`grow` のある列を持つ表は枠の幅いっぱいになり、余った幅はその列だけが受け取る（ほかの列は中身の幅のまま。`grow` のない表は今までどおり）。サーバーが導いた値を入力欄と同じ形で見せるだけで直せないものは `CellInput` の `readOnly`（塗り（disabled と同じ淡い灰色）・Tabの順に入れない）。並べ替え・削除のような文字のない操作は `IconButton`（`arrow-up`・`arrow-down`・`trash`）。入力欄の幅と桁数（`maxLength`）は `CellInput` の `kind` が決め、入る文字数は `src/form-cells.tsx` の1つの表（`cellKinds`）だけが持つ。画面は幅も桁数も書かない。
- アクセスリストの動作（許可・拒否）のように、緑と赤が意味を持つ区分は、色だけで伝えず文字とアイコンを添える（DADS）。読むだけの表は `Tag` の `tone`：`permit`（濃い緑の塗り・白文字・チェック）と `deny`（濃い赤の塗り・白文字・禁止の印）は書いたルールの動作に、`implicit-deny`（赤の枠線だけ・赤の文字・禁止の印。塗らない）は書いていない暗黙の拒否に使い、書いたルールの拒否と見分ける。入力の表で動作を選ぶ `Pick` には `tone`（`positive`＝薄い緑の地・濃い緑の文字、`negative`＝薄い赤の地・濃い赤の文字）を付ける。選択欄の文字（許可・拒否）はそのままで、地の色だけが付く。`invalid` は白い地に太い赤の枠で、地の色が付く `tone` と見分けがつく（同時に付けると、地の上に太い赤の枠が出る）。塗りの白文字は ok・error の濃い色（`sx-ok-ink` 5.70:1・`sx-error-ink` 7.10:1）の上にだけ置き、薄い地と濃い文字の組は `sx-ok-bg`／`sx-ok-ink` 5.06:1・`sx-error-bg`／`sx-error-ink` 6.11:1。色は部品がテーマのトークンから取るので、画面に色を書かない（見本ページの「状態」の節（Tag）と「表の指摘と幅」の節（Pick の tone））。
- 部品は値を検証しない。エラー文はサーバーの検証の結果を、呼び出し側が `error` などで渡す（検証の規則を画面に写さない）。
- `Shell` はロゴの横のアプリの名前を `product` で、左ペインの項目を `entries`（`{ label, href, icon, current? }`）で受け、左下に「ローカル利用／ログインなし」の枠を持つ。ルートは `h-dvh` で、`html`・`body` には何も書かない。

## 見本ページ

`gallery/`（`index.html`・`gallery.tsx`）は、部品を全部、tone・variant・size・disabled・invalid・必須ごとに並べたページで、`npm run dev` の `/gallery/`（アプリの開発サーバーでは `/node_modules/@sx/ui/gallery/`）で開く。アプリの `vite build` の入口はアプリの `index.html` だけなので配布物には入らない。`?open=modal`・`?open=modal-lg`（幅 760px の `lg`）・`?open=confirm`・`?open=menu`・`?open=popover`・`?open=table-menu`（行が2件だけの表の中の Menu）を付けると、そのモーダル・確認・メニュー・浮き枠を開いた状態で表示する。表は40行あり、ページ全体ではなく `main` の中だけがスクロールする。見本ページは `body` の余白だけを自分の `index.html` で消す（preflight を読まないため。アプリの `index.html` も同じにする）。画面ファイルと同じく、見本ページで使うクラスは配置のクラスだけにする。

見本ページは部品の台帳でもある。各節は `parts`（その節で見せる部品の名前）と `use`（いつ使うか・いつ使わないか。似た部品との使い分け）を持ち、`use` は節の見出しの下に表示される。台帳を別の文書に写さず、部品の一覧と使い分けはこの1か所だけにする。部品を足す・名前を変えるときは、同じ部品のコミットで見本の節に載せる（`parts` に名前を足し、`<名前` で描き、`use` を書く）。`test/catalog.test.ts`（`npm test`）が、`src/index.ts` が値として公開する部品（英大文字で始まる名前。`type` の export と `confirmTitle` のような関数は除く）の次を見る。

- どの部品も、ちょうど1つの節の `parts` に載っている（載せ忘れは「台帳に無い部品: X」）。
- `parts` の名前は、どれも index.ts が公開している（「公開していない名前: X」）。
- どの部品も、見本の中で `<名前` として描かれている（「見本で描いていない部品: X」）。

限界：`use` の内容が部品の実際の使い方と合っているかは検査しない。レビューで確かめる。

`test/parts.test.ts` は、色の直書きが `src/tokens.css` にだけあること、`role="alert"`／`"status"` が `Notice`・`StatusLine`・`Field`・`SaveStatus` にだけあること、`focus-visible` が `src/focus.ts` にだけあること、見本ページが配置のクラスだけを書くことを見る。検査自身が緩んで黙って通らないよう、落とすべき書き方を落とすことも確かめる。
