// 动效层：用 Motion（motion.dev）做弹簧动画。
// Motion 没加载成功、或者系统开了“减少动态效果”时，所有函数都变成空操作，页面照常可用。
"use strict";
(() => {
  const M = window.Motion;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noop = () => {};
  if (!M || reduce) {
    document.documentElement.classList.remove("intro-on");
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
      const cards = menu.querySelectorAll(".hard-block, .combo, .station, .empty-state");
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

    // 开场：功夫奶娃飞踢进场 → 落地扎马步把盘子端上来 → 取餐单升起、红章拍下 → 整屏像小票一样撕走
    intro: (dataP, done) => runIntro(dataP, done),
  };

  function runIntro(dataP, done) {
    const root = document.documentElement;
    const box = document.getElementById("intro");
    if (!box || !root.classList.contains("intro-on")) { done && done(false); return; }
    const $ = (s) => box.querySelector(s);
    const stage = $(".in-stage"), kick = $(".in-kick"), serve = $(".in-serve"), sun = $(".in-sun"),
      rays = $(".in-rays"), hey = $(".in-hey"), ticket = $(".in-ticket"), tap = $(".in-tap");
    const ghosts = [...box.querySelectorAll(".in-ghost")], dust = [...box.querySelectorAll(".in-dust i")];
    const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
    const live = [];
    const A = (...a) => { try { const c = animate(...a); live.push(c); return c; } catch (e) { return null; } };
    let skipped = false, finished = false;

    const finish = async (fast) => {
      if (finished) return; finished = true;
      clearTimeout(guard);
      try {
        // 整屏往上撕走，底边是锯齿
        await animate(box, { y: ["0%", "-104%"] }, { duration: fast ? 0.32 : 0.55, ease: [0.7, 0, 0.84, 0] });
      } catch (e) { /* 忽略 */ }
      live.forEach((c) => { try { c.stop(); } catch (e) {} });
      root.classList.remove("intro-on");
      box.remove();
      done && done(true);
    };
    const skip = () => { if (!skipped) { skipped = true; finish(true); } };
    box.addEventListener("click", skip);
    const onKey = (e) => { if (["Escape", "Enter", " "].includes(e.key)) { document.removeEventListener("keydown", onKey); skip(); } };
    document.addEventListener("keydown", onKey);
    const guard = setTimeout(() => finish(true), 9000); // 不管出什么问题，9 秒后一定让出页面

    const shake = (el, px) => A(el, { x: [0, -px, px, -px * 0.6, px * 0.4, 0], y: [0, px * 0.5, -px * 0.4, px * 0.3, 0, 0] }, { duration: 0.32 });

    (async () => {
      // 1. 红日升起，背景速度线转起来
      A(sun, { scale: [0, 1], opacity: [0, 1] }, { type: "spring", stiffness: 160, damping: 18 });
      A(rays, { rotate: [0, 40] }, { duration: 6, ease: "linear" });
      A(rays, { opacity: [0, 1] }, { duration: 0.4 });
      await wait(0.18); if (skipped) return;

      // 2. 飞踢：从左上角斜着冲进来，后面拖两个残影
      const path = { x: ["-115vw", "0vw"], y: ["-34vh", "0vh"], rotate: [-28, -6], opacity: [1, 1] };
      A(kick, path, { duration: 0.46, ease: [0.12, 0.9, 0.24, 1] });
      ghosts.forEach((g, i) => A(g, { ...path, opacity: [0.5 - i * 0.18, 0] }, { duration: 0.46 + 0.1 * (i + 1), delay: 0.04 * (i + 1), ease: [0.12, 0.9, 0.24, 1] }));
      await wait(0.42); if (skipped) return;

      // 3. 落地：嘿哈！震一下，换成扎马步端盘子的姿势，地上扬起灰
      A(hey, { scale: [3, 1], opacity: [0, 1], rotate: [-18, -8] }, { type: "spring", stiffness: 600, damping: 18 });
      A(rays, { scale: [1.25, 1] }, { duration: 0.4, ease: "easeOut" });
      shake(stage, 10);
      A(kick, { opacity: [1, 0], scale: [1, 1.08] }, { duration: 0.16 });
      A(serve, { opacity: [0, 1], y: [-60, 0], scaleY: [1.12, 1], scaleX: [0.92, 1] }, { type: "spring", stiffness: 520, damping: 15 });
      dust.forEach((d, i) => {
        const a = (i / dust.length) * Math.PI - Math.PI, r = 90 + (i % 3) * 30;
        A(d, { x: [0, Math.cos(a) * r * 1.6], y: [0, Math.sin(a) * r * 0.45], scale: [0.4, 1.4], opacity: [0.9, 0] }, { duration: 0.7, ease: "easeOut" });
      });
      await wait(0.5); if (skipped) return;
      A(hey, { opacity: 0, y: -24, scale: 0.8 }, { duration: 0.35, delay: 0.5 });
      // 端着盘子轻轻颠
      A(serve, { y: [0, -8, 0] }, { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: 0.2 });

      // 4. 取餐单端上来（等数据，最多 2.5 秒）
      const data = await Promise.race([dataP, wait(2.5).then(() => null)]).catch(() => null);
      if (skipped) return;
      fillTicket(box, data);
      A(ticket, { y: ["100vh", "0vh"] }, { type: "spring", stiffness: 260, damping: 24 });
      const code = $(".in-code");
      if (code && data && data.code) scramble(code, data.code, 0.5);
      A(box.querySelectorAll(".in-ticket .in-when, .in-ticket .in-hall, .in-ticket li, .in-ticket .in-foot"),
        { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.08, { startDelay: 0.25 }), duration: 0.32 });
      A(tap, { opacity: [0, 1] }, { duration: 0.4, delay: 0.6 });
      await wait(0.85); if (skipped) return;

      // 5. 盖章：啪！
      if (data && !data.empty) {
        A($(".in-stamp"), { scale: [3.2, 1], opacity: [0, 0.94], rotate: [-40, -14] }, { type: "spring", stiffness: 700, damping: 20 });
        await wait(0.12);
        shake(ticket, 6); shake(stage, 4);
      }
      await wait(1.15);
      finish(false);
    })();
  }

  // 取餐号像打印机一样先乱跳几下再定住
  function scramble(el, final, secs) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    const t0 = performance.now();
    const tick = () => {
      const p = (performance.now() - t0) / (secs * 1000);
      if (p >= 1 || !el.isConnected) { el.textContent = final; return; }
      el.textContent = [...final].map((c, i) => (p > (i + 1) / (final.length + 1) ? c : chars[(Math.random() * chars.length) | 0])).join("");
      requestAnimationFrame(tick);
    };
    tick();
  }

  function fillTicket(box, d) {
    const t = box.querySelector(".in-ticket");
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const now = new Date(), pad = (n) => String(n).padStart(2, "0");
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (!d || d.empty) {
      t.innerHTML = `<div class="in-head"><span>奶娃大厨 · 出餐</span><span>${time}</span></div>
        <div class="in-when">${d ? esc(d.when) : "菜单"}</div><div class="in-hall">${d ? "菜单还没出来" : "还在路上…"}</div>
        <p class="in-foot">先看看别的日子吧</p>`;
      return;
    }
    t.innerHTML = `<div class="in-head"><span>奶娃大厨 · 取餐号</span><span>${time}</span></div>
      <div class="in-row"><span class="in-code">${esc(d.code)}</span>
        <div><div class="in-when">${esc(d.when)}</div><div class="in-hall">${esc(d.hall)}</div></div></div>
      <ol class="in-dishes">${d.dishes.map((x) => `<li><span>${esc(x.name)}</span><span class="lead"></span><span class="num">${x.cal != null ? x.cal : "—"}</span></li>`).join("")}</ol>
      <span class="in-stamp" aria-hidden="true">奶娃<br>推荐</span>`;
  }
})();
