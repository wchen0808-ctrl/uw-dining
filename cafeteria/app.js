"use strict";
(() => {
  // 动效层（fx.js）没加载到也不影响功能
  const FX = window.FX || new Proxy({}, { get: () => () => {} });
  if (!window.FX) document.documentElement.classList.remove("intro-on");
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
  const ARROW = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>`;

  const $ = (s) => document.querySelector(s);
  const el = {
    halls: $("#halls"), dates: $("#dates"), meals: $("#meals"), menu: $("#menu"),
    prev: $("#prevWeek"), next: $("#nextWeek"), today: $("#todayBtn"),
    q: $("#q"), clearQ: $("#clearQ"), filters: $("#filters"), toast: $("#toast"),
    hardSlot: $("#hardSlot"), menuTitle: $("#menuTitle"), menuMeta: $("#menuMeta"), chef: $("#chef"), rank: $("#rank"),
  };

  function has(it, tag) { return (it.d || []).includes(tag); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* 隐私模式 */ } }
  const pad = (n) => String(n).padStart(2, "0");
  function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function parseIso(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function addDays(s, n) { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function mealForNow(now = new Date()) {
    const m = now.getHours() * 60 + now.getMinutes();
    if (m < 10 * 60 + 30) return "breakfast";
    if (m < 14 * 60 + 30) return "lunch";
    return "dinner";
  }
  function shortHall(name) { return name.replace(/\s*Market$/i, "").replace(/\s*Avenue$/i, ""); }
  function noteZh(note) {
    const m = /Available Between\s+(\S+)\s*-\s*(\S+)/i.exec(note || "");
    return m ? `供应时间 ${m[1]}–${m[2]}` : note || "";
  }
  function allergenText(it) {
    const a = (it.a || []).map((x) => ALLERGEN_ZH[x] || x);
    return a.length ? `含：${[...new Set(a)].join("、")}` : "";
  }
  function dayLabel(date) {
    const d = parseIso(date);
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${WEEK_ZH[d.getDay()]}`;
  }
  const calHTML = (it) => it.cal != null
    ? `<span class="cal"><span class="num">${it.cal}</span> <span class="unit">千卡</span></span>` : "";

  const todayIso = iso(new Date());
  const DAYS = 14;
  const state = {
    halls: [],
    codes: {},
    hall: lsGet(LS_HALL),
    date: todayIso,
    meal: mealForNow(),
    filters: new Set((lsGet(LS_FILTERS) || "").split(",").filter((f) => FILTERS[f])),
    q: "",
    best: null,
    cache: new Map(),
  };
  const dateList = Array.from({ length: DAYS }, (_, i) => addDays(todayIso, i));
  const hallBy = (slug) => state.halls.find((h) => h.slug === slug);

  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  function loadDay(date) {
    if (!state.cache.has(date)) state.cache.set(date, loadJSON(`data/${date}.json`).catch(() => null));
    return state.cache.get(date);
  }

  // ---------- 顶部 ----------
  function renderHalls() {
    el.halls.innerHTML = state.halls.map((h) =>
      `<button type="button" data-hall="${esc(h.slug)}" aria-pressed="${h.slug === state.hall}"><span class="code">${state.codes[h.slug]}</span>${esc(shortHall(h.name))}</button>`
    ).join("");
  }
  function weekIndex() { return Math.floor(dateList.indexOf(state.date) / 7); }
  function renderDates() {
    const w = Math.max(0, weekIndex());
    el.dates.innerHTML = dateList.slice(w * 7, w * 7 + 7).map((d) => {
      const dt = parseIso(d);
      return `<button type="button" role="tab" data-date="${d}" aria-selected="${d === state.date}"
        class="${d === todayIso ? "is-today" : ""}" aria-label="${dt.getMonth() + 1}月${dt.getDate()}日 ${WEEK_ZH[dt.getDay()]}">
        <span class="dw">${d === todayIso ? "今天" : WEEK_ZH[dt.getDay()]}</span><span class="dd">${dt.getDate()}</span></button>`;
    }).join("");
    el.prev.disabled = w === 0;
    el.next.disabled = w >= Math.ceil(DAYS / 7) - 1;
    el.today.hidden = state.date === todayIso;
    if (renderDates.last !== state.date) { renderDates.last = state.date; FX.datePop(el.dates.querySelector('[aria-selected="true"]')); }
  }
  function renderMeals(day) {
    const hallData = day && day.halls && day.halls[state.hall];
    el.meals.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.meal === state.meal);
      b.setAttribute("role", "tab");
      b.classList.toggle("empty", !!day && !(hallData && hallData[b.dataset.meal]));
    });
    FX.mealInk(el.meals);
  }
  function renderFilters() {
    el.filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", state.filters.has(b.dataset.f)));
  }

  // ---------- 菜单小票 ----------
  function passes(it) { for (const f of state.filters) if (!FILTERS[f](it)) return false; return true; }
  function itemHTML(it, where, hard) {
    const tags = ["Vegan", "Vegetarian", "Halal", "Top 9 Free"]
      .filter((t) => has(it, t) && !(t === "Vegetarian" && has(it, "Vegan")))
      .map((t) => `<span class="tag ${DIET[t].cls}">${DIET[t].zh}</span>`).join("");
    const alg = allergenText(it);
    return `<div class="item${hard ? " is-hard" : ""}"${hard ? ` id="hard-${hard}"` : ""}>
      <div class="line"><span class="name">${esc(it.zh || it.n)}</span><span class="lead"></span>${calHTML(it)}</div>
      ${it.zh ? `<div class="en" lang="en">${esc(it.n)}</div>` : ""}
      ${where ? `<div class="where">${esc(where)}</div>` : ""}
      ${tags || hard ? `<div class="tags">${hard ? `<span class="tag hard">硬菜</span>` : ""}${tags}</div>` : ""}
      ${alg ? `<div class="alg">${esc(alg)}</div>` : ""}
    </div>`;
  }
  function emptyHTML(title, small) {
    return `<div class="empty-state"><p class="big">${esc(title)}</p>${small ? `<p class="small">${esc(small)}</p>` : ""}</div>`;
  }

  function renderMenu(day) {
    el.hardSlot.innerHTML = "";
    if (state.q) return renderSearch(day);
    const h = hallBy(state.hall);
    el.menuTitle.textContent = h ? `${h.name} 菜单` : "菜单";
    const meta = `${state.codes[state.hall] || ""} · ${dayLabel(state.date)} · ${MEAL_ZH[state.meal]}`;
    if (!day) { el.menuMeta.textContent = meta; return void (el.menu.innerHTML = emptyHTML("这一天还没有菜单", "菜单通常提前一两周公布，过几天再来看看")); }
    const stations = ((day.halls[state.hall] || {})[state.meal]) || [];
    if (!stations.length) {
      el.menuMeta.textContent = meta;
      return void (el.menu.innerHTML = emptyHTML(`这一天没有${MEAL_ZH[state.meal]}`, "换个餐次，或者看看其他食堂"));
    }
    // 这一餐的硬菜：放在菜单最上面，列表里对应的菜也打上“硬菜”标签
    const picks = hardDishes(state.hall, day, state.meal, 4, true);
    const hardIdx = new Map(picks.map((p, i) => [p.it, i + 1]));
    let total = 0, shown = 0;
    const html = stations.map((st) => {
      const items = st.items.filter(passes);
      total += st.items.length; shown += items.length;
      if (!items.length) return "";
      return `<section class="station"><h3>${esc(st.name)}</h3>${st.note ? `<p class="note">${esc(noteZh(st.note))}</p>` : ""}
        ${items.map((it) => itemHTML(it, null, hardIdx.get(it))).join("")}</section>`;
    }).join("");
    const hardBlock = picks.length ? `<section class="hard-block" aria-labelledby="hardTitle">
        <h3 id="hardTitle"><span>这一餐的硬菜</span><span class="m">${state.codes[state.hall] || ""} · ${MEAL_ZH[state.meal]}</span></h3>
        <ol>${picks.map((p, i) => `<li><a href="#hard-${i + 1}" data-jump="hard-${i + 1}">
          <span class="line"><span class="name">${esc(p.it.zh || p.it.n)}</span><span class="lead"></span>${calHTML(p.it)}</span>
          <span class="sub">窗口 · ${esc(p.st)}${p.it.zh ? ` · ${esc(p.it.n)}` : ""}</span></a></li>`).join("")}</ol>
      </section>` : "";
    el.menuMeta.textContent = `${meta} · ${state.filters.size ? `筛选后 ${shown}/${total}` : total} 道菜`;
    el.hardSlot.innerHTML = shown ? hardBlock + comboHTML(buildCombo(state.hall, day, state.meal), state.meal) : "";
    el.menu.innerHTML = (shown ? html : emptyHTML("没有符合筛选的菜", "把上面的筛选关掉几个试试")) +
      `<p class="hint">左右滑动换一天</p>`;
  }

  function renderSearch(day) {
    el.menuTitle.textContent = `搜“${state.q}”`;
    if (!day) { el.menuMeta.textContent = dayLabel(state.date); return void (el.menu.innerHTML = emptyHTML("这一天还没有菜单")); }
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
    el.menuMeta.textContent = `${dayLabel(state.date)} · 所有食堂 · ${results.length} 个结果`;
    el.menu.innerHTML = results.length
      ? `<section class="station">${results.map((r) => itemHTML(r.it, r.where)).join("")}</section>`
      : emptyHTML("没有找到", "换个关键词试试，比如 鸡肉、豆腐、pizza");
  }

  let renderToken = 0;
  async function render(anim) {
    renderDates(); renderFilters(); renderHalls();
    const token = ++renderToken;
    const day = await loadDay(state.date);
    if (token !== renderToken) return;
    renderMeals(day);
    renderMenu(day);
    await renderChef();
    if (state.mapOpen) renderMap(day);
    if (document.documentElement.classList.contains("has-motion")) {
      FX.menuIn(el.hardSlot, 0);
      FX.menuIn(el.menu, anim === "slide-l" ? 1 : anim === "slide-r" ? -1 : 0);
    } else if (anim) {
      el.menu.classList.remove("slide-l", "slide-r");
      void el.menu.offsetWidth;
      el.menu.classList.add(anim);
    }
    const i = dateList.indexOf(state.date);
    [dateList[i - 1], dateList[i + 1]].forEach((d) => d && loadDay(d));
  }

  function toast(msg) {
    el.toast.textContent = msg; el.toast.hidden = false; FX.toastIn(el.toast);
    clearTimeout(toast.t); toast.t = setTimeout(() => (el.toast.hidden = true), 1600);
  }
  function shiftDay(n) {
    const i = dateList.indexOf(state.date) + n;
    if (i < 0) return toast("已经是今天了");
    if (i >= dateList.length) return toast("只能看未来两周的菜单");
    state.date = dateList[i];
    render(n > 0 ? "slide-l" : "slide-r");
  }
  function goToMenu() {
    requestAnimationFrame(() => $(".receipt").scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // ---------- 硬菜 ----------
  const MEAT = /\b(beef|chicken|pork|salmon|shrimp|cod|tilapia|brisket|lamb|turkey|steak|ribs?|fish|mahi|haddock|ham|sausage|kielbasa|meatballs?|gyro|barbacoa|carnitas?|birria|bulgogi|burnt ends|meatloaf|wings?|drumsticks?|tenders)\b/i;
  const NOT_MAIN = /\b(gravy|sauce|egg|eggs|scrambled|pancakes?|popcake|waffle|french toast|salad filling|oatmeal|grits|condiment)\b/i;
  const NOT_MAIN_BREAKFAST = /\b(gravy|sauce|condiment|syrup)\b/i;
  function hardDishes(hallSlug, day, meal, n = 4, useFilters = false) {
    const stations = (((day || {}).halls || {})[hallSlug] || {})[meal] || [];
    const skip = meal === "breakfast" ? NOT_MAIN_BREAKFAST : NOT_MAIN; // 早餐的蛋和松饼也算硬菜
    const best = [];
    for (const st of stations) {
      let top = null, topScore = -1;
      for (const it of st.items) {
        if (!it.m || skip.test(it.n) || (useFilters && !passes(it))) continue;
        const score = (MEAT.test(it.n) && !/chick'n|plant|vegan|jackfruit/i.test(it.n) ? 1000 : 0) + (it.cal || 0) - (/pizza/i.test(it.n) ? 400 : 0);
        if (score > topScore) { top = it; topScore = score; }
      }
      if (top) best.push({ it: top, st: st.name, score: topScore });
    }
    return best.sort((a, b) => b.score - a.score).slice(0, n);
  }

  // ---------- 搭配建议：一份蛋白质 + 一份主食 + 一份蔬果 ----------
  // 参考值：一般成人每天约 2000 千卡、三餐平分（早餐略少）；只作参考，不是医疗建议
  const MEAL_REF = {
    breakfast: { kcal: [400, 650], p: 20, c: [50, 85], fb: 6 },
    lunch: { kcal: [550, 850], p: 25, c: [60, 110], fb: 8 },
    dinner: { kcal: [550, 850], p: 25, c: [60, 110], fb: 8 },
  };
  const NOT_FOOD = /\b(sauce|gravy|dressing|condiment|syrup|salsa|guacamole|sour cream|cheese sauce|build your own|bar$)\b/i;
  const CARB = /\b(rice|pasta|noodles?|lo mein|yakisoba|spaghetti|rotini|potato(es)?|fries|tots|hashbrowns?|bread|roll|bun|naan|tortilla|quinoa|couscous|bulgur|barley|grits|oatmeal|biscuit|bagel|pancakes?|waffle|toast|spaetzle|wheat berries|grains?)\b/i;
  const PLANT = /\b(broccoli|carrots?|beans?|spinach|kale|salad|vegetables?|veggies?|squash|zucchini|cauliflower|brussels?|asparagus|greens|chard|peas|cabbage|tomato(es)?|cucumber|edamame|eggplant|okra|mushrooms?|peppers?|fruit|melon|grapes|berries|blueberries|strawberries|apple|banana|pineapple|mango|orange|cantaloupe|honeydew|watermelon|ratatouille|jicama|rabe)\b/i;
  const VEG = /\b(broccoli|carrots?|green beans|spinach|kale|vegetables?|veggies?|squash|zucchini|cauliflower|brussels?|asparagus|greens|chard|peas|cabbage|cucumber|eggplant|okra|mushrooms?|ratatouille|jicama|rabe)\b/i;
  const NOT_PLANT = /\b(tuna|egg|eggs|hummus|dip|chili|pizza|sandwich|soup|pie|burger)\b/i;
  const PROTEIN_VEG = /\b(tofu|tempeh|seitan|beans?|lentils?|chickpeas?|egg|eggs|falafel|edamame|yogurt)\b/i;
  const n0 = (v) => v || 0;
  function buildCombo(hallSlug, day, meal) {
    const stations = (((day || {}).halls || {})[hallSlug] || {})[meal] || [];
    const pool = [];
    for (const st of stations) for (const it of st.items) {
      if (it.cal == null || it.p == null || !passes(it) || NOT_FOOD.test(it.n) || it.k === "dessert" || it.k === "condiment") continue;
      pool.push({ it, st: st.name });
    }
    const pick = (cands, score) => cands.map((x) => ({ ...x, s: score(x.it) })).sort((a, b) => b.s - a.s);
    const minP = meal === "breakfast" ? 10 : 15;
    const proteinLike = ({ it }) => (it.m || MEAT.test(it.n) || PROTEIN_VEG.test(it.n)) && it.cal <= 700;
    const proteinScore = (it) => it.p + 30 * (it.p * 4) / Math.max(it.cal, 60);
    let proteins = pick(pool.filter((x) => x.it.p >= minP && proteinLike(x)), proteinScore);
    // 实在没有达标的（比如早餐只有松饼），退一步挑蛋白质最多的
    if (!proteins.length) proteins = pick(pool.filter((x) => x.it.p >= 6 && proteinLike(x)), (it) => it.p);
    const carbs = pick(pool.filter(({ it }) => n0(it.c) >= 18 && (!it.m || meal === "breakfast") && (CARB.test(it.n) || it.k === "grain") && n0(it.p) * 2 < n0(it.c)),
      (it) => n0(it.c) / 10 + n0(it.fb) * 1.5 - n0(it.f) / 3);
    const plants = pick(pool.filter(({ it }) => (it.k === "vegetable" || it.k === "fruit" || PLANT.test(it.n)) && it.cal >= 25 && it.cal <= 220
        && n0(it.p) < 12 && !CARB.test(it.n) && !MEAT.test(it.n) && !NOT_PLANT.test(it.n)),
      // 蔬菜优先于水果（份量更像一份配菜，维生素和纤维也更稳）
      (it) => n0(it.fb) * 2 + (it.k === "vegetable" || VEG.test(it.n) ? 4 : 0) + Math.min(it.cal, 150) / 75);
    const pro = proteins[0];
    if (!pro) return null;
    const veg = plants.find((x) => x.it !== pro.it) || null;
    const ref = MEAL_REF[meal];
    // 主食：优先让总热量落在参考区间里（区间内挑分最高的）；做不到就挑最接近区间中点的
    const used = new Set([pro.it, veg && veg.it]);
    const carbOk = carbs.filter((x) => !used.has(x.it));
    const base = pro.it.cal + (veg ? veg.it.cal : 0);
    const mid = (ref.kcal[0] + ref.kcal[1]) / 2;
    const carb = carbOk.find((x) => base + x.it.cal >= ref.kcal[0] && base + x.it.cal <= ref.kcal[1])
      || carbOk.slice().sort((a, b) => Math.abs(base + a.it.cal - mid) - Math.abs(base + b.it.cal - mid))[0] || null;
    const parts = [pro, carb, veg].filter(Boolean);
    const sum = (k) => parts.reduce((s, x) => s + n0(x.it[k]), 0);
    return { pro, carb, veg, ref, kcal: sum("cal"), p: sum("p"), c: sum("c"), f: sum("f"), fb: sum("fb") };
  }
  function comboHTML(combo, meal) {
    if (!combo) return "";
    const { ref } = combo;
    const row = (label, x, none) => x
      ? `<li><span class="role">${label}</span><a href="#" data-find="${esc(x.it.n)}" class="dish">
          <span class="line"><span class="name">${esc(x.it.zh || x.it.n)}</span><span class="lead"></span>${calHTML(x.it)}</span>
          <span class="sub">蛋白质 ${n0(x.it.p)}g · 碳水 ${n0(x.it.c)}g · 纤维 ${n0(x.it.fb)}g</span></a></li>`
      : `<li><span class="role">${label}</span><span class="dish none">${none}</span></li>`;
    const meter = (label, val, unit, lo, hi) => {
      const max = (hi || lo) * 1.5, pct = Math.min(100, (val / max) * 100);
      const ok = hi ? val >= lo && val <= hi : val >= lo;
      const range = hi ? `${lo}–${hi}` : `≥${lo}`;
      return `<div class="meter${ok ? " ok" : ""}"><span class="mlabel">${label}</span>
        <span class="track"><span class="band" style="left:${(lo / max * 100).toFixed(0)}%;width:${(((hi || max) - lo) / max * 100).toFixed(0)}%"></span>
          <span class="fill" style="width:${pct.toFixed(0)}%"></span></span>
        <span class="mval m">${val}${unit}</span><span class="mref m">${range}</span></div>`;
    };
    const tip = combo.kcal > ref.kcal[1] ? "热量偏高：主食吃半份，或者换成蔬菜" :
      combo.kcal < ref.kcal[0] ? "热量偏低：可以再加一份主食或水果" :
      combo.p < ref.p ? "蛋白质偏少：再加个鸡蛋或一份豆制品" : "这样搭配比较均衡";
    return `<section class="combo" aria-labelledby="comboTitle">
      <h3 id="comboTitle"><span>搭配建议</span><span class="m">${MEAL_ZH[meal]} · 一荤一主一蔬果</span></h3>
      <ol>${row("蛋白质", combo.pro)}${row("主食", combo.carb, "这一餐没有合适的主食")}${row("蔬果", combo.veg, "这一餐没有蔬菜水果，记得另外补")}</ol>
      <div class="meters">
        ${meter("热量", combo.kcal, "", ref.kcal[0], ref.kcal[1])}
        ${meter("蛋白质", combo.p, "g", ref.p)}
        ${meter("碳水", combo.c, "g", ref.c[0], ref.c[1])}
        ${meter("纤维", combo.fb, "g", ref.fb)}
      </div>
      <p class="combo-tip">${tip}</p>
      <p class="combo-note">参考值按一般成人每天约 2000 千卡、三餐平分估算，只供参考。菜单数据里没有维生素含量，所以用“一份蔬菜或水果”来保证维生素。</p>
    </section>`;
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
    { name: "University Ave", cls: "major", pts: [[43.0731, -89.3945], [43.0731, -89.4080], [43.0738, -89.4130], [43.0745, -89.4205]], label: [43.0726, -89.4110] },
    { name: "Johnson St", cls: "major", pts: [[43.0719, -89.3945], [43.0719, -89.4060]], label: [43.0714, -89.4045] },
    { name: "Park St", cls: "minor", pts: [[43.0773, -89.4003], [43.0695, -89.4003]], label: null },
    { name: "Dayton St", cls: "minor", pts: [[43.0709, -89.3945], [43.0709, -89.4003]], label: [43.0704, -89.3965] },
    { name: "Observatory Dr", cls: "minor", pts: [[43.0757, -89.4003], [43.0760, -89.4035], [43.0770, -89.4060], [43.0768, -89.4095], [43.0763, -89.4135], [43.0766, -89.4180]], label: [43.0757, -89.4125] },
    { name: "Elm Dr", cls: "minor", pts: [[43.0790, -89.4188], [43.0735, -89.4192]], label: null },
    { name: "Babcock Dr", cls: "minor", pts: [[43.0766, -89.4140], [43.0731, -89.4142]], label: null },
  ];
  const LANDMARKS = [
    { name: "Bascom Hall", at: [43.0753, -89.4041], anchor: "end" },
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
      const below = y < 90; // 太靠湖边的名字放到下面
      const cls = ["m-hall", h.slug === state.hall ? "current" : "", h.slug === state.best ? "best" : ""].join(" ").trim();
      return `<g class="${cls}" data-hall="${esc(h.slug)}" tabindex="0" role="button"
          aria-label="${state.codes[h.slug]} ${esc(h.name)}，查看硬菜" transform="translate(${x},${y})">
        <circle cy="-26" r="32" fill="transparent"/>
        <g class="pin-g"><rect class="pin" x="-24" y="-46" width="48" height="32" rx="2"/>
          <path class="pin-tail" d="M-7 -14.5 L0 -5 L7 -14.5Z"/>
          <text class="pin-code" y="-24" text-anchor="middle">${state.codes[h.slug]}</text></g>
        <text class="m-name" y="${below ? 20 : -56}" text-anchor="middle">${esc(shortHall(h.name))}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" role="img" aria-label="UW–Madison 校园食堂位置示意图">
      <path class="m-lake" d="${lake}"/>
      <text class="m-lake-label" x="${MAP_W / 2}" y="30" text-anchor="middle">Lake Mendota 门多塔湖</text>
      <rect class="m-green" x="${bx1}" y="${by1}" width="${bx2 - bx1}" height="${by2 - by1}"/>
      ${ROADS.map((r) => `<path class="m-road ${r.cls}" d="${line(r.pts)}"/>`).join("")}
      <path class="m-path" d="${path}"/>
      ${ROADS.filter((r) => r.label).map((r) => { const [x, y] = P(...r.label); return `<text class="m-road-label" x="${x}" y="${y}" text-anchor="middle">${r.name}</text>`; }).join("")}
      ${(() => { const [x, y] = P(43.0705, -89.4003); return `<text class="m-road-label" x="${x - 8}" y="${y}" text-anchor="end">Park St</text>`; })()}
      ${LANDMARKS.map((l) => { const [x, y] = P(...l.at); return l.anchor === "end"
        ? `<g class="m-landmark"><circle cx="${x}" cy="${y}" r="3"/><text x="${x - 8}" y="${y + 5}" text-anchor="end">${l.name}</text></g>`
        : `<g class="m-landmark"><circle cx="${x}" cy="${y}" r="3"/><text x="${x}" y="${y + 18}" text-anchor="middle">${l.name}</text></g>`; }).join("")}
      ${halls}
    </svg><div id="mapCard" class="map-card" hidden></div>`;
  }

  const canHover = window.matchMedia("(hover: hover)").matches;
  let mapDay = null, mapDrawnFor = "";
  function renderMap(day) {
    mapDay = day;
    const box = $("#mapBox");
    const key = state.halls.map((h) => h.slug).join() + "|" + state.hall + "|" + state.best;
    if (mapDrawnFor !== key) { box.innerHTML = mapSVG(); mapDrawnFor = key; }
    $("#mapTitle").textContent = `${state.date === todayIso ? "今天" : dayLabel(state.date)}${MEAL_ZH[state.meal]} · 食堂地图`;
    $("#mapHint").textContent = canHover ? "鼠标悬停看硬菜" : "点食堂看硬菜";
    const card = $("#mapCard");
    if (!card.hidden && card.dataset.hall) showCard(card.dataset.hall);
  }
  function showCard(slug) {
    const box = $("#mapBox"), card = $("#mapCard");
    const h = hallBy(slug);
    if (!h) return;
    const list = hardDishes(slug, mapDay, state.meal);
    const fresh = card.hidden || card.dataset.hall !== slug;
    card.dataset.hall = slug;
    card.innerHTML = `<h3>${state.codes[slug]} ${esc(h.name)}</h3>
      <div class="sub">${MEAL_ZH[state.meal]}硬菜${h.addr ? " · " + esc(h.addr.split(",")[0]) : ""}</div>
      ${list.length ? `<ol>${list.map(({ it, st }) => `<li><div class="line"><b>${esc(it.zh || it.n)}</b><span class="lead"></span>${calHTML(it)}</div><small>${esc(st)}${it.zh ? " · " + esc(it.n) : ""}</small></li>`).join("")}</ol>`
        : `<div class="none">${mapDay ? "这一餐没有菜单" : "暂无数据"}</div>`}
      <button type="button" class="go" data-go="${esc(slug)}">看 ${esc(shortHall(h.name))} 完整菜单</button>`;
    card.hidden = false;
    if (fresh) FX.cardIn(card);
    box.querySelectorAll(".m-hall").forEach((g) => g.classList.toggle("on", g.dataset.hall === slug));
    // 地图窄（手机、电脑左栏）：卡片排在地图下面；地图够宽：浮在图钉旁边，不出界
    box.classList.toggle("narrow", box.clientWidth < 560);
    if (getComputedStyle(card).position === "static") return;
    const g = box.querySelector(`.m-hall[data-hall="${CSS.escape(slug)}"]`);
    const br = box.getBoundingClientRect(), pr = g.querySelector(".pin").getBoundingClientRect();
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let left = pr.left - br.left + pr.width / 2 - cw / 2;
    left = Math.max(8, Math.min(left, br.width - cw - 8));
    let top = pr.bottom - br.top + 10;
    if (top + ch > br.height - 4) top = Math.max(4, pr.top - br.top - ch - 8);
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
    if (open) loadDay(state.date).then((d) => { mapDrawnFor = ""; renderMap(d); FX.mapIn($("#mapPanel")); }); else hideCard();
  }
  function selectHall(slug, { scroll = true } = {}) {
    state.hall = slug; lsSet(LS_HALL, slug); mapDrawnFor = ""; hideCard(); render();
    if (state.mapOpen) requestAnimationFrame(() => FX.pinBounce($(`.m-hall[data-hall="${CSS.escape(slug)}"]`)));
    if (scroll) goToMenu();
  }
  const mapBox = $("#mapBox");
  mapBox.addEventListener("mouseover", (e) => {
    if (!canHover) return;
    const g = e.target.closest(".m-hall"); if (g) showCard(g.dataset.hall);
  });
  mapBox.addEventListener("mouseleave", () => { if (canHover) hideCard(); });
  mapBox.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) return selectHall(go.dataset.go);
    const g = e.target.closest(".m-hall");
    if (g) { FX.pinBounce(g); showCard(g.dataset.hall); }
    else if (!e.target.closest(".map-card")) hideCard();
  });
  mapBox.addEventListener("keydown", (e) => {
    const g = e.target.closest(".m-hall");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showCard(g.dataset.hall); }
    if (e.key === "Escape") hideCard();
  });
  $("#mapBtn").addEventListener("click", () => {
    setMapOpen(!state.mapOpen);
    // 地图不一定在眼前：打开后自动滚过去，不然看起来像没反应
    if (state.mapOpen) requestAnimationFrame(() => $("#mapPanel").scrollIntoView({ behavior: "smooth", block: "start" }));
  });

  // 吸顶的日期栏：记下高度给 scrollIntoView 留位置；贴顶以后加一道影子
  const headEl = $(".top");
  const syncHead = () => document.documentElement.style.setProperty("--head-h", headEl.offsetHeight + "px");
  const side = $(".side");
  const syncSide = () => side.classList.toggle("stick", window.innerWidth >= 900 && side.offsetHeight + headEl.offsetHeight + 40 < window.innerHeight);
  syncHead(); window.addEventListener("resize", () => { syncHead(); syncSide(); });
  new ResizeObserver(syncSide).observe(side);
  const barH = () => $(".bar").offsetHeight;
  window.addEventListener("scroll", () => headEl.classList.toggle("stuck", window.scrollY > barH()), { passive: true });

  // ---------- 开场动画：等第一次算出推荐再把取餐单端上来 ----------
  let introResolve;
  const introData = new Promise((r) => (introResolve = r));
  FX.intro(introData, (played) => { if (played && !el.chef.hidden) FX.ticketIn(el.chef, { first: true }); });

  // ---------- 奶娃大厨的取餐单 + 各食堂硬菜排行 ----------
  const CHEF_HELLO = {
    breakfast: ["早上好呀，先吃早饭！", "起床啦，早饭要吃饱～", "今天也元气满满！"],
    lunch: ["午饭时间到！", "肚子咕咕叫了吧？", "中午吃顿好的！"],
    dinner: ["晚饭时间到！", "忙了一天，犒劳一下！", "晚上吃点硬的！"],
  };
  function chefPlan(now = new Date()) {
    const m = now.getHours() * 60 + now.getMinutes();
    if (m >= 20 * 60 + 30) return { date: addDays(todayIso, 1), meal: "breakfast", late: true };
    return { date: todayIso, meal: mealForNow(now), late: false };
  }
  async function renderChef() {
    const plan = chefPlan();
    const day = await loadDay(plan.date);
    const rows = state.halls.map((h) => {
      const picks = hardDishes(h.slug, day, plan.meal, 99, true);
      return { h, picks, score: picks.slice(0, 3).reduce((s, p) => s + p.score, 0) };
    });
    // 先比有硬菜的窗口多少，一样多再比前三道硬菜（肉菜优先、热量高的优先）
    const ranked = rows.filter((r) => r.picks.length).sort((a, b) => b.picks.length - a.picks.length || b.score - a.score);
    const closed = rows.filter((r) => !r.picks.length);
    state.best = ranked.length ? ranked[0].h.slug : null;
    const when = plan.late ? "明早" : { breakfast: "今早", lunch: "中午", dinner: "今晚" }[plan.meal];
    const whenMeal = `${plan.late ? "明天" : "今天"}${MEAL_ZH[plan.meal]}`;
    const filterNote = state.filters.size
      ? `按「${[...state.filters].map((f) => el.filters.querySelector(`[data-f="${f}"]`).textContent).join("、")}」筛过 · ` : "";
    const now = new Date();
    const printed = `${dayLabel(todayIso)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const hello = plan.late ? "夜深啦，食堂都关门咯，明早见！" : CHEF_HELLO[plan.meal][now.getDate() % 3];
    const mascot = `<div class="t-mascot" title="戳一下奶娃"><img class="chef-img" src="icons/naiwa-chef.png" alt="奶娃大厨" width="320" height="430" decoding="async"></div>`;

    let html;
    if (!ranked.length) {
      html = `${mascot}<div class="t-head m"><span>奶娃大厨 · 取餐单</span><span>${printed}</span></div>
        <div class="t-title"><h1><span class="t-when">${when}${MEAL_ZH[plan.meal]}</span><span class="t-hall">菜单还没出来</span></h1></div>
        <p class="t-hello">${filterNote}${hello}</p>
        <hr class="dash"><p class="t-empty">奶娃也不知道该推荐哪儿，先看看别的日子吧。</p>`;
    } else {
      const best = ranked[0], second = ranked[1];
      const code = state.codes[best.h.slug];
      const top3 = best.picks.slice(0, 3);
      html = `${mascot}<div class="t-head m"><span>奶娃大厨 · 取餐单</span><span>${printed}</span></div>
        <div class="t-title"><span class="t-code" aria-hidden="true">${code}</span>
          <h1><span class="t-when">${when}去</span><span class="t-hall">${esc(best.h.name)}</span></h1></div>
        <div class="t-note"><p class="t-hello">${filterNote}${hello}</p><span class="t-stamp" aria-hidden="true">奶娃<br>推荐</span></div>
        <hr class="dash">
        <ol class="t-dishes">${top3.map((p) => `<li><div class="line"><span>${esc(p.it.zh || p.it.n)}</span><span class="lead"></span>${calHTML(p.it)}</div><span class="sub">窗口 · ${esc(p.st)}</span></li>`).join("")}</ol>
        <div class="line t-total m"><span>共 ${top3.length} 道</span><span class="lead"></span><span class="num">${top3.reduce((s, p) => s + (p.it.cal || 0), 0)}</span> <span class="unit">千卡</span></div>
        <hr class="dash">
        <div class="t-foot m">${best.picks.length} 个窗口有硬菜${second ? ` · 备选 ${state.codes[second.h.slug]} ${esc(shortHall(second.h.name))}` : ""}</div>
        <button type="button" class="chef-go" data-hall="${esc(best.h.slug)}" data-date="${plan.date}" data-meal="${plan.meal}">就去这家 ${ARROW}</button>`;
    }
    introResolve(ranked.length ? {
      code: state.codes[ranked[0].h.slug], when: `${when}去`, hall: ranked[0].h.name,
      dishes: ranked[0].picks.slice(0, 3).map((p) => ({ name: p.it.zh || p.it.n, cal: p.it.cal })),
    } : { empty: true, when: `${when}${MEAL_ZH[plan.meal]}` });
    const box = el.chef;
    if (renderChef.html !== html || box.hidden) {
      const first = box.hidden;
      renderChef.html = html;
      box.innerHTML = html;
      box.hidden = false;
      FX.ticketIn(box, { first });
    }

    // 排行：和地图、菜单用同一套取餐号
    el.rank.innerHTML = `<div class="rank-head"><h2 id="rankTitle">${whenMeal} · 各食堂硬菜</h2><span class="m">有硬菜的窗口</span></div>
      <ol>${ranked.map((r, i) => `<li><button type="button" data-hall="${esc(r.h.slug)}" class="${r.h.slug === state.hall ? "current" : ""} ${i === 0 ? "is-best" : ""}">
          <span class="line"><span><span class="code">${state.codes[r.h.slug]}</span><span class="hall">${esc(shortHall(r.h.name))}</span></span><span class="lead"></span><span class="num">${r.picks.length}</span></span>
          <span class="sub">${esc(r.picks[0].it.zh || r.picks[0].it.n)}</span></button></li>`).join("")}
        ${closed.map((r) => `<li><button type="button" data-hall="${esc(r.h.slug)}" class="closed ${r.h.slug === state.hall ? "current" : ""}">
          <span class="line"><span><span class="code">${state.codes[r.h.slug]}</span><span class="hall">${esc(shortHall(r.h.name))}</span></span><span class="lead"></span><span class="num">0</span></span>
          <span class="sub">这一餐没有硬菜${state.filters.size ? "（按筛选）" : ""}</span></button></li>`).join("")}</ol>`;
    el.rank.hidden = false;
  }
  el.chef.addEventListener("click", (e) => {
    if (e.target.closest(".t-mascot")) { FX.chefJump(e.target.closest(".t-mascot")); return; }
    const go = e.target.closest(".chef-go");
    if (go) {
      state.date = go.dataset.date; state.meal = go.dataset.meal;
      selectHall(go.dataset.hall);
    }
  });
  el.rank.addEventListener("click", (e) => {
    const b = e.target.closest("[data-hall]"); if (!b) return;
    const plan = chefPlan();
    state.date = plan.date; state.meal = plan.meal;
    selectHall(b.dataset.hall);
  });

  // ---------- 事件 ----------
  el.halls.addEventListener("click", (e) => {
    const b = e.target.closest("[data-hall]"); if (!b) return;
    selectHall(b.dataset.hall, { scroll: false });
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
    lsSet(LS_FILTERS, [...state.filters].join(",")); render(); FX.chipPop(b);
  });
  let qTimer;
  el.q.addEventListener("input", () => {
    clearTimeout(qTimer);
    el.clearQ.hidden = !el.q.value;
    qTimer = setTimeout(() => { state.q = el.q.value.trim(); render(); }, 150);
  });
  el.q.addEventListener("keydown", (e) => { if (e.key === "Enter") el.q.blur(); });
  el.clearQ.addEventListener("click", () => { el.q.value = ""; el.clearQ.hidden = true; state.q = ""; render(); el.q.focus(); });

  // 点硬菜或搭配里的菜：滚到列表里那道菜，闪一下
  el.hardSlot.addEventListener("click", (e) => {
    const a = e.target.closest("[data-jump], [data-find]"); if (!a) return;
    e.preventDefault();
    const target = a.dataset.jump ? document.getElementById(a.dataset.jump)
      : [...el.menu.querySelectorAll(".item")].find((x) => x.querySelector(".en") ? x.querySelector(".en").textContent === a.dataset.find : x.querySelector(".name").textContent === a.dataset.find);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash");
  });

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
      el.menu.innerHTML = emptyHTML("加载失败", "检查一下网络，然后刷新页面");
      introResolve(null);
      return;
    }
    // 取餐号：首字母 + 序号（C1 Carson's … R5 Rheta's），小票、排行、地图、菜单都用同一个
    state.halls.forEach((h, i) => { state.codes[h.slug] = h.name.trim()[0].toUpperCase() + (i + 1); });
    if (!hallBy(state.hall)) state.hall = state.halls[0] && state.halls[0].slug;
    if (lsGet("uwdining.map")) setMapOpen(true);
    render();
  })();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
  }
})();
