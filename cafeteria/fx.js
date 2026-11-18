// 动效层：用 Motion（motion.dev）做弹簧动画。
// Motion 没加载成功、或者系统开了“减少动态效果”时，所有函数都变成空操作，页面照常可用。
"use strict";
(() => {
  const M = window.Motion;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noop = () => {};
  if (!M || reduce) {
    window.FX = new Proxy({}, { get: () => noop });
    return;
  }
  document.documentElement.classList.add("has-motion");
  const { animate, stagger } = M;
  const springy = { type: "spring", stiffness: 420, damping: 30 };
  const bouncy = { type: "spring", stiffness: 520, damping: 16 };
  const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { /* 动效出错不影响功能 */ } };

  // 按下任意按钮：轻轻缩一下，松手弹回
  const pressed = new Set();
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    pressed.add(b);
    animate(b, { scale: 0.92 }, { type: "spring", stiffness: 700, damping: 30 });
  }, { passive: true });
  const release = () => {
    pressed.forEach((b) => animate(b, { scale: 1 }, bouncy));
    pressed.clear();
  };
  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", release, { passive: true });

  window.FX = {
    // 换一天：整块菜单从滑动方向弹进来；窗口卡片依次浮现
    menuIn: safe((menu, dir) => {
      if (dir) animate(menu, { x: [dir * 48, 0], opacity: [0.25, 1] }, springy);
      const cards = menu.querySelectorAll(".station, .empty-state");
      if (cards.length) {
        animate(cards, { opacity: [0, 1], y: [16, 0] },
          { delay: stagger(0.045, { startDelay: dir ? 0.04 : 0 }), duration: 0.38, ease: [0.2, 0.8, 0.2, 1] });
      }
    }),

    // 早/午/晚餐下面的白条：弹簧滑到选中的那一格
    mealInk: safe((meals) => {
      let ink = meals.querySelector(".meal-ink");
      const on = meals.querySelector('[aria-selected="true"]');
      if (!on) return;
      const first = !ink;
      if (first) {
        ink = document.createElement("span");
        ink.className = "meal-ink";
        meals.appendChild(ink);
        meals.classList.add("has-ink");
      }
      const to = { x: on.offsetLeft, width: on.offsetWidth };
      if (first) animate(ink, to, { duration: 0 });
      else animate(ink, to, springy);
    }),

    // 选中的日期圆点弹一下
    datePop: safe((btn) => {
      const dd = btn && btn.querySelector(".dd");
      if (dd) animate(dd, { scale: [0.6, 1] }, bouncy);
    }),

    // 筛选按钮切换时蹦一下
    chipPop: safe((chip) => animate(chip, { scale: [0.85, 1] }, bouncy)),

    // 地图打开：面板展开，图钉依次掉下来
    mapIn: safe((panel) => {
      animate(panel, { opacity: [0, 1], y: [-10, 0] }, springy);
      const pins = panel.querySelectorAll(".pin-g");
      animate(pins, { y: [-40, 0], opacity: [0, 1] }, { ...bouncy, delay: stagger(0.07, { startDelay: 0.12 }) });
    }),

    // 地图上的硬菜卡片：从图钉位置弹出来
    cardIn: safe((card) => {
      animate(card, { opacity: [0, 1], scale: [0.9, 1], y: [8, 0] }, { type: "spring", stiffness: 500, damping: 26 });
      animate(card.querySelectorAll("li"), { opacity: [0, 1], x: [-8, 0] }, { delay: stagger(0.05, { startDelay: 0.06 }), duration: 0.25 });
    }),
    pinBounce: safe((g) => {
      const p = g && g.querySelector(".pin-g");
      if (p) animate(p, { y: [0, -10, 0] }, { duration: 0.45, ease: "easeOut" });
    }),

    // 招牌动作：取餐单从上沿“打印”出来 → 红章盖下去 → 奶娃从票后面冒出来，然后一直轻轻呼吸
    ticketIn: safe((box, { first } = {}) => {
      const stamp = box.querySelector(".t-stamp"), mascot = box.querySelector(".t-mascot");
      const img = mascot && mascot.querySelector(".chef-img");
      if (first) {
        // 撕边和奶娃都在盒子外面，裁切框要留出余量
        animate(box, { clipPath: ["inset(-48px -14px calc(100% + 12px) -14px)", "inset(-48px -14px -12px -14px)"] },
          { duration: 0.75, ease: [0.16, 1, 0.3, 1] });
        animate(box.querySelectorAll(".t-head, .t-hello, .t-title, .t-dishes li, .t-foot, .chef-go"),
          { opacity: [0, 1], y: [-6, 0] }, { delay: stagger(0.05, { startDelay: 0.12 }), duration: 0.3 });
      }
      if (stamp) animate(stamp, { scale: [2.2, 1], opacity: [0, 0.92], rotate: [-38, -14] },
        { type: "spring", stiffness: 520, damping: 22, delay: first ? 0.62 : 0.05 });
      if (img) {
        animate(img, { y: [36, 0], opacity: [0, 1] }, { type: "spring", stiffness: 320, damping: 14, delay: first ? 0.45 : 0 });
        // 蛋形身体：呼吸一样的“压扁-拉长”
        animate(img, { scaleY: [1, 0.95, 1.03, 1], scaleX: [1, 1.04, 0.98, 1] },
          { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.3 });
      }
    }),
    // 点一下奶娃：原地跳起来转一圈
    chefJump: safe((pic) => {
      const img = pic.querySelector(".chef-img"), shadow = pic.querySelector(".chef-shadow");
      if (!img) return;
      // 先蹲一下，弹起来转个身，落地再压扁
      animate(img, { y: [0, 4, -34, 0, 0], scaleY: [1, 0.82, 1.1, 0.86, 1], scaleX: [1, 1.12, 0.94, 1.1, 1], rotate: [0, 0, -10, 6, 0] },
        { duration: 0.8, times: [0, 0.15, 0.5, 0.8, 1], ease: "easeOut" });
      if (shadow) animate(shadow, { scaleX: [1, 1.1, 0.5, 1.15, 1], opacity: [1, 1, 0.35, 1, 1] },
        { duration: 0.8, times: [0, 0.15, 0.5, 0.8, 1] });
    }),
    chefOut: safe((box, done) => {
      animate(box, { opacity: 0, y: -10, scale: 0.96 }, { duration: 0.22 }).then(done);
      return true;
    }),

    toastIn: safe((t) => animate(t, { opacity: [0, 1], y: [20, 0], scale: [0.9, 1] }, bouncy)),
  };
})();
