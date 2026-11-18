"use strict";
(() => {
  const MEALS = ["breakfast", "lunch", "dinner"];
  const MEAL_ZH = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
  const WEEK_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const DIET = {
    Vegan: { zh: "纯素", cls: "vegan" },
    Vegetarian: { zh: "素食", cls: "veg" },
    Halal: { zh: "清真", cls: "halal" },
    "Top 9 Free": { zh: "无常见过敏原", cls: "top9" },
  };
  const ALLERGEN_ZH = {
    Dairy: "乳制品", Milk: "牛奶", Wheat: "小麦", Gluten: "麸质", Soy: "大豆", Egg: "鸡蛋", Eggs: "鸡蛋",
    Fish: "鱼", Shellfish: "甲壳类海鲜", Sesame: "芝麻", Corn: "玉米", Coconut: "椰子",
    Peanut: "花生", Peanuts: "花生", "Tree Nut": "坚果", "Tree Nuts": "坚果", Pork: "猪肉",
    Mustard: "芥末", Alcohol: "酒精", Celery: "芹菜", Sulfites: "亚硫酸盐",
  };
  const FILTERS = {
    veg: (it) => has(it, "Vegetarian") || has(it, "Vegan"),
    vegan: (it) => has(it, "Vegan"),
    halal: (it) => has(it, "Halal"),
    top9: (it) => has(it, "Top 9 Free"),
  };
  const LS_HALL = "uwdining.hall";
  const LS_FILTERS = "uwdining.filters";

  const $ = (s) => document.querySelector(s);
  const el = {
    halls: $("#halls"), dates: $("#dates"), meals: $("#meals"), menu: $("#menu"),
    prev: $("#prevWeek"), next: $("#nextWeek"), today: $("#todayBtn"),
    q: $("#q"), clearQ: $("#clearQ"), filters: $("#filters"), toast: $("#toast"),
  };

  function has(it, tag) { return (it.d || []).includes(tag); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* 隐私模式 */ } }
  function iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function parseIso(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function addDays(s, n) { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function mealForNow(now = new Date()) {
    const m = now.getHours() * 60 + now.getMinutes();
    if (m < 10 * 60 + 30) return "breakfast";
    if (m < 14 * 60 + 30) return "lunch";
    return "dinner";
  }
  function shortHall(name) { return name.replace(/\s*Market$/i, ""); }
  function noteZh(note) {
    const m = /Available Between\s+(\S+)\s*-\s*(\S+)/i.exec(note || "");
    return m ? `供应时间 ${m[1]}–${m[2]}` : note || "";
  }
  function allergenText(it) {
    const a = (it.a || []).map((x) => ALLERGEN_ZH[x] || x);
    return a.length ? `含：${[...new Set(a)].join("、")}` : "";
  }

  const todayIso = iso(new Date());
  const DAYS = 14;
  const state = {
    halls: [],
    hall: lsGet(LS_HALL),
    date: todayIso,
    meal: mealForNow(),
    filters: new Set((lsGet(LS_FILTERS) || "").split(",").filter((f) => FILTERS[f])),
    q: "",
    cache: new Map(),
  };
  const dateList = Array.from({ length: DAYS }, (_, i) => addDays(todayIso, i));

  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  function loadDay(date) {
    if (!state.cache.has(date)) {
      const p = loadJSON(`data/${date}.json`).catch(() => null);
      state.cache.set(date, p);
    }
    return state.cache.get(date);
  }

  // ---------- 渲染顶部 ----------
  function renderHalls() {
    el.halls.innerHTML = state.halls.map((h) =>
      `<button type="button" data-hall="${esc(h.slug)}" aria-pressed="${h.slug === state.hall}">${esc(shortHall(h.name))}</button>`
    ).join("");
    const on = el.halls.querySelector('[aria-pressed="true"]');
    if (on) on.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function weekIndex() { return Math.floor(dateList.indexOf(state.date) / 7); }
  function renderDates() {
    const w = Math.max(0, weekIndex());
    const slice = dateList.slice(w * 7, w * 7 + 7);
    el.dates.innerHTML = slice.map((d) => {
      const dt = parseIso(d);
      const label = d === todayIso ? "今天" : WEEK_ZH[dt.getDay()];
      return `<button type="button" role="tab" data-date="${d}" aria-selected="${d === state.date}"
        class="${d === todayIso ? "is-today" : ""}" aria-label="${dt.getMonth() + 1}月${dt.getDate()}日 ${WEEK_ZH[dt.getDay()]}">
        <span class="dw">${label}</span><span class="dd">${dt.getDate()}</span></button>`;
    }).join("");
    el.prev.disabled = w === 0;
    el.next.disabled = w >= Math.ceil(DAYS / 7) - 1;
    el.today.hidden = state.date === todayIso;
  }
  function renderMeals(day) {
    const hallData = day && day.halls && day.halls[state.hall];
    el.meals.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.meal === state.meal);
      b.setAttribute("role", "tab");
      b.classList.toggle("empty", !!day && !(hallData && hallData[b.dataset.meal]));
    });
  }
  function renderFilters() {
    el.filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", state.filters.has(b.dataset.f)));
  }

  // ---------- 渲染菜品 ----------
  function passes(it) { for (const f of state.filters) if (!FILTERS[f](it)) return false; return true; }
  function itemHTML(it, where) {
    const tags = ["Vegan", "Vegetarian", "Halal", "Top 9 Free"]
      .filter((t) => has(it, t) && !(t === "Vegetarian" && has(it, "Vegan")))
      .map((t) => `<span class="tag ${DIET[t].cls}">${DIET[t].zh}</span>`).join("");
    const alg = allergenText(it);
    return `<div class="item">
      <div class="row"><span class="name">${esc(it.zh || it.n)}</span>${it.cal != null ? `<span class="cal">${it.cal} 千卡</span>` : ""}</div>
      ${it.zh ? `<div class="en" lang="en">${esc(it.n)}</div>` : ""}
      ${where ? `<div class="where">${esc(where)}</div>` : ""}
      ${tags ? `<div class="tags">${tags}</div>` : ""}
      ${alg ? `<div class="alg">${esc(alg)}</div>` : ""}
    </div>`;
  }
  function emptyHTML(icon, text) { return `<div class="empty-state"><div class="big">${icon}</div>${esc(text)}</div>`; }

  function renderMenu(day) {
    if (state.q) return renderSearch(day);
    if (!day) return void (el.menu.innerHTML = emptyHTML("📭", "暂时没有这一天的菜单数据"));
    const stations = ((day.halls[state.hall] || {})[state.meal]) || [];
    const hallName = (state.halls.find((h) => h.slug === state.hall) || {}).name || "";
    if (!stations.length) {
      return void (el.menu.innerHTML = emptyHTML("🍽️", `${hallName} 这一天没有${MEAL_ZH[state.meal]}`));
    }
    let total = 0, shown = 0;
    const html = stations.map((st) => {
      const items = st.items.filter(passes);
      total += st.items.length; shown += items.length;
      if (!items.length) return "";
      return `<section class="station"><h2>${esc(st.name)}${st.note ? `<small>${esc(noteZh(st.note))}</small>` : ""}</h2>
        ${items.map((it) => itemHTML(it)).join("")}</section>`;
    }).join("");
    const d = parseIso(state.date);
    const sum = `<p class="summary">${d.getMonth() + 1}月${d.getDate()}日 ${WEEK_ZH[d.getDay()]} · ${esc(hallName)} · ${MEAL_ZH[state.meal]} · ${
      state.filters.size ? `筛选后 ${shown} / ${total} 道菜` : `${total} 道菜`}</p>`;
    el.menu.innerHTML = sum + (shown ? html : emptyHTML("🔍", "没有符合筛选条件的菜")) +
      `<p class="hint">在菜单区域左右滑动可以切换日期</p>`;
  }

  function renderSearch(day) {
    if (!day) return void (el.menu.innerHTML = emptyHTML("📭", "暂时没有这一天的菜单数据"));
    const q = state.q.toLowerCase();
    const results = [];
    for (const h of state.halls) {
      const hd = day.halls[h.slug] || {};
      for (const meal of MEALS) for (const st of hd[meal] || []) for (const it of st.items) {
        if ((it.n.toLowerCase().includes(q) || (it.zh || "").includes(state.q)) && passes(it)) {
          results.push({ it, where: `${shortHall(h.name)} · ${MEAL_ZH[meal]} · ${st.name}` });
        }
      }
    }
    const d = parseIso(state.date);
    el.menu.innerHTML = `<p class="summary">${d.getMonth() + 1}月${d.getDate()}日 所有食堂中搜索“${esc(state.q)}”：${results.length} 个结果</p>` +
      (results.length
        ? `<section class="station">${results.map((r) => itemHTML(r.it, r.where)).join("")}</section>`
        : emptyHTML("🔍", "没有找到，换个关键词试试，例如 鸡肉、豆腐、pizza"));
  }

  let renderToken = 0;
  async function render(anim) {
    renderDates(); renderFilters(); renderHalls();
    const token = ++renderToken;
    const day = await loadDay(state.date);
    if (token !== renderToken) return;
    renderMeals(day);
    renderMenu(day);
    if (state.mapOpen) renderMap(day);
    if (anim) {
      el.menu.classList.remove("slide-l", "slide-r");
      void el.menu.offsetWidth;
      el.menu.classList.add(anim);
    }
    // 预取相邻日期
    const i = dateList.indexOf(state.date);
    [dateList[i - 1], dateList[i + 1]].forEach((d) => d && loadDay(d));
  }

  function toast(msg) {
    el.toast.textContent = msg; el.toast.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (el.toast.hidden = true), 1600);
  }
  function shiftDay(n) {
    const i = dateList.indexOf(state.date) + n;
    if (i < 0) return toast("已经是今天了");
    if (i >= dateList.length) return toast("只能查看未来两周的菜单");
    state.date = dateList[i];
    render(n > 0 ? "slide-l" : "slide-r");
  }

  // ---------- 地图 ----------
  // 用经纬度直接投影到 SVG 上（这一小片校园可以当成平面）
  const BOUNDS = { w: -89.4205, e: -89.3945, n: 43.0815, s: 43.0695 };
  const MAP_W = 600, MAP_H = Math.round(MAP_W * ((BOUNDS.n - BOUNDS.s) * 111) / ((BOUNDS.e - BOUNDS.w) * 111 * Math.cos(43.075 * Math.PI / 180)));
  const P = (lat, lng) => [
    +((lng - BOUNDS.w) / (BOUNDS.e - BOUNDS.w) * MAP_W).toFixed(1),
    +((BOUNDS.n - lat) / (BOUNDS.n - BOUNDS.s) * MAP_H).toFixed(1),
  ];
  const line = (pts) => pts.map((p, i) => (i ? "L" : "M") + P(...p).join(",")).join(" ");
  const SHORE = [[43.0796, -89.4205], [43.0793, -89.4178], [43.0789, -89.4140], [43.0791, -89.4112], [43.0788, -89.4085],
    [43.0786, -89.4068], [43.0780, -89.4040], [43.0774, -89.4012], [43.0772, -89.3995], [43.0769, -89.3970], [43.0768, -89.3945]];
  const ROADS = [
    { name: "University Ave", cls: "major", pts: [[43.0731, -89.3945], [43.0731, -89.4080], [43.0738, -89.4130], [43.0745, -89.4205]], label: [43.0727, -89.4110] },
    { name: "Johnson St", cls: "major", pts: [[43.0719, -89.3945], [43.0719, -89.4060]], label: [43.0715, -89.4045] },
    { name: "Park St", cls: "minor", pts: [[43.0773, -89.4003], [43.0695, -89.4003]], label: null },
    { name: "Dayton St", cls: "minor", pts: [[43.0709, -89.3945], [43.0709, -89.4003]], label: [43.0705, -89.3965] },
    { name: "Observatory Dr", cls: "minor", pts: [[43.0757, -89.4003], [43.0760, -89.4035], [43.0770, -89.4060], [43.0768, -89.4095], [43.0763, -89.4135], [43.0766, -89.4180]], label: [43.0758, -89.4125] },
    { name: "Elm Dr", cls: "minor", pts: [[43.0790, -89.4188], [43.0735, -89.4192]], label: null },
    { name: "Babcock Dr", cls: "minor", pts: [[43.0766, -89.4140], [43.0731, -89.4142]], label: null },
  ];
  const LANDMARKS = [
    { name: "Bascom Hall", at: [43.0753, -89.4041] },
    { name: "Memorial Union", at: [43.0768, -89.3998] },
  ];

  function mapSVG() {
    const shore = SHORE.map((p) => P(...p));
    const lake = `M0,0 L${MAP_W},0 L${shore[shore.length - 1].join(",")} ` +
      shore.slice().reverse().map((p) => "L" + p.join(",")).join(" ") + " Z";
    const path = line(SHORE.map(([a, b]) => [a - 0.00035, b]));
    const [bx1, by1] = P(43.0760, -89.4045), [bx2, by2] = P(43.0748, -89.4008);
    const halls = state.halls.filter((h) => h.lat).map((h) => {
      const [x, y] = P(h.lat, h.lng);
      const below = y < 80; // 太靠湖边的标签放到下面
      return `<g class="m-hall${h.slug === state.hall ? " current" : ""}" data-hall="${esc(h.slug)}" tabindex="0" role="button"
          aria-label="${esc(h.name)}，查看今日硬菜" transform="translate(${x},${y})">
        <circle cy="-24" r="30" fill="transparent"/>
        <path class="pin" d="M0,0 C-6,-11 -16,-17 -16,-29 A16,16 0 1 1 16,-29 C16,-17 6,-11 0,0 Z"/>
        <circle class="pin-dot" cy="-29" r="6"/>
        <text y="${below ? 24 : -52}" text-anchor="middle">${esc(shortHall(h.name).replace(/\s*Avenue$/, ""))}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" role="img" aria-label="UW–Madison 校园食堂位置示意图">
      <path class="m-lake" d="${lake}"/>
      <text class="m-lake-label" x="${MAP_W / 2}" y="30" text-anchor="middle">Lake Mendota 门多塔湖</text>
      <rect class="m-green" x="${bx1}" y="${by1}" width="${bx2 - bx1}" height="${by2 - by1}" rx="6"/>
      ${ROADS.map((r) => `<path class="m-road ${r.cls}" d="${line(r.pts)}"/>`).join("")}
      <path class="m-path" d="${path}"/>
      ${ROADS.filter((r) => r.label).map((r) => { const [x, y] = P(...r.label); return `<text class="m-road-label" x="${x}" y="${y}" text-anchor="middle">${r.name}</text>`; }).join("")}
      ${(() => { const [x, y] = P(43.0745, -89.4003); return `<text class="m-road-label" x="${x + 5}" y="${y}" transform="rotate(90 ${x + 5} ${y})">Park St</text>`; })()}
      ${LANDMARKS.map((l) => { const [x, y] = P(...l.at); return `<g class="m-landmark"><circle cx="${x}" cy="${y}" r="3"/><text x="${x}" y="${y + 18}" text-anchor="middle">${l.name}</text></g>`; }).join("")}
      ${halls}
    </svg><div id="mapCard" class="map-card" hidden></div>`;
  }

  const MEAT = /\b(beef|chicken|pork|salmon|shrimp|cod|tilapia|brisket|lamb|turkey|steak|ribs?|fish|mahi|haddock|ham|sausage|kielbasa|meatballs?|gyro|barbacoa|carnitas?|birria|bulgogi|burnt ends|meatloaf|wings?|drumsticks?|tenders)\b/i;
  const NOT_MAIN = /\b(gravy|sauce|egg|eggs|scrambled|pancakes?|popcake|waffle|french toast|salad filling|oatmeal|grits|condiment)\b/i;
  function hardDishes(hallSlug, day, meal, n = 4) {
    const stations = (((day || {}).halls || {})[hallSlug] || {})[meal] || [];
    const best = [];
    for (const st of stations) {
      let top = null, topScore = -1;
      for (const it of st.items) {
        if (!it.m || NOT_MAIN.test(it.n)) continue;
        const score = (MEAT.test(it.n) && !/chick'n|plant|vegan|jackfruit/i.test(it.n) ? 1000 : 0) + (it.cal || 0) - (/pizza/i.test(it.n) ? 400 : 0);
        if (score > topScore) { top = it; topScore = score; }
      }
      if (top) best.push({ it: top, st: st.name, score: topScore });
    }
    return best.sort((a, b) => b.score - a.score).slice(0, n);
  }

  const canHover = window.matchMedia("(hover: hover)").matches;
  let mapDay = null, mapDrawnFor = "";
  function renderMap(day) {
    mapDay = day;
    const box = $("#mapBox");
    const key = state.halls.map((h) => h.slug).join() + "|" + state.hall;
    if (mapDrawnFor !== key) { box.innerHTML = mapSVG(); mapDrawnFor = key; }
    const d = parseIso(state.date);
    $("#mapTitle").textContent = `${state.date === todayIso ? "今天" : `${d.getMonth() + 1}月${d.getDate()}日`}${MEAL_ZH[state.meal]} · 食堂地图`;
    $("#mapHint").textContent = canHover ? "鼠标悬停看硬菜" : "点食堂看硬菜";
    const card = $("#mapCard");
    if (!card.hidden && card.dataset.hall) showCard(card.dataset.hall);
  }
  function showCard(slug) {
    const box = $("#mapBox"), card = $("#mapCard");
    const h = state.halls.find((x) => x.slug === slug);
    if (!h) return;
    const list = hardDishes(slug, mapDay, state.meal);
    card.dataset.hall = slug;
    card.innerHTML = `<h3>${esc(h.name)}</h3>
      <div class="sub">${MEAL_ZH[state.meal]}硬菜${h.addr ? " · " + esc(h.addr.split(",")[0]) : ""}</div>
      ${list.length ? `<ol>${list.map(({ it, st }) => `<li><b>${esc(it.zh || it.n)}</b>${it.cal != null ? ` <span class="cal">${it.cal} 千卡</span>` : ""}<small>${esc(st)}${it.zh ? " · " + esc(it.n) : ""}</small></li>`).join("")}</ol>`
        : `<div class="none">${mapDay ? `这一餐没有菜单` : "暂无数据"}</div>`}
      <button type="button" class="go" data-go="${esc(slug)}">看 ${esc(shortHall(h.name))} 完整菜单 →</button>`;
    card.hidden = false;
    box.querySelectorAll(".m-hall").forEach((g) => g.classList.toggle("on", g.dataset.hall === slug));
    // 窄屏：卡片排在地图下面；宽屏：浮在图钉旁边，不出界
    if (getComputedStyle(card).position === "static") return;
    const g = box.querySelector(`.m-hall[data-hall="${CSS.escape(slug)}"]`);
    const br = box.getBoundingClientRect(), pr = g.querySelector(".pin").getBoundingClientRect();
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let left = pr.left - br.left + pr.width / 2 - cw / 2;
    left = Math.max(8, Math.min(left, br.width - cw - 8));
    let top = pr.bottom - br.top + 6;
    if (top + ch > br.height - 4) top = Math.max(4, pr.top - br.top - ch - 6);
    card.style.left = left + "px"; card.style.top = top + "px";
  }
  function hideCard() {
    const card = $("#mapCard"); if (!card) return;
    card.hidden = true; delete card.dataset.hall;
    $("#mapBox").querySelectorAll(".m-hall.on").forEach((g) => g.classList.remove("on"));
  }
  function setMapOpen(open) {
    state.mapOpen = open;
    $("#mapPanel").hidden = !open;
    $("#mapBtn").setAttribute("aria-pressed", open);
    lsSet("uwdining.map", open ? "1" : "");
    if (open) loadDay(state.date).then(renderMap); else hideCard();
  }
  const mapBox = $("#mapBox");
  mapBox.addEventListener("mouseover", (e) => {
    if (!canHover) return;
    const g = e.target.closest(".m-hall"); if (g) showCard(g.dataset.hall);
  });
  mapBox.addEventListener("mouseleave", () => { if (canHover) hideCard(); });
  mapBox.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) {
      state.hall = go.dataset.go; lsSet(LS_HALL, state.hall);
      mapDrawnFor = ""; hideCard(); render();
      el.menu.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const g = e.target.closest(".m-hall");
    if (g) showCard(g.dataset.hall);
    else if (!e.target.closest(".map-card")) hideCard();
  });
  mapBox.addEventListener("keydown", (e) => {
    const g = e.target.closest(".m-hall");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showCard(g.dataset.hall); }
    if (e.key === "Escape") hideCard();
  });
  $("#mapBtn").addEventListener("click", () => setMapOpen(!state.mapOpen));

  // ---------- 事件 ----------
  el.halls.addEventListener("click", (e) => {
    const b = e.target.closest("[data-hall]"); if (!b) return;
    state.hall = b.dataset.hall; lsSet(LS_HALL, state.hall); render();
  });
  el.dates.addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]"); if (!b) return;
    const n = dateList.indexOf(b.dataset.date) - dateList.indexOf(state.date);
    state.date = b.dataset.date; render(n > 0 ? "slide-l" : n < 0 ? "slide-r" : null);
  });
  el.prev.addEventListener("click", () => { state.date = dateList[Math.max(0, (weekIndex() - 1) * 7)]; if (weekIndex() === 0) state.date = todayIso; render("slide-r"); });
  el.next.addEventListener("click", () => { state.date = dateList[Math.min(dateList.length - 1, (weekIndex() + 1) * 7)]; render("slide-l"); });
  el.today.addEventListener("click", () => { state.date = todayIso; state.meal = mealForNow(); render("slide-r"); });
  el.meals.addEventListener("click", (e) => {
    const b = e.target.closest("[data-meal]"); if (!b) return;
    state.meal = b.dataset.meal; render();
  });
  el.filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    const f = b.dataset.f;
    state.filters.has(f) ? state.filters.delete(f) : state.filters.add(f);
    lsSet(LS_FILTERS, [...state.filters].join(",")); render();
  });
  let qTimer;
  el.q.addEventListener("input", () => {
    clearTimeout(qTimer);
    el.clearQ.hidden = !el.q.value;
    qTimer = setTimeout(() => { state.q = el.q.value.trim(); render(); }, 150);
  });
  el.q.addEventListener("keydown", (e) => { if (e.key === "Enter") el.q.blur(); });
  el.clearQ.addEventListener("click", () => { el.q.value = ""; el.clearQ.hidden = true; state.q = ""; render(); el.q.focus(); });

  // 左右滑动换一天
  let sx = 0, sy = 0, st = 0, tracking = false;
  el.menu.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return (tracking = false);
    tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  el.menu.addEventListener("touchend", (e) => {
    if (!tracking) return; tracking = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dy) < Math.abs(dx) * 0.6 && Date.now() - st < 800) shiftDay(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.target === el.q) return;
    if (e.key === "ArrowLeft") shiftDay(-1);
    if (e.key === "ArrowRight") shiftDay(1);
  });

  // ---------- 启动 ----------
  (async () => {
    try {
      const h = await loadJSON("data/halls.json");
      state.halls = h.halls || [];
    } catch {
      el.menu.innerHTML = emptyHTML("⚠️", "加载失败，请检查网络后重试");
      return;
    }
    if (!state.halls.some((h) => h.slug === state.hall)) state.hall = state.halls[0] && state.halls[0].slug;
    if (lsGet("uwdining.map")) setMapOpen(true);
    render();
  })();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
