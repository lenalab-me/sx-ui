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
  CodeBlock,
  ConfirmDialog,
  Crumbs,
  DenseCell,
  DenseRow,
  DenseRowHead,
  DenseRowMessages,
  DenseTable,
  DescriptionList,
  DiagramDevice,
  DiagramFrame,
  DiagramPort,
  DiagramRouteError,
  Disclosure,
  EmptyState,
  ErrorText,
  Field,
  Icon,
  IconButton,
  Input,
  Label,
  LadderDiagram,
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
  type LadderBand,
  type LadderRail,
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
// A site with a CPE and an L3 switch, as the logical view would pass it (documentation addresses only).
const ladderRails: LadderRail[] = [
  { id: "cpe-01", label: "CPE-01", sublabel: "CPE" },
  { id: "l3-01", label: "L3-01", sublabel: "L3 スイッチ" },
];
const ladderBands: LadderBand[] = [
  { id: "v1", label: "VLAN 1 既定", tone: "l2only", taps: [] },
  {
    id: "v10",
    label: "VLAN 10 事務",
    sublabel: "192.0.2.0/26 · SSID 事務用",
    tone: "normal",
    taps: [{ railId: "cpe-01", text: ".1 VIP .2 · DHCP" }],
  },
  {
    id: "v20",
    label: "VLAN 20 来客",
    sublabel: "192.0.2.64/26 · SSID 来客用",
    tone: "normal",
    taps: [{ railId: "cpe-01", text: ".1 · DHCP" }],
  },
  {
    id: "v30",
    label: "VLAN 30 サーバ",
    sublabel: "198.51.100.0/27",
    tone: "normal",
    taps: [{ railId: "l3-01", text: ".1 VIP .2" }],
  },
  {
    id: "v40",
    label: "VLAN 40 プリンタ",
    sublabel: "198.51.100.32/27",
    tone: "normal",
    taps: [{ railId: "l3-01", text: ".1 · DHCP リレー" }],
  },
  {
    id: "v100",
    label: "VLAN 100 無線",
    sublabel: "198.51.100.64/26 · SSID 職員用",
    tone: "warn",
    note: "ゲートウェイの IP を持つ機器がない",
    taps: [],
  },
  {
    id: "v200",
    label: "VLAN 200 防犯カメラ",
    sublabel: "198.51.100.128/26",
    tone: "normal",
    taps: [{ railId: "l3-01", text: ".1" }],
  },
  {
    id: "v300",
    label: "VLAN 300 CPE-L3 間",
    sublabel: "203.0.113.0/30",
    tone: "normal",
    taps: [
      { railId: "cpe-01", text: ".1" },
      { railId: "l3-01", text: ".2" },
    ],
  },
  { id: "v900", label: "VLAN 900 管理", tone: "l2only", taps: [] },
];
const ladderFooter = [
  "CPE-01  198.51.100.0/24 → 203.0.113.2（L3-01）",
  "L3-01  0.0.0.0/0 → 203.0.113.1（CPE-01）",
];
// Many segments and three rails: the picture grows taller and wider, and the frame scrolls sideways.
const ladderManyRails: LadderRail[] = [
  ...ladderRails,
  { id: "l3-02", label: "L3-02", sublabel: "L3 スイッチ" },
];
const ladderManyBands: LadderBand[] = Array.from({ length: 20 }, (_, i) => {
  const vlan = (i + 1) * 10;
  const railId = ladderManyRails[i % 3]!.id;
  return {
    id: `m${vlan}`,
    label: `VLAN ${vlan} 見本セグメント ${i + 1}`,
    sublabel: `198.51.100.${(i % 8) * 32}/27 · SSID 見本-${i + 1}`,
    tone: i % 7 === 6 ? "warn" : i % 5 === 4 ? "l2only" : "normal",
    note: i % 7 === 6 ? "ゲートウェイの IP を持つ機器がない" : undefined,
    taps:
      i % 7 === 6 || i % 5 === 4
        ? []
        : [
            { railId, text: ".1 VIP .2 · DHCP" },
            ...(i % 4 === 0
              ? [{ railId: ladderManyRails[(i + 1) % 3]!.id, text: ".3" }]
              : []),
          ],
  };
});

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
  "triangle-alert": true,
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
        footer={
          <>
            <ButtonLink href="#previous" size="md" icon="arrow-left">
              拠点一覧へ戻る
            </ButtonLink>
            <ButtonLink
              href="#next"
              size="md"
              variant="primary"
              icon="arrow-right"
            >
              次へ：機器設定
            </ButtonLink>
          </>
        }
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
          use="Shell は左ペインとページの枠で、画面は Page を1つ入れます。見出しの行は PageTitle（何の画面かを添えるときは「subtitle」。この見本の見出しの右）、白い面は Card、現在位置は Crumbs（Page に渡した経路から描かれる）です。Card の上端にタブを置くときは CardHead に下線のタブ（Tabs の「underline」）を入れ、その面が何を並べるかの案内は「note」で右に添えます。タブのない Card には使いません。Page の「footer」は、本文の下端に固定される帯（本文がスクロールしても動かない。この見本の画面の下端）で、工程や画面を前後に移るボタンを置きます（前へ・戻るは左端、次へは右端）。保存や削除のような操作は置かず、本文の中か Modal の下端の帯に置きます。"
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
          use="Pill は状態、Tag は拠点番号・種別などの付属情報、SaveStatus は保存の状態を示します。Pill の文字は必須（文字列）で、状態は色だけでなく文字でも読めるようにします（アイコンや数だけの Pill は作らない）。Pill と SaveStatus の根には状態を表す「data-state」が付きます（どの状態にも文字があることを、検査が属性で探せるようにするため）。EmptyState は一覧や表が空のときに置く部品で、理由や次の手順は「support」（小さい2行目）に書きます。Notice の代わりにはしません。"
        >
          {(["md", "sm"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              {pillTones.map((tone) => (
                <Pill key={tone} tone={tone} size={size}>
                  {`${tone} ${size}`}
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
          use="機器設定の入力用の表で、行は40px、横にスクロールします。列が多く横にあふれる表で、1列目が行の名前（ポート名など）のときは「stickyFirstColumn」で1列目を左端に固定します（列が少ない表や、1列目が名前でない表には付けません）。読むだけの一覧には使わず、一覧の表（Table）を使います。SectionHeader は表の節の見出しと「追加」ボタンです。指摘の出し方（invalid と DenseRowMessages）と、中身の幅で左寄せにする「fit」は次の節にあります。"
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
                  invalid
                  describedBy="gallery-vlan-messages"
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
            <DenseRowMessages
              subtle
              id="gallery-vlan-messages"
              messages={[{ field: "VLAN ID", message: "指定可能：1-4094" }]}
            />
          </DenseTable>
          <SectionHeader title="LAN（1列目を固定）" level={3} />
          <DenseTable
            label="1列目を固定した表の例"
            minWidth={1200}
            stickyFirstColumn
            columns={[
              { id: "port", header: "ポート" },
              { id: "ip", header: "IPアドレス" },
              { id: "mask", header: "ネットワーク" },
              { id: "vlan", header: "VLAN ID" },
              { id: "kind", header: "種別" },
              { id: "dhcp", header: "DHCP" },
              { id: "note", header: "備考" },
            ]}
          >
            {["LAN1", "LAN2", "LAN3"].map((port, i) => (
              <DenseRow key={port} subtle={i === 1}>
                <DenseRowHead>{port}</DenseRowHead>
                <DenseCell>
                  <CellInput
                    label={`${port} のIPアドレス`}
                    kind="ip"
                    value={`192.0.2.${i + 1}`}
                    onChange={() => {}}
                  />
                </DenseCell>
                <DenseCell>
                  <CellInput
                    label={`${port} のネットワーク`}
                    kind="network"
                    value="192.0.2.0/24"
                    onChange={() => {}}
                  />
                </DenseCell>
                <DenseCell>
                  <CellInput
                    label={`${port} のVLAN ID`}
                    kind="vlan"
                    value={String(100 + i)}
                    onChange={() => {}}
                  />
                </DenseCell>
                <DenseCell tone="body" nowrap>
                  通常
                </DenseCell>
                <DenseCell>
                  <Check
                    label={`${port} のDHCP`}
                    value={i === 0}
                    onChange={() => {}}
                  />
                </DenseCell>
                <DenseCell />
              </DenseRow>
            ))}
          </DenseTable>
        </Section>

        <Section
          title="表の指摘と幅"
          parts={["DenseRowMessages"]}
          use="機器設定の表で、入力欄に対するサーバーの指摘を出します。欄には CellInput・Pick の「invalid」で赤枠だけを付け、文は行の直下の DenseRowMessages に、表の幅いっぱいで折り返して出します（欄の下に文を出す CellInput の「error」だと、列が文の長さまで広がるので使いません）。文の頭には欄の名前を「名前：文」の形で付けるので、messages には「field」（欄の名前）と「message」（文）の組を渡します（欄に結び付かない行の指摘は文字列のまま渡します）。同じ文は1回だけ出し、指摘が無ければ何も描きません。指摘ではなく注意（直さなくても保存・確認は進められるもの）は、messages の組に「tone」の「warn」を付けます。琥珀色の三角のアイコンで出し（読み上げには「注意：」が付く）、赤い丸の指摘と形でも見分けられます。注意には欄の赤枠（invalid）を付けず、文だけを出します。指摘でも注意でもない補足（読んでおくと分かりやすいが、直す必要のないこと。例：直接書いた範囲がどこに当たるか）は、「tone」の「note」を付けます。アイコンはなく、本文の淡い色と本文の太さで出るので、指摘と注意より目立ちません。補足は欄の赤枠を付けず、読み上げにも「注意：」を付けません。指摘・注意・補足が並ぶときは、この順に並べます。直前の行の下罫線は消えて、2行がひとつに見えます。表の「fit」は、表を中身の幅で止めて左に寄せ、見出しとセルを左寄せにします（既定は画面の幅いっぱいで中央寄せ）。入力欄の幅は「kind」で決まり、入る文字数（text は名前の半角20文字、ip は15文字、interface・network は18文字、vlan は4桁、vrid は3桁）を1か所の表で持つので、画面は幅を指定しません。"
        >
          <SectionHeader
            title="指摘のある表（fit・赤枠だけ＋行の下の文）"
            level={3}
          />
          <DenseTable
            fit
            label="指摘のある表の例"
            columns={[
              { id: "name", header: "名前" },
              { id: "ip", header: "IPアドレス" },
              { id: "network", header: "ネットワーク" },
              { id: "vlan", header: "VLAN ID" },
              { id: "type", header: "種別" },
              { id: "note", header: "備考" },
            ]}
          >
            <DenseRow>
              <DenseRowHead>LAN1</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="LAN1 のIPアドレス"
                  kind="ip"
                  value="192.0.2.1"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN1 のネットワーク"
                  kind="network"
                  value="192.0.2.0/24"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN1 のVLAN ID"
                  kind="vlan"
                  value="100"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <Pick
                  label="LAN1 の種別"
                  value="a"
                  onChange={() => {}}
                  options={[
                    ["a", "通常"],
                    ["b", "管理"],
                  ]}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN1 の備考"
                  value="本社側"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
            <DenseRow>
              <DenseRowHead>LAN2</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="LAN2 のIPアドレス"
                  kind="ip"
                  value="192.0.2.300"
                  invalid
                  describedBy="gallery-lan2-messages"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN2 のネットワーク"
                  kind="network"
                  value="192.0.2.5/24"
                  invalid
                  describedBy="gallery-lan2-messages"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN2 のVLAN ID"
                  kind="vlan"
                  value="100"
                  invalid
                  describedBy="gallery-lan2-messages"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <Pick
                  label="LAN2 の種別"
                  value=""
                  invalid
                  describedBy="gallery-lan2-messages"
                  onChange={() => {}}
                  options={[
                    ["a", "通常"],
                    ["b", "管理"],
                  ]}
                />
              </DenseCell>
              <DenseCell>
                <CellInput label="LAN2 の備考" value="" onChange={() => {}} />
              </DenseCell>
            </DenseRow>
            <DenseRowMessages
              id="gallery-lan2-messages"
              messages={[
                { field: "IPアドレス", message: "形式を確認" },
                {
                  field: "ネットワーク",
                  message:
                    "ホストビットが立っています。ネットワークアドレス（192.0.2.0/24）で入力してください。",
                },
                { field: "IPアドレス", message: "形式を確認" },
                {
                  field: "VLAN ID",
                  message: "同じ拠点の LAN1 と重複しています",
                },
                { field: "種別", message: "選んでください" },
                "この行は LAN1 と同じネットワークを使っているため、どちらかを変更してください。同じ拠点の2つの LAN に同じネットワークは置けません。",
                {
                  field: "備考",
                  message: "前の行と同じ内容です。消してかまいません",
                  tone: "warn",
                },
                {
                  field: "ネットワーク 198.51.100.0/24",
                  message: "ほかの拠点「見本支店」のVLAN 10（業務）",
                  tone: "note",
                },
              ]}
            />
            <DenseRow subtle>
              <DenseRowHead>LAN3</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="LAN3 のIPアドレス"
                  kind="ip"
                  value="198.51.100.1"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN3 のネットワーク"
                  kind="network"
                  value="198.51.100.0/24"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell>
                <CellInput
                  label="LAN3 のVLAN ID"
                  kind="vlan"
                  value="4095"
                  invalid
                  describedBy="gallery-lan3-messages"
                  onChange={() => {}}
                />
              </DenseCell>
              <DenseCell tone="body" nowrap>
                通常
              </DenseCell>
              <DenseCell />
            </DenseRow>
            <DenseRowMessages
              subtle
              id="gallery-lan3-messages"
              messages={[{ field: "VLAN ID", message: "指定可能：1-4094" }]}
            />
          </DenseTable>

          <SectionHeader title="入力の種類と幅（fit）" level={3} />
          <DenseTable
            fit
            label="入力の種類と幅の例"
            columns={[
              { id: "kind", header: "種類（kind）" },
              { id: "input", header: "入る最大の値" },
            ]}
          >
            <DenseRow>
              <DenseRowHead>名前（text・20文字）</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="名前の例"
                  value="見本拠点（東京）第二ビル"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
            <DenseRow>
              <DenseRowHead>IPアドレス（ip・15文字）</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="IPアドレスの例"
                  kind="ip"
                  value="255.255.255.255"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
            <DenseRow>
              <DenseRowHead>
                IP／プレフィックス長（interface・18文字）
              </DenseRowHead>
              <DenseCell>
                <CellInput
                  label="IP／プレフィックス長の例"
                  kind="interface"
                  value="255.255.255.255/32"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
            <DenseRow>
              <DenseRowHead>ネットワーク（network・18文字）</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="ネットワークの例"
                  kind="network"
                  value="255.255.255.255/32"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
            <DenseRow>
              <DenseRowHead>VLAN ID（vlan・4桁）</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="VLAN ID の例"
                  kind="vlan"
                  value="4094"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
            <DenseRow>
              <DenseRowHead>VRID（vrid・3桁）</DenseRowHead>
              <DenseCell>
                <CellInput
                  label="VRID の例"
                  kind="vrid"
                  value="255"
                  onChange={() => {}}
                />
              </DenseCell>
            </DenseRow>
          </DenseTable>
        </Section>

        <Section
          title="設定の本文"
          parts={["CodeBlock"]}
          use="生成した Config や設計データの JSON のような、整形済みの長い文字列をそのまま見せます。等幅・折り返しなしで、横にあふれるときは枠の中をスクロールします（キーボードでも枠にフォーカスして動かせる）。「label」は枠の名前（読み上げ）で必須です。短い値や、読むだけの項目の組には DescriptionList を使い、編集する値には使いません。"
        >
          <CodeBlock label="設計データの例">
            {`{
  "site": "001",
  "model": "RT-A100",
  "deviceCount": 1,
  "note": "一行が長いときは折り返さず、枠の中を横にスクロールします。見本拠点 1 の補足を、ここでは長く書いておきます。"
}`}
          </CodeBlock>
        </Section>

        <Section
          title="物理構成の作図"
          parts={[
            "DiagramFrame",
            "DiagramDevice",
            "DiagramPort",
            "DiagramRouteError",
          ]}
          use="物理構成の作図の見た目です。DiagramFrame が作図の枠（React Flow はこの中に置く）、DiagramDevice が機器の箱、DiagramPort が箱の中のポート（使用中は塗り、光は破線。React Flow の Handle は DiagramPort の中身として渡す）、DiagramRouteError は配線できないときの印と理由（svg の中に描く）です。ポートを上段・下段・右端の列のどれに置くかは配線の向きで決まるので、呼び出し側が並べて渡します。この部品は @xyflow/react を読み込まず、箱の寸法は「diagramGeometry」（整列の見積もりも同じ値を読む）にあります。作図以外の画面には使いません（機器の一覧や接続の表は Table を使う）。この見本は React Flow を使わず、箱を並べただけです。"
        >
          <DiagramFrame describedBy="diagram-help">
            <div className="flex items-start gap-16 p-10">
              <DiagramDevice
                name="見本ルーター 1"
                model="RT-A100"
                selected
                columns={6}
                upper={[
                  <DiagramPort
                    key="1"
                    label="1"
                    used
                    title="ポート 1 · 銅線"
                  />,
                  <DiagramPort key="2" label="2" title="ポート 2 · 銅線" />,
                  <DiagramPort key="3" label="3" title="ポート 3 · 銅線" />,
                ]}
                lower={[
                  <DiagramPort key="4" label="4" title="ポート 4 · 銅線" />,
                  <DiagramPort key="5" label="5" title="ポート 5 · 銅線" />,
                  <DiagramPort key="6" label="6" fiber title="ポート 6 · 光" />,
                ]}
              />
              <DiagramDevice
                name="見本スイッチ 1"
                model="SW-B24"
                columns={4}
                upper={[
                  <DiagramPort
                    key="1"
                    label="1"
                    used
                    fiber
                    title="ポート 1 · 光"
                  />,
                  <DiagramPort key="2" label="2" title="ポート 2 · 銅線" />,
                  <DiagramPort key="3" label="3" title="ポート 3 · 銅線" />,
                  <DiagramPort key="4" label="4" title="ポート 4 · 銅線" />,
                ]}
                column={[
                  <DiagramPort key="s1" label="S1" title="スロット 1" />,
                  <DiagramPort key="s2" label="S2" title="スロット 2" />,
                ]}
              />
            </div>
            <svg
              aria-hidden="true"
              width="320"
              height="64"
              className="absolute top-40 left-10"
            >
              <DiagramRouteError
                x={16}
                y={40}
                message="配線の経路が見つかりません"
              />
            </svg>
          </DiagramFrame>
          <SupportText>
            <span id="diagram-help">
              機器の箱を並べた見本です（左は選択中、下の印は配線できないとき）。
            </span>
          </SupportText>
        </Section>

        <Section
          title="論理接続図"
          parts={["LadderDiagram"]}
          use="拠点のルーティングする機器（縦の線）と、台帳の VLAN（横の帯）の交点に、その機器が持つ IP を点と文字で描くはしご図です。どの機器がどのセグメントに IP を持つかを一目で見るときに使います。受け取るのは導いた結果（「rails」「bands」「taps」）だけで、IP の求め方や食い違いの判定は呼び出し側（サーバー）が行い、この部品は検証しません。帯の「tone」は、「normal」が通常、「warn」が注意させたい帯（琥珀色。理由を「note」に書く）、「l2only」がサブネットのない L2 だけの帯（破線）です。「top」は上の破線の楕円（WAN など対象外のもの。最初の縦の線につなぐ）、「footer」は下の一覧（静的経路など。見出しは「footerLabel」）です。行の高さと縦の線の間隔は一定で、帯が増えれば縦に、機器が増えれば横に伸び、横は枠の中でスクロールします。絵は読み上げに出さず、同じ内容の表（読み上げ専用）を部品が併せて持ちます。React Flow は使いません。物理構成の配線の作図には Diagram の部品を、機器や接続の一覧には Table を使います。"
        >
          <LadderDiagram
            label="論理接続図の例"
            rails={ladderRails}
            bands={ladderBands}
            top={{ label: "WAN（対象外）" }}
            footer={ladderFooter}
            footerLabel="静的経路"
          />
          <SupportText>
            帯が多く縦の線が3本の例です（20本の帯。枠の中を横にスクロールできます）。
          </SupportText>
          <LadderDiagram
            label="帯の多い論理接続図の例"
            rails={ladderManyRails}
            bands={ladderManyBands}
            top={{ label: "WAN（対象外）" }}
          />
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
