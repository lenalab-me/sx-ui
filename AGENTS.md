# sx-ui

- 画面の共通部品 `@sx/ui` と、アプリの画面ファイルを検査する道具（`check/`）のリポジトリ。部品の書き方・見本ページ（台帳）・検査・版の出し方は [README](README.md) が正本。
- 変更したら `npm run check` を通す。部品を足す・名前を変えるときは、同じコミットで見本ページの節に載せる（`parts` に名前を足し、`<名前` で描き、`use` を書く。載せ忘れは `test/catalog.test.ts` が落とす）。
- 見た目を変えたら `npm run e2e`（見本ページの基準画像との比較。失敗したら `npm run e2e -- --last-failed`）。基準画像の差分は人が見て承認し、承認されたものだけ `npm run e2e -- --update-snapshots` で撮り直して、部品の変更と同じコミットに入れる（README の「開発」）。e2e は重いので `offload run -f test-results -- npm run e2e` で予備の Air で流してよい。
- 見た目は `tone`・`variant`・`size` のような意味の指定で受け、色・角丸・影・文字サイズはトークン（`src/tokens.css` の `sx-` の名前）だけで書く。部品は値を検証しない（エラー文はアプリのサーバーの検証の結果を受け取る）。
- 画面ファイルの許可リスト（`check/screen-style.ts` の `allowedLayout`）を広げる・検査を緩めるときは、理由をコミットの文に書く。検査自身の確認（落とすべき書き方を落とすテスト）は消さない。
- アプリの画面が変わる変更（引数の名前を変える・部品を消す・見た目を変える）は、版を上げて `npm run release` で出し、アプリ側で基準画像の差分を人が見て取り込む。版を出したら、雛形（app-template）の `vendor/` も入れ替える（README の「版を出す」）。アプリの `node_modules/@sx/ui` を直接直さない。
- コミットは `npm run check` が通ったひとまとまりごとに行い、区切りで origin へ push してよい。force push・履歴の書き換えは事前に確認する。
