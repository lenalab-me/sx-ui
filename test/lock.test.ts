// node --test test/lock.test.ts（Node の型除去で直接実行する）
//
// 部品のロック（bin/app-ui-lock.sh と bin/ui-lock.sh。README の「ロックと版の入れ替え」）の検査。
// 一時の場所に、部品の tarball を vendor/ に入れた小さなアプリのリポジトリを作り、正しい形が通り、
// ロックを抜ける書き方（node_modules の書き換え、検査のスクリプトの書き換え、部品と画面・検査を
// 同じコミットに入れる、改名で画面のパスを隠す）が落ちることを見る。
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bin = new URL("../bin/", import.meta.url).pathname;

type App = {
  dir: string;
  run: (...args: string[]) => string;
  lock: (mode?: string) => { status: number; out: string };
  write: (path: string, text: string) => void;
  commit: (message: string) => void;
  pack: (version: string, extra?: string) => string;
};

// 部品の tarball（package/ の下に package.json・bin・src）を作り、そのパスを返す。
function packParts(root: string, version: string, extra = ""): string {
  const work = mkdtempSync(join(tmpdir(), "sx-ui-pack-"));
  const pkg = join(work, "package");
  mkdirSync(join(pkg, "bin"), { recursive: true });
  mkdirSync(join(pkg, "src"));
  for (const f of ["ui-lock.sh", "app-ui-lock.sh", "ui-update.sh"])
    copyFileSync(join(bin, f), join(pkg, "bin", f));
  writeFileSync(
    join(pkg, "package.json"),
    JSON.stringify({ name: "@sx/ui", version }),
  );
  writeFileSync(
    join(pkg, "src", "Button.tsx"),
    `export const v = 1;${extra}\n`,
  );
  const out = join(root, `sx-ui-${version}.tgz`);
  execFileSync("tar", ["czf", out, "-C", work, "package"]);
  rmSync(work, { recursive: true, force: true });
  return out;
}

