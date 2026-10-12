import "@nd/ui/styles.css";
import { StrictMode, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  ButtonLink,
  Card,
  CellInput,
  Check,
  Checkbox,
  CheckboxInput,
  ConfirmDialog,
  DenseCell,
  DenseRow,
  DenseRowHead,
  DenseTable,
  Disclosure,
  EmptyState,
  Field,
  IconButton,
  Input,
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
  Stepper,
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
  type NoticeTone,
  type PillTone,
  type SaveState,
  type TabsVariant,
  type TagTone,
} from "@nd/ui";

// A page that shows every component in every state. It is not part of the app build: open it
// with the dev server at /packages/ui/gallery/. ?open=modal|confirm|menu|popover opens that
// overlay on load. Only layout classes are used here; the look comes from the components.

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

const opened = new URLSearchParams(location.search).get("open");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card label={title} className="flex flex-col gap-4 p-6">
      <SectionHeader title={title} level={2} />
      {children}
    </Card>
  );
}

function Gallery() {
  const [variantTab, setVariantTab] = useState<Record<string, string>>({});
  const [name, setName] = useState("見本拠点");
  const [vlan, setVlan] = useState("4096");
  const [kind, setKind] = useState("a");
  const [checked, setChecked] = useState(true);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(opened === "modal");
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
        <PageTitle title="部品の見本">
          <Button
            variant="primary"
            size="lg"
            icon="plus"
            onClick={() => setModal(true)}
          >
            モーダルを開く
          </Button>
        </PageTitle>

        <Section title="お知らせ（Notice）">
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
          <Button
            size="sm"
            className="self-start"
            onClick={() => setStatus(null)}
          >
            状態の行を消す
          </Button>
        </Section>

        <Section title="ボタン（Button・ButtonLink・IconButton）">
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
        </Section>

        <Section title="入力（Field・Input・Select・Textarea・Checkbox）">
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
          </div>
        </Section>

        <Section title="状態（Pill・Tag・SaveStatus・EmptyState）">
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
        </Section>

        <Section title="タブと工程（Tabs・Stepper）">
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

        <Section title="開閉（Disclosure）">
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

        <Section title="機器設定の表（DenseTable）">
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

        <Section title="メニューと浮き枠（Menu・Popover）">
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
            <Button onClick={() => setConfirm(true)}>確認を開く</Button>
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
        </Section>

        <Section title="一覧の表（Table）">
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
