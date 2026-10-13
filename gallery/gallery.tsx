import "@nd/ui/styles.css";
import { StrictMode, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  ButtonLink,
  Card,
  CardHead,
  CellInput,
  Check,
  Checkbox,
  CheckboxInput,
  ConfirmDialog,
  Crumbs,
  DenseCell,
  DenseRow,
  DenseRowHead,
  DenseTable,
  DescriptionList,
  Disclosure,
  EmptyState,
  ErrorText,
  Field,
  Icon,
  IconButton,
  Input,
  Label,
  Menu,
  Modal,
  Notice,
  NumberInput,
  Page,
  PageTitle,
  Pick,
  Pill,
  Popover,
  RowHead,
  SaveStatus,
  SectionHeader,
  Select,
  Shell,
  StatusLine,
  Stepper,
  SupportText,
  Table,
  TabPanel,
  Tabs,
  Tag,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  type ControlSize,
  type IconName,
  type NoticeTone,
  type PillTone,
  type SaveState,
  type TabsVariant,
  type TagTone,
} from "@nd/ui";

// A page that shows every component in every state. It is not part of the app build: open it
// with the dev server at /packages/ui/gallery/. ?open=modal|modal-lg|confirm|menu|popover|table-menu opens that
// overlay on load. Only layout classes are used here; the look comes from the components.
// It is also the catalog of the components: every Section lists the parts it shows (`parts`) and
// says when to use them and when not to (`use`). src/ui-catalog.test.ts checks that every component
// exported from @nd/ui is in exactly one `parts` and is drawn here.

const sizes: ControlSize[] = ["sm", "md", "lg"];
const variants = ["primary", "secondary", "ghost", "danger"] as const;
const noticeTones: NoticeTone[] = ["info", "ok", "warn", "error"];
const pillTones: PillTone[] = ["ok", "warn", "neutral", "error", "accent"];
const tagTones: TagTone[] = ["fill", "accent", "outline"];
const saveStates: SaveState[] = ["saved", "unsaved", "saving", "failed"];
const tabVariants: TabsVariant[] = ["underline", "segmented", "pill"];
const tabItems = [
  { id: "sites", label: "拠点", count: 12 },
  { id: "templates", label: "テンプレート", count: 2 },
  { id: "withdrawn", label: "取り下げ", disabled: true },
];
const steps = [
  { id: "physical", label: "物理構成", hint: "配線と配置", href: "#physical" },
  {
    id: "devices",
    label: "機器設定",
    hint: "機器ごとの設定",
    href: "#devices",
  },
  {
    id: "topology",
    label: "トポロジ確認",
    hint: "接続の確認",
    href: "#topology",
  },
  { id: "review", label: "Review", hint: "生成前の確認", href: "#review" },
];
const rows = Array.from({ length: 40 }, (_, i) => ({
  number: String(i + 1).padStart(3, "0"),
  name: `見本拠点 ${i + 1}`,
  kind: i % 5 === 0 ? "センター" : "通常",
  devices: (i % 4) + 1,
}));

// Every icon name; `satisfies` makes the compiler fail when an icon is added to @nd/ui and not here.
const iconNames = Object.keys({
  "arrow-left": true,
  "arrow-right": true,
  "chevron-down": true,
  "circle-alert": true,
  "circle-check": true,
  download: true,
  ellipsis: true,
  eye: true,
  "eye-off": true,
  "file-cog": true,
  "file-text": true,
  info: true,
  "layout-grid": true,
  maximize: true,
  plus: true,
  undo: true,
  x: true,
} satisfies Record<IconName, true>) as IconName[];

const opened = new URLSearchParams(location.search).get("open");

// The heading is the title and the names in `parts`, so the names are written once.
function Section({
  title,
  parts,
  use,
  children,
}: {
  title: string;
  parts: string[];
  use: string;
  children: ReactNode;
}) {
  const heading = `${title}（${parts.join("・")}）`;
  return (
    <Card label={heading} className="flex flex-col gap-4 p-6">
      <SectionHeader title={heading} level={2} />
      <SupportText>{use}</SupportText>
      {children}
    </Card>
  );
}