// 雛形を写した最初のコミットと、それを origin/main にした状態のアプリ。
function makeApp(t: { after: (fn: () => void) => void }): App {
  const root = mkdtempSync(join(tmpdir(), "sx-ui-lock-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = join(root, "app");
  mkdirSync(dir);
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.invalid",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.invalid",
  };
  const run = (...args: string[]) =>
    execFileSync(args[0]!, args.slice(1), {
      cwd: dir,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  const write = (path: string, text: string) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const install = (tgz: string) => {
    rmSync(join(dir, "node_modules", "@sx", "ui"), {
      recursive: true,
      force: true,
    });
    mkdirSync(join(dir, "node_modules", "@sx"), { recursive: true });
    const tmp = mkdtempSync(join(tmpdir(), "sx-ui-unpack-"));
    execFileSync("tar", ["xzf", tgz, "-C", tmp]);
    execFileSync("mv", [
      join(tmp, "package"),
      join(dir, "node_modules", "@sx", "ui"),
    ]);
    rmSync(tmp, { recursive: true, force: true });
  };
  const tgz = packParts(root, "1.0.0");
  run("git", "init", "-q", "-b", "main");
  write(".gitignore", "node_modules/\n");
  mkdirSync(join(dir, "vendor"));
  copyFileSync(tgz, join(dir, "vendor", "sx-ui-1.0.0.tgz"));
  install(tgz);
  write(
    "package.json",
    JSON.stringify({
      dependencies: { "@sx/ui": "file:vendor/sx-ui-1.0.0.tgz" },
    }),
  );
  mkdirSync(join(dir, "scripts"));
  copyFileSync(join(bin, "app-ui-lock.sh"), join(dir, "scripts", "ui-lock.sh"));
  write("scripts/check.sh", "sh scripts/ui-lock.sh\n");
  write("src/Home.tsx", "export const home = 1;\n");
  run("sh", "scripts/ui-lock.sh", "approve");
  run("git", "add", "-A");
  run("git", "commit", "-qm", "雛形を写す");
  run("git", "update-ref", "refs/remotes/origin/main", "HEAD");
  const lock = (mode = "check") => {
    const r = spawnSync("sh", ["scripts/ui-lock.sh", mode], {
      cwd: dir,
      env,
      encoding: "utf8",
    });
    return { status: r.status ?? -1, out: r.stdout + r.stderr };
  };
  return {
    dir,
    run,
    lock,
    write,
    commit: (message) => {
      run("git", "add", "-A");
      run("git", "commit", "-qm", message);
    },
    // 新しい版の tarball を vendor/ に入れ替え、node_modules にも入れる（npm install の代わり）。
    pack: (version, extra = "") => {
      const next = packParts(root, version, extra);
      rmSync(join(dir, "vendor"), { recursive: true, force: true });
      mkdirSync(join(dir, "vendor"));
      copyFileSync(next, join(dir, "vendor", `sx-ui-${version}.tgz`));
      install(next);
      write(
        "package.json",
        JSON.stringify({
          dependencies: { "@sx/ui": `file:vendor/sx-ui-${version}.tgz` },
        }),
      );
      return next;
    },
  };
}

test("ロックは、雛形を写したままのアプリと、部品だけのコミットで版を上げたアプリを通す", (t) => {
  const app = makeApp(t);
  assert.equal(app.lock().status, 0, app.lock().out);
  app.pack("1.1.0");
  app.run("sh", "scripts/ui-lock.sh", "approve");
  app.commit("部品：1.1.0 にする");
  app.write("src/Home.tsx", "export const home = 2;\n");
  app.commit("画面：1.1.0 に合わせる");
  assert.equal(app.lock().status, 0, app.lock().out);
});

test("ロックは、承認していない vendor/ と、書き換えた node_modules/@sx/ui を落とす", (t) => {
  const app = makeApp(t);
  app.pack("1.1.0");
  assert.match(app.lock().out, /vendor\/ が ui\.lock と違います/);
  const fresh = makeApp(t);
  appendFileSync(join(fresh.dir, "node_modules/@sx/ui/src/Button.tsx"), "//\n");
  const r = fresh.lock();
  assert.equal(r.status, 1);
  assert.match(r.out, /src\/Button\.tsx/);
});

test("ロックは、node_modules の中の検査のスクリプトを書き換えても抜けられない", (t) => {
  const app = makeApp(t);
  writeFileSync(
    join(app.dir, "node_modules/@sx/ui/bin/ui-lock.sh"),
    "exit 0\n",
  );
  const r = app.lock();
  assert.equal(r.status, 1);
  assert.match(r.out, /bin\/ui-lock\.sh differ/);
  // node_modules から直に流すのも止める（書き換えたものでなくても）。
  const fresh = makeApp(t);
  const direct = spawnSync("sh", ["node_modules/@sx/ui/bin/ui-lock.sh"], {
    cwd: fresh.dir,
    encoding: "utf8",
  });
  assert.equal(direct.status, 1);
  assert.match(
    direct.stderr,
    /node_modules\/@sx\/ui\/bin\/ui-lock\.sh は流しません/,
  );
});

test("ロックは、部品の写しと違う scripts/ui-lock.sh を落とす", (t) => {
  const app = makeApp(t);
  appendFileSync(join(app.dir, "scripts/ui-lock.sh"), "# 手で直した\n");
  const r = app.lock();
  assert.equal(r.status, 1);
  assert.match(
    r.out,
    /scripts\/ui-lock\.sh が、部品の版の bin\/app-ui-lock\.sh と違います/,
  );
});

test("ロックは、部品のコミットに画面・検査・設定が入っていれば落とす", (t) => {
  // ui.lock（承認）と画面を同じコミットにする。
  const a = makeApp(t);
  a.pack("1.1.0");
  a.run("git", "add", "vendor");
  a.run("git", "commit", "-qm", "vendor だけ");
  a.run("sh", "scripts/ui-lock.sh", "approve");
  a.write("src/Home.tsx", "export const home = 2;\n");
  a.commit("承認と画面");
  assert.match(a.lock().out, /両方に触っています。[^\n]*:\n {2}src\/Home\.tsx/);
  // 部品のコミットで、検査（scripts/check.sh）を緩める。
  const b = makeApp(t);
  b.pack("1.1.0");
  b.run("sh", "scripts/ui-lock.sh", "approve");
  b.write("scripts/check.sh", "true\n");
  b.commit("部品と check.sh");
  assert.match(b.lock().out, /\n {2}scripts\/check\.sh/);
  // 作業コピーでも同じ。
  const c = makeApp(t);
  c.pack("1.1.0");
  c.run("sh", "scripts/ui-lock.sh", "approve");
  c.write("vite.config.mjs", "export default {};\n");
  assert.match(c.lock().out, /作業コピーが.*\n {2}vite\.config\.mjs/);
});

test("ロックは、部品のコミットで画面のファイルを src/ の外へ改名しても見つける", (t) => {
  const app = makeApp(t);
  app.pack("1.1.0");
  app.run("sh", "scripts/ui-lock.sh", "approve");
  app.run("git", "mv", "src/Home.tsx", "screens-Home.tsx");
  app.commit("部品と改名");
  const r = app.lock();
  assert.equal(r.status, 1);
  assert.match(r.out, /\n {2}src\/Home\.tsx/);
});

test("ロックは、origin が無ければ最初のコミットだけを見ず、origin にない別の根のコミットは見る", (t) => {
  const app = makeApp(t);
  app.run("git", "update-ref", "-d", "refs/remotes/origin/main");
  assert.equal(app.lock().status, 0, app.lock().out);
  const orphan = makeApp(t);
  orphan.run("git", "checkout", "-q", "--orphan", "other");
  orphan.write("src/Home.tsx", "export const home = 3;\n");
  orphan.pack("1.1.0");
  orphan.run("sh", "scripts/ui-lock.sh", "approve");
  orphan.commit("別の根");
  assert.equal(orphan.lock().status, 1);
});

test("ロックは、部品の依存が入れ子に入った node_modules を違いと見ず、node_modules が無いときはそう言う", (t) => {
  const app = makeApp(t);
  mkdirSync(join(app.dir, "node_modules/@sx/ui/node_modules/lucide-react"), {
    recursive: true,
  });
  assert.equal(app.lock().status, 0, app.lock().out);
  rmSync(join(app.dir, "node_modules"), { recursive: true, force: true });
  assert.match(app.lock().out, /node_modules\/@sx\/ui がありません/);
});

// 浅い clone（CI の actions/checkout の既定の depth 1）を作る。HEAD の枝と origin/main を浅く持ち、
// node_modules（git に入れないもの）は写す。
function shallowClone(app: App, depth: number): string {
  const clone = mkdtempSync(join(tmpdir(), "sx-ui-shallow-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: clone, encoding: "utf8" });
  execFileSync("rmdir", [clone]);
  execFileSync("git", [
    "clone",
    "-q",
    `--depth=${depth}`,
    "--branch=pr",
    `file://${app.dir}`,
    clone,
  ]);
  git("fetch", "-q", `--depth=${depth}`, "origin", "main");
  git("update-ref", "refs/remotes/origin/main", "FETCH_HEAD");
  execFileSync("cp", ["-R", join(app.dir, "node_modules"), clone]);
  return clone;
}

const lockIn = (dir: string) => {
  const r = spawnSync("sh", ["scripts/ui-lock.sh"], {
    cwd: dir,
    encoding: "utf8",
  });
  return { status: r.status ?? -1, out: r.stdout + r.stderr };
};

test("ロックは、浅い clone の境目のコミット（親が切られて全ファイルに触ったように見える）を見ずに知らせ、境目より後の混ぜたコミットは落とす", (t) => {
  const app = makeApp(t);
  app.run("git", "checkout", "-q", "-b", "pr");
  // 部品と画面を混ぜたコミット。これが境目になる。
  app.pack("1.1.0");
  app.run("sh", "scripts/ui-lock.sh", "approve");
  app.write("src/Home.tsx", "export const home = 2;\n");
  app.commit("部品と画面");
  const boundary = app.run("git", "rev-parse", "--short", "HEAD").trim();
  const onlyBoundary = shallowClone(app, 1);
  t.after(() => rmSync(onlyBoundary, { recursive: true, force: true }));
  const r = lockIn(onlyBoundary);
  assert.equal(r.status, 0, r.out);
  assert.match(
    r.out,
    new RegExp(
      `浅い clone なので境目のコミット ${boundary} は見ない。全部見るには fetch-depth: 0`,
    ),
  );
  // 境目より後の、部品と画面の両方に触るコミットは、浅くても落とす。
  app.pack("1.2.0");
  app.run("sh", "scripts/ui-lock.sh", "approve");
  app.write("src/Home.tsx", "export const home = 3;\n");
  app.commit("部品と画面（その2）");
  const later = app.run("git", "rev-parse", "--short", "HEAD").trim();
  const twoDeep = shallowClone(app, 2);
  t.after(() => rmSync(twoDeep, { recursive: true, force: true }));
  const bad = lockIn(twoDeep);
  assert.equal(bad.status, 1);
  assert.match(bad.out, new RegExp(`コミット ${later}が、部品`));
  assert.match(bad.out, /\n {2}src\/Home\.tsx/);
});
