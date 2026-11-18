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
      <div class="row"><span class="name">${esc(it.n)}</span>${it.cal != null ? `<span class="cal">${it.cal} 千卡</span>` : ""}</div>
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
        if (it.n.toLowerCase().includes(q) && passes(it)) {
          results.push({ it, where: `${shortHall(h.name)} · ${MEAL_ZH[meal]} · ${st.name}` });
        }
      }
    }
    const d = parseIso(state.date);
    el.menu.innerHTML = `<p class="summary">${d.getMonth() + 1}月${d.getDate()}日 所有食堂中搜索“${esc(state.q)}”：${results.length} 个结果</p>` +
      (results.length
        ? `<section class="station">${results.map((r) => itemHTML(r.it, r.where)).join("")}</section>`
        : emptyHTML("🔍", "没有找到，试试英文关键词，例如 chicken、tofu、pizza"));
  }

  let renderToken = 0;
  async function render(anim) {
    renderDates(); renderFilters(); renderHalls();
    const token = ++renderToken;
    const day = await loadDay(state.date);
    if (token !== renderToken) return;
    renderMeals(day);
    renderMenu(day);
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
    render();
  })();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