function Gallery() {
  const [variantTab, setVariantTab] = useState<Record<string, string>>({});
  const [name, setName] = useState("見本拠点");
  const [vlan, setVlan] = useState("4096");
  const [routers, setRouters] = useState("1");
  const [kind, setKind] = useState("a");
  const [checked, setChecked] = useState(true);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(opened === "modal");
  const [modalLg, setModalLg] = useState(opened === "modal-lg");
  const [confirm, setConfirm] = useState(opened === "confirm");
  const [popover, setPopover] = useState(opened === "popover");
  const [status, setStatus] = useState<string | null>(
    "見本拠点 1 の補足を保存しました。",
  );
  const anchor = useRef<HTMLButtonElement>(null);

  return (
    <Shell
      homeHref="/packages/ui/gallery/"
      entries={[
        {
          label: "部品の見本",
          href: "/packages/ui/gallery/",
          icon: "projects",
          current: true,
        },
      ]}
    >
      <Page
        crumbs={[{ label: "Project", href: "/" }, { label: "部品の見本" }]}
        meta={<SaveStatus state="saved" live />}
        status={status}
      >
        <PageTitle title="部品の見本" subtitle="全部品を全状態で並べたページ">
          <Button
            variant="primary"
            size="lg"
            icon="plus"
            onClick={() => setModal(true)}
          >
            モーダルを開く
          </Button>
        </PageTitle>

        <Section
          title="画面の枠組み"
          parts={["Shell", "Page", "PageTitle", "Card", "CardHead", "Crumbs"]}
          use="Shell は左ペインとページの枠で、画面は Page を1つ入れます。見出しの行は PageTitle（何の画面かを添えるときは「subtitle」。この見本の見出しの右）、白い面は Card、現在位置は Crumbs（Page に渡した経路から描かれる）です。Card の上端にタブを置くときは CardHead に下線のタブ（Tabs の「underline」）を入れ、その面が何を並べるかの案内は「note」で右に添えます。タブのない Card には使いません。"
        >
          <Crumbs
            items={[
              { label: "Project", href: "/" },
              { label: "見本拠点" },
              { label: "機器設定" },
            ]}
          />
          <Card label="CardHead（案内あり）">
            <CardHead note="STEP1：拠点を追加して申し込みます。2件登録済み。">
              <Tabs
                items={tabItems}
                value="sites"
                onChange={() => {}}
                label="カードの上端のタブ（案内あり）"
                idPrefix="cardhead-note"
              />
            </CardHead>
            <p className="px-7 py-4">カードの中身です。</p>
          </Card>
          <Card label="CardHead（案内が長い）">
            <CardHead note="案内が長いときは、最大幅（640px）で折り返します。STEP1の申込で拠点を追加すると、ここに並びます。機器の台数は申込でだけ変わります。">
              <Tabs
                items={tabItems}
                value="templates"
                onChange={() => {}}
                label="カードの上端のタブ（案内が長い）"
                idPrefix="cardhead-long"
              />
            </CardHead>
            <p className="px-7 py-4">カードの中身です。</p>
          </Card>
          <Card label="CardHead（案内なし）">
            <CardHead>
              <Tabs
                items={tabItems}
                value="sites"
                onChange={() => {}}
                label="カードの上端のタブ（案内なし）"
                idPrefix="cardhead-plain"
              />
            </CardHead>
            <p className="px-7 py-4">カードの中身です。</p>
          </Card>
        </Section>

        <Section
          title="お知らせ"
          parts={["Notice", "StatusLine"]}
          use="Notice は、画面の中に残す注意・結果・エラーの帯です。操作や読み込みの失敗のように出た瞬間に読み上げるものは「live」を付けます（「error」「warn」は割り込んで、「info」「ok」は控えめに読み上げる）。操作の結果を一行だけ伝えるときは StatusLine（Page に文を渡すと上端に描かれる）を使い、残しておく説明には使いません。StatusLine の「neutral」は、結果ではない「読み込み中…」のような一言用で、アイコンも色も付けません。"
        >
          <StatusLine text="見本拠点 2 の機器設定を保存しました。" />
          <StatusLine text="読み込み中…" tone="neutral" />
          {noticeTones.map((tone) => (
            <Notice
              key={tone}
              tone={tone}
              title={`${tone} のお知らせ`}
              actions={<Button size="sm">操作</Button>}
            >
              本文の例です。保存や反映の結果をここに書きます。
            </Notice>
          ))}
          <Notice tone="info" title="本文も操作もないお知らせ" />
          <Notice
            tone="error"
            title="出た瞬間に読み上げるお知らせ（live）"
            live
          />
          <Button
            size="sm"
            className="self-start"
            onClick={() => setStatus(null)}
          >
            状態の行を消す
          </Button>
        </Section>

        <Section
          title="ボタン"
          parts={["Button", "ButtonLink", "IconButton", "Icon"]}
          use="Button は操作、ButtonLink は見た目がボタンの移動、IconButton は文字のない操作で、名前の指定が必須です。Icon は飾りで、意味は近くの文字で伝えます。"
        >
          {variants.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              {sizes.map((size) => (
                <Button key={size} variant={variant} size={size} icon="plus">
                  {variant} {size}
                </Button>
              ))}
              <Button variant={variant} disabled>
                {variant} 無効
              </Button>
              <ButtonLink variant={variant} href="#link">
                {variant} リンク
              </ButtonLink>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            {sizes.map((size) => (
              <IconButton
                key={size}
                label={`ダウンロード ${size}`}
                icon="download"
                size={size}
              />
            ))}
            <IconButton label="無効のアイコン" icon="eye" disabled />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {iconNames.map((icon) => (
              <span key={icon} className="flex items-center gap-2">
                <Icon name={icon} />
                {icon}
              </span>
            ))}
          </div>
        </Section>

        <Section
          title="入力"
          parts={[
            "Field",
            "Label",
            "SupportText",
            "ErrorText",
            "Input",
            "NumberInput",
            "Select",
            "Textarea",
            "Checkbox",
            "CheckboxInput",
          ]}
          use="ラベル・補足・エラーと入力欄を組む Field が基本で、Label・SupportText・ErrorText は Field の中身です。機器の台数のような短い値は「inline」で、ラベルを左・入力欄を右の1行に並べます（長い値や選択肢の多いものには使いません）。表の中には使わず、表のセルには機器設定の表の部品を使います。"
        >
          <div className="grid grid-cols-2 gap-6">
            <Field label="拠点名" support="20文字以内で入力します。" required>
              {(f) => (
                <Input
                  id={f.id}
                  aria-describedby={f.describedBy}
                  invalid={f.invalid}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            <Field label="拠点名（エラー）" error="拠点名は必須です。" required>
              {(f) => (
                <Input
                  id={f.id}
                  aria-describedby={f.describedBy}
                  invalid={f.invalid}
                  defaultValue=""
                />
              )}
            </Field>
            <Field label="拠点名（無効）">
              {(f) => (
                <Input id={f.id} defaultValue="変更できません" disabled />
              )}
            </Field>
            <Field label="VLAN ID" support="1 から 4094 の数値です。">
              {(f) => (
                <NumberInput
                  id={f.id}
                  aria-describedby={f.describedBy}
                  value={vlan}
                  onChange={(e) => setVlan(e.target.value)}
                />
              )}
            </Field>
            <Field label="種別">
              {(f) => (
                <Select
                  id={f.id}
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="a">通常拠点</option>
                  <option value="b">センター拠点</option>
                </Select>
              )}
            </Field>
            <Field label="種別（エラー）" error="種別を選んでください。">
              {(f) => (
                <Select id={f.id} invalid defaultValue="">
                  <option value="">選択してください</option>
                  <option value="a">通常拠点</option>
                </Select>
              )}
            </Field>
            <Field label="補足" support="STEP1 の値を表示します。">
              {(f) => (
                <Textarea
                  id={f.id}
                  aria-describedby={f.describedBy}
                  defaultValue=""
                />
              )}
            </Field>
            <div className="flex flex-col gap-3">
              {sizes.map((size) => (
                <Input
                  key={size}
                  size={size}
                  aria-label={`入力欄 ${size}`}
                  defaultValue={`size ${size}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Field label="ルーターの台数" inline>
              {(f) => (
                <NumberInput
                  id={f.id}
                  size="md"
                  value={routers}
                  onChange={(e) => setRouters(e.target.value)}
                />
              )}
            </Field>
            <Field label="スイッチの台数（無効）" inline>
              {(f) => <NumberInput id={f.id} size="md" value="2" disabled />}
            </Field>
            <Field
              label="APの台数（補足つき）"
              support="0 から 8 台です。"
              inline
            >
              {(f) => (
                <NumberInput
                  id={f.id}
                  aria-describedby={f.describedBy}
                  size="md"
                  defaultValue="1"
                />
              )}
            </Field>
            <Field
              label="ファイアウォールの台数（エラー）"
              error="0 または 1 を入れてください。"
              required
              inline
            >
              {(f) => (
                <NumberInput
                  id={f.id}
                  aria-describedby={f.describedBy}
                  invalid={f.invalid}
                  size="md"
                  defaultValue="3"
                />
              )}
            </Field>
          </div>
          <div className="flex flex-col gap-3">
            <Checkbox
              label="チェックの例（操作できる）"
              support="説明文を添える例です。"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <Checkbox label="チェックなし" defaultChecked={false} />
            <Checkbox label="無効（チェックあり）" checked disabled readOnly />
            <Checkbox
              label="無効（チェックなし）"
              checked={false}
              disabled
              readOnly
            />
            <div className="flex items-center gap-3">
              <CheckboxInput size="sm" aria-label="小さいチェック" />
              <CheckboxInput size="md" aria-label="通常のチェック" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label required>Field を使わない単独のラベル</Label>
              <SupportText>単独の補足文です。</SupportText>
              <ErrorText>単独のエラー文です。</ErrorText>
            </div>
          </div>
        </Section>

        <Section
          title="状態"
          parts={["Pill", "Tag", "SaveStatus", "EmptyState"]}
          use="Pill は状態、Tag は拠点番号・種別などの付属情報、SaveStatus は保存の状態を示します。EmptyState は一覧や表が空のときに置く部品で、理由や次の手順は「support」（小さい2行目）に書きます。Notice の代わりにはしません。"
        >
          {(["md", "sm"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              {pillTones.map((tone) => (
                <Pill key={tone} tone={tone} size={size}>
                  {tone} {size}
                </Pill>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            {tagTones.map((tone) => (
              <Tag key={tone} tone={tone}>
                {tone}
              </Tag>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {saveStates.map((state) => (
              <SaveStatus key={state} state={state} />
            ))}
          </div>
          <EmptyState
            icon="file-text"
            action={<Button size="sm">拠点を追加</Button>}
          >
            まだ拠点がありません。STEP1 で拠点を申し込むとここに出ます。
          </EmptyState>
          <EmptyState
            icon="file-text"
            support="STEP1 で申し込んだ拠点は、連携後にここに出ます。"
          >
            連携前の Project のため、拠点は追加できません。
          </EmptyState>
        </Section>

        <Section
          title="読むだけの値"
          parts={["DescriptionList"]}
          use="編集しない値（STEP1 から取り込んだ拠点の情報など）を、項目名と値の組で2列に並べます。入力欄の代わりにはならず、編集できる値には Field を使います。"
        >
          <DescriptionList
            items={[
              { term: "拠点番号", value: "001" },
              { term: "拠点名", value: "見本拠点 1" },
              { term: "種別", value: "センター" },
              { term: "エリア", value: "東日本" },
              { term: "機器", value: <Tag tone="outline">ルーター 1 台</Tag> },
              {
                term: "申込の補足",
                value:
                  "長い値は折り返します。見本拠点 1 の回線は、見本の事業者の見本のサービスを使います。",
              },
            ]}
          />
        </Section>

        <Section
          title="タブと工程"
          parts={["Tabs", "TabPanel", "Stepper"]}
          use="Tabs は同じ画面の中で表示を切り替え、Stepper は拠点の画面の工程の移動に使います。ページの移動に Tabs は使わず、工程以外に Stepper は使いません。"
        >
          {tabVariants.map((variant) => {
            const current = variantTab[variant] ?? "sites";
            return (
              <div key={variant} className="flex flex-col gap-3">
                <Tabs
                  items={tabItems}
                  value={current}
                  onChange={(id) =>
                    setVariantTab((t) => ({ ...t, [variant]: id }))
                  }
                  label={`タブ（${variant}）`}
                  idPrefix={`tabs-${variant}`}
                  variant={variant}
                />
                <TabPanel
                  idPrefix={`tabs-${variant}`}
                  id="sites"
                  value={current}
                >
                  <p>拠点のパネルです（{variant}）。</p>
                </TabPanel>
                <TabPanel
                  idPrefix={`tabs-${variant}`}
                  id="templates"
                  value={current}
                >
                  <p>テンプレートのパネルです（{variant}）。</p>
                </TabPanel>
              </div>
            );
          })}
          <Stepper steps={steps} current="devices" />
        </Section>

        <Section
          title="開閉"
          parts={["Disclosure"]}
          use="見出しのボタンで中身を開閉します。呼び出し側が開閉を持つことも、部品に任せることもできます。常に見せたい内容には使いません。"
        >
          <Disclosure title="閉じた状態">中身です。</Disclosure>
          <Disclosure title="開いた状態" defaultOpen>
            中身です。
          </Disclosure>
          <Disclosure
            title="呼び出し側が開閉を持つ"
            open={open}
            onOpenChange={setOpen}
            highlighted
            after={<Tag tone="accent">選択中</Tag>}
          >
            強調した枠の例です。
          </Disclosure>
        </Section>

        <Section
          title="機器設定の表"
          parts={[
            "DenseTable",
            "DenseRow",
            "DenseRowHead",
            "DenseCell",
            "CellInput",
            "Pick",
            "Check",
            "SectionHeader",
          ]}
          use="機器設定の入力用の表で、行は40px、横にスクロールします。読むだけの一覧には使わず、一覧の表（Table）を使います。SectionHeader は表の節の見出しと「追加」ボタンです。"
        >
          <SectionHeader
            title="VLAN"
            level={3}
            add={{ label: "VLANを追加", count: 2, max: 8, onClick: () => {} }}
          />
          <DenseTable
            label="VLAN の入力例"
            minWidth={640}
            columns={[
              { id: "name", header: "名前" },
              { id: "vlan", header: "VLAN ID" },
              { id: "type", header: "種別" },
              { id: "on", header: "有効" },
            ]}
          >
            <DenseRow>
              <DenseRowHead>業務</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="VLAN ID（正常）"
                  kind="vlan"
                  value="100"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <Pick
                  label="種別（例）"
                  value="a"
                  onChange={() => {}}
                  options={[
                    ["a", "通常"],
                    ["b", "管理"],
                  ]}
                />
              </DenseCell>
              <DenseCell>
                <Check label="有効（例）" value onChange={() => {}} />
              </DenseCell>
            </DenseRow>
            <DenseRow subtle>
              <DenseRowHead>ゲスト</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="VLAN ID（エラー）"
                  kind="vlan"
                  value="5000"
                  error="指定可能：1-4094"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell tone="body" nowrap>
                未設定
              </DenseCell>
              <DenseCell>
                <Check
                  label="有効（無効の例）"
                  value={false}
                  disabled
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
          </DenseTable>
        </Section>

        <Section
          title="メニューと浮き枠"
          parts={["Menu", "Popover"]}
          use="Menu は行の末尾の「…」から出す操作の一覧、Popover はボタンの近くに出す小さな枠です。画面を止めて答えを求めるときは、ダイアログを使います。どちらも最前面に出るので、表やモーダルの枠で切れません。"
        >
          <div className="flex flex-wrap items-start gap-6">
            <div className="relative">
              <Button ref={anchor} onClick={() => setPopover((v) => !v)}>
                浮き枠を開く
              </Button>
              {popover && (
                <Popover
                  label="浮き枠の例"
                  anchor={anchor}
                  onClose={() => setPopover(false)}
                >
                  <Field label="メモ">
                    {(f) => <Input id={f.id} size="sm" defaultValue="" />}
                  </Field>
                </Popover>
              )}
            </div>
            {/* The menu opens to the left of its button, as it does at the end of a table row */}
            <div className="ml-auto">
              <Menu
                label="行の操作"
                defaultOpen={opened === "menu"}
                items={[
                  { label: "申込" },
                  { label: "補足" },
                  { label: "物理構成を開く", href: "#physical" },
                  { label: "使えない項目", disabled: true },
                  { label: "削除", danger: true },
                ]}
              />
            </div>
          </div>
          {/* Two rows only: the menu below is taller than the table, and is still not cut off */}
          <Table caption="行が2件だけの表の例" minWidth={480}>
            <colgroup>
              <col className="w-32" />
              <col />
              <col className="w-20" />
            </colgroup>
            <THead>
              <Th>拠点番号</Th>
              <Th>拠点名</Th>
              <Th>
                <span className="sr-only">その他の操作</span>
              </Th>
            </THead>
            <tbody>
              {rows.slice(0, 2).map((r, i) => (
                <Tr key={r.number}>
                  <RowHead nowrap>{r.number}</RowHead>
                  <Td truncate>{r.name}</Td>
                  <Td align="right">
                    <Menu
                      label={`${r.name}のその他の操作`}
                      defaultOpen={opened === "table-menu" && i === 1}
                      items={[
                        { label: "申込" },
                        { label: "補足" },
                        { label: "テンプレートにする" },
                        { label: "削除", danger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section
          title="ダイアログ"
          parts={["Modal", "ConfirmDialog"]}
          use="Modal は背後の操作を止めて入力を求める窓で、閉じても何も送りません。幅は「sm」（確認）・「md」（入力）・「lg」（2列の入力やタブのある窓）から選びます。ConfirmDialog は取り消せない操作の前の確認に使い、入力を求めるときは Modal を使います。"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setModal(true)}>モーダルを開く</Button>
            <Button onClick={() => setModalLg(true)}>
              大きいモーダルを開く
            </Button>
            <Button onClick={() => setConfirm(true)}>確認を開く</Button>
          </div>
        </Section>

        <Section
          title="一覧の表"
          parts={["Table", "THead", "Th", "Tr", "RowHead", "Td"]}
          use="1行1件の一覧用の表で、行は56pxです。入力する表には使わず、機器設定の表（DenseTable）を使います。"
        >
          <Table caption="見本拠点の一覧" minWidth={720}>
            <colgroup>
              <col className="w-32" />
              <col />
              <col className="w-32" />
              <col className="w-28" />
            </colgroup>
            <THead>
              <Th>拠点番号</Th>
              <Th>拠点名</Th>
              <Th>種別</Th>
              <Th numeric>機器数</Th>
            </THead>
            <tbody>
              {rows.map((r, i) => (
                <Tr key={r.number} selected={i === 2}>
                  <RowHead nowrap>{r.number}</RowHead>
                  <Td truncate>{r.name}</Td>
                  <Td nowrap>{r.kind}</Td>
                  <Td numeric>{r.devices}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {modal && (
          <Modal
            title="拠点を追加"
            description="STEP1 の申込として送ります。"
            onClose={() => setModal(false)}
            footer={
              <>
                <Button onClick={() => setModal(false)}>閉じる</Button>
                <Button variant="primary" onClick={() => setModal(false)}>
                  申し込む
                </Button>
              </>
            }
          >
            <Field label="拠点名" required>
              {(f) => <Input id={f.id} defaultValue="" />}
            </Field>
            <Notice tone="warn" title="閉じても入力は消えません">
              閉じる操作では何も送りません。
            </Notice>
          </Modal>
        )}
        {modalLg && (
          <Modal
            size="lg"
            title="拠点を追加（lg）"
            description="2列に並べた入力の例です。"
            onClose={() => setModalLg(false)}
            footer={
              <>
                <Button onClick={() => setModalLg(false)}>閉じる</Button>
                <Button variant="primary" onClick={() => setModalLg(false)}>
                  申し込む
                </Button>
              </>
            }
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="拠点番号" required>
                {(f) => <Input id={f.id} defaultValue="" />}
              </Field>
              <Field label="拠点名" required>
                {(f) => <Input id={f.id} defaultValue="" />}
              </Field>
              <Field label="種別">
                {(f) => (
                  <Select id={f.id} defaultValue="a">
                    <option value="a">通常拠点</option>
                    <option value="b">センター拠点</option>
                  </Select>
                )}
              </Field>
              {/* A menu opened inside a modal: Esc closes only the menu, the next Esc closes the modal */}
              <Field label="エリア">
                {(f) => (
                  <div className="flex items-center gap-2">
                    <Input id={f.id} defaultValue="" />
                    <Menu
                      label="エリアの操作"
                      items={[
                        { label: "前の拠点からコピー" },
                        { label: "入力を消す" },
                      ]}
                    />
                  </div>
                )}
              </Field>
              <Field label="ルーターの台数" inline>
                {(f) => <NumberInput id={f.id} size="md" defaultValue="1" />}
              </Field>
              <Field label="スイッチの台数" inline>
                {(f) => <NumberInput id={f.id} size="md" defaultValue="2" />}
              </Field>
            </div>
          </Modal>
        )}
        {confirm && (
          <ConfirmDialog
            q={{
              title: "接続を削除する前の確認",
              message: "削除すると元に戻せません。",
              confirm: "接続を削除する",
              third: "このまま進む",
              danger: true,
            }}
            onAnswer={() => setConfirm(false)}
          />
        )}
      </Page>
    </Shell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
