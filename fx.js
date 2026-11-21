// 动效层：用 Motion（motion.dev）做弹簧和缓动。
// Motion 没加载成功、或者系统开了“减少动态效果”时，所有函数都变成空操作（开场直接跳过），页面照常可用。
"use strict";
(() => {
  const M = window.Motion;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noop = () => {};
  if (!M || reduce) {
    document.documentElement.classList.remove("loading");
    window.FX = new Proxy({}, { get: () => noop });
    return;
  }
  document.documentElement.classList.add("has-motion");
  const { animate, stagger } = M;
  const springy = { type: "spring", stiffness: 420, damping: 30 };
  const bouncy = { type: "spring", stiffness: 520, damping: 16 };
  const soft = { type: "spring", stiffness: 140, damping: 20 };
  const outExpo = [0.16, 1, 0.3, 1];
  const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { /* 动效出错不影响功能 */ } };

  // 按下任意按钮：轻轻缩一下，松手弹回
  const pressed = new Set();
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button, .s-go");
    if (!b || b.disabled) return;
    pressed.add(b);
    animate(b, { scale: 0.94 }, { type: "spring", stiffness: 700, damping: 30 });
  }, { passive: true });
  const release = () => { pressed.forEach((b) => animate(b, { scale: 1 }, bouncy)); pressed.clear(); };
  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", release, { passive: true });

  window.FX = {
    // ---------- 开场：百分比从 0 数到 100，奶娃转圈，然后整块往上收走 ----------
    loader: (ready, done) => {
      const root = document.documentElement, box = document.getElementById("loader");
      if (!box || !root.classList.contains("loading")) { done && done(false); return; }
      const num = document.getElementById("ldNum"), cap = box.querySelector(".ld-cap");
      let shown = 0, target = 8, finished = false, isReady = false;
      const t0 = performance.now();
      // 没准备好之前慢慢逼近 90，准备好了冲到 100
      const tick = () => {
        if (finished) return;
        const t = (performance.now() - t0) / 1000;
        target = isReady ? 100 : Math.min(90, 8 + t * 55);
        shown += (target - shown) * (isReady ? 0.22 : 0.08);
        if (isReady && target - shown < 0.6) shown = 100;
        num.textContent = Math.round(shown);
        if (shown >= 100) return leave();
        requestAnimationFrame(tick);
      };
      const leave = async () => {
        finished = true; num.textContent = "100";
        try {
          animate(cap, { scale: [1, 1.25, 0], rotate: [0, -30, 200] }, { duration: 0.55, ease: [0.5, 0, 0.75, 0] });
          await animate(box, { clipPath: ["inset(0 0 0% 0)", "inset(0 0 100% 0)"] }, { duration: 0.7, delay: 0.25, ease: [0.76, 0, 0.24, 1] });
        } catch (e) { /* 忽略 */ }
        root.classList.remove("loading");
        box.remove();
        done && done(true);
      };
      const guard = setTimeout(() => { isReady = true; }, 6000); // 网太慢也最多等 6 秒
      Promise.resolve(ready).catch(() => {}).then(() => {
        // 至少转满一圈，别一闪而过
        const wait = Math.max(0, 900 - (performance.now() - t0));
        setTimeout(() => { clearTimeout(guard); isReady = true; }, wait);
      });
      requestAnimationFrame(tick);
    },

    // ---------- 首页进场：大字从下往上顶出来，奶娃们一个个飞进来 ----------
    heroIn: safe((hero) => {
      animate(hero.querySelectorAll(".wm-ch"), { y: ["70%", "0%"], opacity: [0, 1], rotate: [8, 0] },
        { delay: stagger(0.09), duration: 1.1, ease: outExpo });
      animate(hero.querySelectorAll(".hf-in"), { y: [260, 0], opacity: [0, 1], scale: [0.7, 1] },
        { delay: stagger(0.08, { startDelay: 0.2 }), type: "spring", stiffness: 90, damping: 14 });
      animate(hero.querySelectorAll(".hero-kicker, .hero-copy > *, .hero-down"), { y: [24, 0], opacity: [0, 1] },
        { delay: stagger(0.07, { startDelay: 0.55 }), duration: 0.7, ease: outExpo });
    }),
    // 奶娃一直轻轻上下漂（每个节奏不同）
    bob: safe((els) => {
      els.forEach((e, i) => animate(e, { y: [0, -14 - (i % 3) * 4, 0], rotate: [0, i % 2 ? 2.5 : -2.5, 0] },
        { duration: 3.2 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }));
    }),

    // ---------- 故事：换食堂时，标题一行行顶上来，奶娃从下面弹进来，旧的往上飞走 ----------
    slideIn: safe((slide, dir) => {
      const d = dir >= 0 ? 1 : -1;
      animate(slide.querySelectorAll(".s-title .ln > span"), { y: [`${105 * d}%`, "0%"] },
        { delay: stagger(0.06), duration: 0.8, ease: outExpo });
      animate(slide.querySelectorAll(".s-sub, .s-line, .s-list .lbl, .s-list li, .s-list .none, .s-go"),
        { opacity: [0, 1], y: [18 * d, 0] }, { delay: stagger(0.045, { startDelay: 0.12 }), duration: 0.55, ease: outExpo });
    }),
    figIn: safe((fig, dir) => {
      const d = dir >= 0 ? 1 : -1;
      animate(fig, { opacity: [0, 1], scale: [0.72, 1], rotate: [14 * d, 0], y: [140 * d, 0] },
        { ...soft, stiffness: 170, damping: 17 });
    }),
    figOut: safe((fig, dir) => {
      const d = dir >= 0 ? 1 : -1;
      animate(fig, { opacity: 0, scale: 0.8, rotate: -12 * d, y: -140 * d }, { duration: 0.4, ease: [0.5, 0, 0.75, 0] });
    }),
    foodsIn: safe((foods, dir) => {
      const d = dir >= 0 ? 1 : -1;
      animate(foods, { opacity: [0, 1], scale: [0.4, 1], y: [120 * d, 0] }, { delay: stagger(0.06, { startDelay: 0.08 }), type: "spring", stiffness: 160, damping: 15 });
    }),
    foodsOut: safe((foods, dir) => {
      animate(foods, { opacity: 0, scale: 0.5 }, { duration: 0.3 });
    }),

    // ---------- 菜单 ----------
    menuIn: safe((menu, dir) => {
      if (dir) animate(menu, { x: [dir * 48, 0], opacity: [0.25, 1] }, springy);
      const cards = menu.querySelectorAll(".hard-block, .combo, .station, .empty-state");
      if (cards.length) {
        animate(cards, { opacity: [0, 1], y: [24, 0] },
          { delay: stagger(0.05, { startDelay: dir ? 0.04 : 0 }), duration: 0.5, ease: outExpo });
      }
    }),
    mealInk: safe((meals) => {
      let ink = meals.querySelector(".meal-ink");
      const on = meals.querySelector('[aria-selected="true"]');
      if (!on) return;
      const first = !ink;
      if (first) {
        ink = document.createElement("span");
        ink.className = "meal-ink";
        meals.prepend(ink);
        meals.classList.add("has-ink");
      }
      const to = { x: on.offsetLeft, width: on.offsetWidth };
      if (first) animate(ink, to, { duration: 0 });
      else animate(ink, to, springy);
    }),
    datePop: safe((btn) => {
      const dd = btn && btn.querySelector(".dd");
      if (dd) animate(dd, { scale: [0.6, 1] }, bouncy);
    }),
    chipPop: safe((chip) => animate(chip, { scale: [0.85, 1] }, bouncy)),
    panelTint: safe((panel) => animate(panel, { scale: [0.985, 1] }, { type: "spring", stiffness: 300, damping: 20 })),

    // ---------- 地图 ----------
    mapIn: safe((panel) => {
      animate(panel, { opacity: [0, 1], y: [20, 0] }, springy);
      const pins = panel.querySelectorAll(".pin-g");
      animate(pins, { y: [-40, 0], opacity: [0, 1] }, { ...bouncy, delay: stagger(0.07, { startDelay: 0.12 }) });
    }),
    cardIn: safe((card) => {
      animate(card, { opacity: [0, 1], scale: [0.9, 1], y: [8, 0] }, { type: "spring", stiffness: 500, damping: 26 });
      animate(card.querySelectorAll("li"), { opacity: [0, 1], x: [-8, 0] }, { delay: stagger(0.05, { startDelay: 0.06 }), duration: 0.25 });
    }),
    pinBounce: safe((g) => {
      const p = g && g.querySelector(".pin-g");
      if (p) animate(p, { y: [0, -10, 0] }, { duration: 0.45, ease: "easeOut" });
    }),

    toastIn: safe((t) => animate(t, { opacity: [0, 1], y: [20, 0], scale: [0.9, 1] }, bouncy)),
  };
})();
