// 用 Playwright 以 iPhone 尺寸测试网页。
// 运行：npm i -D playwright && npx playwright install webkit chromium && node tests/iphone.test.cjs
const http = require("http");
const fs = require("fs");
const path = require("path");
const { webkit, chromium, devices } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SHOTS = path.join(ROOT, "test-results");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png" };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv)));
}

let failures = 0;
function check(cond, msg) { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; }

async function swipe(page, dx) {
  const box = await page.locator("#menu").boundingBox();
  const y = box.y + 120, x0 = box.x + box.width / 2;
  await page.dispatchEvent("#menu", "touchstart", { touches: [{ identifier: 1, clientX: x0, clientY: y }], changedTouches: [{ identifier: 1, clientX: x0, clientY: y }] });
  await page.dispatchEvent("#menu", "touchend", { touches: [], changedTouches: [{ identifier: 1, clientX: x0 + dx, clientY: y + 5 }] });
}

async function run(browserType, deviceName, scheme) {
  const browser = await browserType.launch();
  const ctx = await browser.newContext({ ...devices[deviceName], colorScheme: scheme, locale: "zh-CN", timezoneId: "America/Chicago" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const tag = `${browserType.name()}-${deviceName.replace(/\s+/g, "")}-${scheme}`;
  console.log(`\n== ${tag} ==`);

  await page.goto(`${base}/cafeteria/`);
  await page.waitForSelector(".station, .empty-state");
  const today = await page.evaluate(() => { const d = new Date(); return d.getDate(); });
  check(await page.locator('.dates [aria-selected="true"] .dd').innerText() == String(today), "默认选中今天");
  const meal = await page.locator('.meals [aria-selected="true"]').innerText();
  check(["早餐", "午餐", "晚餐"].includes(meal), `按时间自动选餐次：${meal}`);
  check(await page.locator(".halls button").count() === 5, "显示 5 个食堂");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "没有横向滚动");
  await page.screenshot({ path: path.join(SHOTS, `${tag}-1-home.png`), fullPage: false });

  // 切到午餐，确认有窗口和菜
  await page.click('.meals [data-meal="lunch"]');
  await page.waitForSelector(".station");
  const stations = await page.locator(".station").count();
  check(stations > 0, `午餐有 ${stations} 个窗口`);
  const firstStation = await page.locator(".station h2").first().innerText();
  check(!/Build Your Own/i.test(firstStation), `窗口名正确：${firstStation.split("\n")[0]}`);
  check(await page.locator(".item .cal").count() > 0, "显示热量");
  check(await page.locator(".alg").first().innerText().then((t) => t.startsWith("含：")), "显示中文过敏原");
  check(!(await page.content()).includes("OrderIt"), "过滤掉 OrderIt");

  // 切换食堂并记住
  await page.click(".halls button:nth-child(3)");
  const chosen = await page.locator('.halls [aria-pressed="true"]').innerText();
  await page.reload();
  await page.waitForSelector(".station, .empty-state");
  check(await page.locator('.halls [aria-pressed="true"]').innerText() === chosen, `localStorage 记住食堂：${chosen}`);
  await page.click('.meals [data-meal="lunch"]');

  // 筛选
  const before = await page.locator(".item").count();
  await page.click('[data-f="vegan"]');
  const after = await page.locator(".item").count();
  const allVegan = await page.locator(".item").evaluateAll((els) => els.every((e) => e.querySelector(".tag.vegan")));
  check(after <= before && allVegan, `纯素筛选：${before} → ${after}，全部带纯素标签`);
  await page.screenshot({ path: path.join(SHOTS, `${tag}-2-vegan.png`) });
  await page.click('[data-f="vegan"]');

  // 滑动换一天
  const d0 = await page.locator('.dates [aria-selected="true"]').getAttribute("data-date");
  await swipe(page, -150);
  await page.waitForTimeout(300);
  const d1 = await page.locator('.dates [aria-selected="true"]').getAttribute("data-date");
  check(d1 > d0, `左滑到下一天：${d0} → ${d1}`);
  await swipe(page, 150);
  await page.waitForTimeout(300);
  check(await page.locator('.dates [aria-selected="true"]').getAttribute("data-date") === d0, "右滑回到前一天");

  // 下一周
  await page.click("#nextWeek");
  const d7 = await page.locator('.dates [aria-selected="true"]').getAttribute("data-date");
  check(d7 > d1 && (await page.locator("#nextWeek").isDisabled()), `翻到第二周：${d7}`);
  await page.click("#todayBtn");

  // 搜索
  await page.fill("#q", "鸡肉");
  await page.waitForTimeout(400);
  const n = await page.locator(".item .where").count();
  const where = n ? await page.locator(".item .where").first().innerText() : "";
  check(n > 0 && where.split(" · ").length === 3, `搜索 鸡肉：${n} 个结果，例如“${where}”`);
  await page.screenshot({ path: path.join(SHOTS, `${tag}-3-search.png`) });
  await page.click("#clearQ");

  // Motion 动效已加载：餐次白条对准选中的标签
  const ink = await page.evaluate(() => {
    const i = document.querySelector(".meal-ink"), on = document.querySelector('.meals [aria-selected="true"]');
    if (!document.documentElement.classList.contains("has-motion") || !i) return null;
    return Math.abs(i.getBoundingClientRect().left - on.getBoundingClientRect().left) < 2;
  });
  check(ink === true, "Motion 动效已加载，餐次白条对准选中标签");

  // 奶娃大厨
  await page.waitForSelector("#chef:not([hidden])");
  const chefText = await page.locator("#chef .chef-bubble").innerText();
  check(/最好去|还没出来/.test(chefText), `奶娃大厨出现：${chefText.replace(/\s+/g, " ").slice(0, 70)}…`);
  await page.waitForTimeout(1200);
  await page.locator("#chef").screenshot({ path: path.join(SHOTS, `${tag}-5-chef.png`) });
  if (await page.locator("#chef .chef-go").count()) {
    const target = await page.locator("#chef .chef-go").getAttribute("data-hall");
    await page.click("#chef .chef-go");
    await page.waitForTimeout(300);
    const chosenSlug = await page.locator('.halls [aria-pressed="true"]').getAttribute("data-hall");
    check(chosenSlug === target, `点“就去这家”切到 ${target}`);
  }
  await page.click("#chef .chef-x");
  await page.waitForTimeout(400);
  check(await page.locator("#chef").isHidden(), "关掉奶娃大厨");
  await page.reload();
  await page.waitForSelector(".station, .empty-state");
  await page.waitForTimeout(300);
  check(await page.locator("#chef").isHidden(), "这一餐关掉后刷新也不再出现");
  await page.evaluate(() => localStorage.removeItem("uwdining.chef"));

  // 地图：从页面下方点“地图”，要自动滚到地图
  await page.click('.meals [data-meal="dinner"]');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.click("#mapBtn");
  await page.waitForTimeout(900);
  const mapInView = await page.evaluate(() => { const r = document.querySelector("#mapBox").getBoundingClientRect(); return r.top >= 0 && r.top < window.innerHeight; });
  check(mapInView, "从页面底部打开地图，会自动滚到地图");
  await page.waitForSelector(".m-hall");
  check(await page.locator(".m-hall").count() === 5, "地图上有 5 个食堂");
  await page.locator('.m-hall[data-hall="rhetas-market"] .pin').click();
  await page.waitForSelector("#mapCard:not([hidden])");
  const dishes = await page.locator("#mapCard li b").allInnerTexts();
  check(dishes.length > 0, `点 Rheta's 显示硬菜：${dishes.join("、")}`);
  const inside = await page.evaluate(() => { const b = document.querySelector("#mapBox").getBoundingClientRect(), c = document.querySelector("#mapCard").getBoundingClientRect(); return c.left >= b.left - 1 && c.right <= b.right + 1; });
  check(inside, "卡片没有超出地图");
  await page.locator("#mapPanel").screenshot({ path: path.join(SHOTS, `${tag}-4-map.png`) });
  await page.click("#mapCard .go");
  check(await page.locator('.halls [aria-pressed="true"]').innerText() === "Rheta's", "点卡片按钮切到 Rheta's 菜单");
  await page.click("#mapBtn");

  // PWA
  const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
  check(manifest.display === "standalone" && manifest.icons.length >= 3, "manifest 有效");
  if (browserType.name() === "chromium") {
    const swOk = await page.evaluate(async () => !!(await navigator.serviceWorker.ready));
    check(swOk, "service worker 已激活");
    await page.reload(); // 让 SW 接管并缓存数据
    await page.waitForSelector(".station, .empty-state");
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector(".station, .empty-state");
    check(await page.locator(".station").count() > 0, "离线时从缓存打开");
    await ctx.setOffline(false);
  }
  check(errors.length === 0, `没有控制台错误${errors.length ? "：" + errors.join(" | ") : ""}`);
  await browser.close();
}

// 电脑上：鼠标悬停就显示硬菜，移开就消失
async function desktopHover() {
  console.log("\n== chromium-desktop-hover ==");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/cafeteria/`);
  await page.waitForSelector(".station, .empty-state");
  await page.click("#mapBtn");
  await page.locator('.m-hall[data-hall="gordon-avenue-market"] .pin').hover();
  await page.waitForSelector("#mapCard:not([hidden])");
  check((await page.locator("#mapCard h3").innerText()).includes("Gordon"), "悬停 Gordon 显示卡片");
  await page.locator("#mapPanel").screenshot({ path: path.join(SHOTS, "desktop-hover-map.png") });
  await page.mouse.move(5, 890);
  await page.waitForTimeout(200);
  check(await page.locator("#mapCard").isHidden(), "鼠标移开后卡片消失");
  await page.reload();
  await page.waitForSelector(".m-hall");
  check(await page.locator("#mapPanel").isVisible(), "localStorage 记住地图是打开的");
  await browser.close();
}

let base;
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const srv = await serve();
  base = `http://127.0.0.1:${srv.address().port}`;
  try {
    await run(webkit, "iPhone 15", "light");
    await run(webkit, "iPhone SE", "dark");
    await run(chromium, "iPhone 15", "light"); // WebKit 驱动下 SW 支持有限，用 Chromium 测离线
    await desktopHover();
  } finally {
    srv.close();
  }
  console.log(failures ? `\n${failures} 项失败` : "\n全部通过");
  process.exit(failures ? 1 : 0);
})();
