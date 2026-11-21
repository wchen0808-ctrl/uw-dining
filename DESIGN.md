---
name: UW 食堂
description: 大块颗粒渐变、超大衬线字、一屏一个食堂的滚动故事；每个食堂一个主色。
colors:
  hall-c1: "#d7262b"   # Carson's，也是首页红
  hall-f2: "#2a43d4"   # Four Lakes
  hall-g3: "#c8470f"   # Gordon Avenue
  hall-l4: "#cc2f78"   # Liz's
  hall-r5: "#1b8048"   # Rheta's
  glow: "#f6eeea"      # 渐变顶上的奶白光、超大字的颜色
  bg: "#ecebe7"        # 菜单区纸面（深色模式 #131211）
  card: "#f8f7f4"      # 菜单卡片（深色模式 #1d1c1a）
  ink: "#1d1b19"
  fade: "#66625c"
typography:
  wordmark: { fontFamily: "Noto Serif SC", fontWeight: 900, fontSize: "min(41vw, 60svh)" }
  hall-title: { fontFamily: "Instrument Serif", fontWeight: 400, fontSize: "clamp(58px, 16.5vw, 176px)", textTransform: uppercase, lineHeight: 0.84 }
  card-title: { fontFamily: "Instrument Serif", fontSize: "30px", textTransform: uppercase }
  pitch: { fontFamily: "Poppins", fontWeight: 600, fontSize: "18–30px" }
  label: { fontFamily: "Poppins", fontWeight: 700, fontSize: "11–12px", letterSpacing: "0.08–0.16em", textTransform: uppercase }
  body: { fontFamily: "Poppins + PingFang SC / Microsoft YaHei", fontSize: "15px" }
rounded:
  pill: 999px
  panel: 26px
  card: 22px
---

# Design System: UW 食堂

2026-11-20 起替换了之前的“外卖小票”方向（应项目所有者要求，参考一个饮料品牌官网的版式和动效）。只借鉴风格和动效手法，不用对方的品牌、图片和文案。

## 页面结构

1. **开场**：浅灰颗粒底，正中一个奶娃转圈，下面数百分比（真实加载进度：食堂数据、首页图片、字体）。数到 100% 奶娃转着缩没，整块往上收走。
2. **首页**：UW 红渐变，顶部一团奶白光；正中超大的“食堂”两个衬线字；五个食堂的 3D 奶娃飘在字前面（手机上三个），推荐的那家在正中最前。左下一句话：“今晚就去 *Gordon Avenue*”，下面一个描边胶囊按钮跳到故事。
3. **一屏一个食堂**（吸顶舞台，滚动切换）：背景换成这家的主色，左上大写衬线店名，下面小号大写说明（第几推荐 · 取餐号 · 餐次 · 几个窗口有硬菜），一句俏皮话；正中是这家的奶娃，旁边飘着 3D 食物；左下“今日硬菜”清单，右下白色胶囊“看菜单”。右侧圆点是五个取餐号，点了跳过去。顺序按奶娃推荐排。
4. **菜单区**：浅色颗粒纸面。左边一块当前食堂主色的大圆角面板（店名、日期、餐次、食堂、搜索、筛选，白字白描边），右边是浅色卡片：这一餐的硬菜、搭配建议、各窗口。地图打开时在面板下面。

## 颜色

- 每个食堂一个主色（见上），白字在上面对比度 ≥ 4.5:1。首页固定用 C1 红；顶栏按钮跟着当前画面的颜色走。
- 渐变公式：顶部奶白光（`--glow`）+ 底部一点浅粉光 + 主色。
- 全屏叠一层很淡的颗粒噪点（overlay 混合，16%）。
- 菜单区的强调色（硬菜标签、角色标签、进度条）用当前食堂主色。

## 字体

- 超大中文：Noto Serif SC 900（Google Fonts 只按需下载用到的字）。
- 店名、卡片标题：Instrument Serif，全部大写，行高很紧。
- 正文、按钮：Poppins，中文落到系统黑体。按钮和小标签全大写、加字距。

## 动效（Motion）

- 首页进场：两个大字从下往上顶出来，奶娃们依次弹进来，然后各自慢慢上下漂；鼠标移动有视差，往下滚奶娃往上飘散、大字淡出。
- 换食堂：标题一行行从遮罩里顶上来，奶娃从下面弹进来转正，旧的往上飞走；食物弹进来；滚动过程中奶娃和食物跟着轻微旋转、漂移。
- 菜单：卡片依次浮现；餐次白块弹簧滑动；按钮按下缩一下。
- 系统开了“减少动态效果”：不放开场，不做滚动联动，直接切换。

## 素材

`icons/naiwa-c1…r5.webp`（五个食堂的奶娃）和 `icons/food-*.webp`（鸡腿、西兰花、饺子、煎蛋、草莓、辣椒）用 Codex 的图片生成工具，以原来的奶娃为参考生成，透明背景，转成 WebP。

## Do / Don't

- Do：一屏只讲一家；数字和菜名来自真实数据。
- Don't：不在彩色背景上放长段小字（菜单正文都在浅色卡片里）；不编造营业时间或评分。
