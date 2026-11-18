---
name: UW 食堂小票
description: Each meal is a freshly printed thermal receipt on a grey counter; 奶娃大厨's pick is your pickup ticket.
colors:
  stamp-red: "#c5050c"
  on-stamp: "#ffffff"
  counter-grey: "#e4e3de"
  thermal-paper: "#f8f8f5"
  paper-shade: "#ededea"
  receipt-ink: "#191919"
  faded-thermal: "#5f5f5a"
  rule-grey: "#9e9e98"
  dot-grey: "#bdbdb6"
  lake-grey: "#d6dcda"
  dark-counter: "#0f0f0f"
  dark-paper: "#1c1c1b"
  dark-paper-shade: "#272726"
  dark-ink: "#edece7"
  dark-fade: "#a6a59f"
  dark-rule: "#5b5b56"
  dark-dot: "#43433f"
  dark-lake: "#26302e"
  dark-stamp-red: "#ff4d56"
typography:
  display:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "72px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.05em"
    fontVariation: "'wdth' 87.5"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  sub:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
  figure:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 87.5"
  label-mono:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 87.5"
rounded:
  none: "0px"
  pin: "2px"
  stamp: "50%"
spacing:
  hairline: "2px"
  chip-gap: "6px"
  sm: "8px"
  row: "9px"
  md: "12px"
  gut: "16px"
  receipt-pad: "18px"
  section-gap: "26px"
  edge: "8px"
components:
  button-primary:
    backgroundColor: "{colors.stamp-red}"
    textColor: "{colors.on-stamp}"
    rounded: "{rounded.none}"
    height: "46px"
    width: "100%"
  button-ink:
    backgroundColor: "{colors.receipt-ink}"
    textColor: "{colors.thermal-paper}"
    rounded: "{rounded.none}"
    height: "40px"
  button-box:
    backgroundColor: "transparent"
    textColor: "{colors.receipt-ink}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  button-box-pressed:
    backgroundColor: "{colors.receipt-ink}"
    textColor: "{colors.thermal-paper}"
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.receipt-ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "36px"
  chip-filter-pressed:
    backgroundColor: "{colors.receipt-ink}"
    textColor: "{colors.thermal-paper}"
  hall-switch:
    backgroundColor: "transparent"
    textColor: "{colors.receipt-ink}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
  input-search:
    backgroundColor: "{colors.thermal-paper}"
    textColor: "{colors.receipt-ink}"
    rounded: "{rounded.none}"
    padding: "0 6px 0 10px"
    height: "44px"
  receipt:
    backgroundColor: "{colors.thermal-paper}"
    textColor: "{colors.receipt-ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.receipt-pad}"
  diet-tag:
    backgroundColor: "transparent"
    textColor: "{colors.receipt-ink}"
    typography: "{typography.label-mono}"
    padding: "4px 6px"
  map-pin:
    backgroundColor: "{colors.receipt-ink}"
    textColor: "{colors.thermal-paper}"
    rounded: "{rounded.pin}"
    size: "48px 32px"
  map-pin-best:
    backgroundColor: "{colors.stamp-red}"
    textColor: "{colors.on-stamp}"
---

# Design System: UW 食堂小票

## Overview

**Creative North Star: "The Pickup Ticket"**

Every block of content is a length of thermal receipt paper that has just come out of a printer and been laid on a grey dining-hall counter. 奶娃大厨's recommendation is the pickup ticket on top: a huge mono pickup code (R5), "今晚去 / hall name", three dishes with dotted leaders running to their calories, a red rubber stamp, and one red action. Under it the hall ranking and the full menu are more receipts of the same paper. The page reads like something printed for you, not like a food app; it refuses the default red header over photo cards.

The material vocabulary is small and strict: paper, ink, faded thermal grey, dashed and dotted rules, zigzag tear edges top and bottom. Selection is shown by ink reversal (ink block, paper text), never by colour. UW red is rationed to the stamp family: the 奶娃推荐 stamp, the single primary button, and the marks that point at the recommended hall (the red best pin on the map, the red 推荐 word in the ranking). Density is receipt-tight: one body size, sublines one step down, figures in Martian Mono so columns of calories and codes align.

Personality lives in the mascot and the motion, not in decoration. The ticket prints out of its top edge, the stamp slams down, the egg chef pops up behind the ticket and breathes; pins drop onto the map; buttons squash on press. All of it is a no-op under reduced motion or if Motion fails to load.

**Key Characteristics:**
- Thermal paper on a grey counter; zigzag tear edges on every paper block
- Ink reversal for every selected state (date, meal, hall, filter, current rank code)
- UW red only for the stamp, the one primary action, and the recommended-hall marks
- Martian Mono (condensed, tabular) for every figure, time, and the fixed pickup codes C1, F2, G3, L4, R5
- Dashed rules between sections, dotted leaders and dotted row dividers inside them
- Square corners everywhere except the round stamp and the 2px map pin
- Signature motion: the ticket prints, the stamp lands, the chef pops up

## Colors

A near-monochrome thermal palette of warm-neutral greys with one rationed red; every token is redefined for dark mode under `prefers-color-scheme: dark`.

### Primary
- **UW Stamp Red** (`stamp-red`; dark `dark-stamp-red`): the 奶娃推荐 stamp ring and lettering, the 就去这家 primary button, the recommended hall's map pin, and the 推荐 suffix in the ranking. Text on it uses `on-stamp` (white in light, `dark-paper` in dark).

### Neutral
- **Counter Grey** (`counter-grey` / `dark-counter`): the page background and the sticky date/meal header; also the PWA theme colour. The surface the receipts sit on.
- **Thermal Paper** (`thermal-paper` / `dark-paper`): every receipt block, the search field, the map card. Also the "text" colour of anything ink-reversed.
- **Paper Shade** (`paper-shade` / `dark-paper-shade`): the map ground inside the map receipt, and the halo stroke behind map labels.
- **Receipt Ink** (`receipt-ink` / `dark-ink`): all primary text, 1.5px box borders, focus rings, map pins, and the fill of every selected state.
- **Faded Thermal** (`faded-thermal` / `dark-fade`): sublines, English originals, units (千卡), timestamps, notes, map labels.
- **Rule Grey** (`rule-grey` / `dark-rule`): dashed section rules, station-heading rules, unpressed filter borders, map campus-green dashes and footpaths.
- **Dot Grey** (`dot-grey` / `dark-dot`): dotted leaders and dotted dividers between menu rows and ranking rows.
- **Lake Grey** (`lake-grey` / `dark-lake`): Lake Mendota on the map; the only tinted neutral.

### Named Rules
**The Stamp Ration Rule.** Red appears only on the stamp, the one primary action, and marks that point at the recommended hall. Nothing else is red: no red headers, no red links, no red selected states.

**The Ink Reversal Rule.** A selected or current thing is an ink block with paper-coloured text. Never signal selection with a colour, a tint, or an underline.

## Typography

**Display / Figure Font:** Martian Mono (variable, self-hosted Latin subset, `font-stretch: 87.5%`), falling back to ui-monospace, SFMono-Regular, Menlo
**Body Font:** the system sans stack, Latin faces first so apostrophes in names like Rheta's take Latin glyphs, then PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei

**Character:** A printer's monospace for anything a receipt printer would print as a number (codes, calories, dates, times, counts), and the phone's own CJK sans for words. The mono is condensed and tightly tracked so it reads as thermal print rather than code.

### Hierarchy
- **Display** (Martian Mono 800, 72px, line-height 0.9, -0.05em): the pickup code on the ticket, once per screen.
- **Headline** (sans 700, 25px, 1.12): the ticket's "今晚去 / hall name"; the menu receipt heading runs one step down at 22px/1.2.
- **Title** (sans 700, 15px): receipt section heads (ranking, map), station headings flanked by dashed rules.
- **Body** (sans 400–600, 15px, 1.45): every menu row and dish name; dish names at 600. Menu rows all run on this one size.
- **Sub** (sans 400, 12.5px): the English original, station, allergens under each dish; 12px on the ticket and map card.
- **Figure** (Martian Mono 600, 15px, tabular, -0.02em): calories, ranking counts, totals; date numerals at 17px/600.
- **Label Mono** (Martian Mono 400, 11.5px, faded): print timestamps, meta lines, summaries, hints, hall codes inside chips.

### Named Rules
**The Printed Figure Rule.** Every number, code, date and time is set in Martian Mono with tabular figures. Words never are.

**The One Step Down Rule.** A menu row has one size (15px); everything secondary under it drops exactly one step (12–12.5px, faded). No third level.

## Layout

Phone-first single column with a 16px gutter (`--gut`). Receipts stack with 26px between them; each receipt pads 18px inside (14px for the map). The header is a slim brand bar followed by a sticky block holding a seven-day date grid (48px-tall cells, 2px gaps, chevron week buttons either side) and a boxed three-way meal switch; the sticky block picks up a soft drop shadow only once stuck.

At 900px and up the layout becomes two columns inside a 1180px max width: a 340–400px side column (ticket, ranking, map, sticky below the header) beside the menu receipt, with 32px between. At 1120px and up the menu flows into two CSS columns (40px gap), stations never splitting. Under 600px the map card drops out of its floating position and becomes an inline section under a dashed rule.

Rows are the rhythm: 9px vertical padding per menu item, 8px between ticket dishes, 52px minimum ranking rows. Touch targets stay at or above 44px for primary controls (date cells 48px, search 44px, primary button 46px); box and filter buttons are 36px.

## Elevation & Depth

Flat. Depth is paper on counter: the receipt's lighter value against the grey counter and its zigzag tear edges do the work that shadows do elsewhere. Shadows exist only for things that float over the page.

### Shadow Vocabulary
- **Stuck header** (`box-shadow: 0 6px 12px -10px rgba(0,0,0,0.35)`): the sticky date/meal block, only while stuck.
- **Floating map card** (`box-shadow: 0 10px 24px -8px rgba(0,0,0,0.3)`): the hall card over the map on wide screens.
- **Toast** (`box-shadow: 0 8px 20px -8px rgba(0,0,0,0.4)`): the ink toast at the bottom of the screen.

### Named Rules
**The Paper Has No Shadow Rule.** Receipts never carry a shadow; the tear edge and the counter contrast are their depth.

## Shapes

Square corners throughout: buttons, chips, fields, tags, receipts and the meal switch all have 0 radius. The two exceptions are both stamp-family or map objects: the 奶娃推荐 stamp is a 66px circle with a 3px ring and an inset 1px ring, rotated -14deg and multiplied onto the paper; map pins are 48x32 ink rectangles with a 2px radius and a triangular tail.

Every paper block has an 8px zigzag tear edge top and bottom, drawn as a masked 12x8 triangle repeat in the paper colour. Lines carry meaning by style: 1.5px solid ink for boxed controls, 1.5px dashed rule grey between sections and around station headings, 2px dotted dot grey for leaders from a dish to its calories, 1px dotted between menu rows. Diet tags reuse border style as their code: solid outline (素食), ink-filled (纯素), double border (清真), dashed (无常见过敏原).

## Components

### Buttons
Blunt, boxed and printed; every button squashes to 0.92 on press and springs back.
- **Shape:** square (0px).
- **Primary (就去这家):** full-width UW red block, 46px tall, 16px/700 white text with an arrow; hover brightens slightly. One per screen.
- **Ink (看 … 完整菜单):** full-width ink block with paper text, 40px, used for the map card's secondary action.
- **Box (地图, 回到今天):** transparent with a 1.5px ink border, 36px, 14px/600; pressed state reverses to ink.
- **Focus:** 2px solid ink outline, 2px offset, on every control.

### Chips
- **Hall switch:** 40px boxed buttons with the hall's mono code (C1…R5) in faded grey before the short name; pressed reverses to ink and the code turns paper.
- **Filters:** 36px, 1.5px rule-grey border that darkens to ink on hover; pressed reverses to ink. Pop with a bouncy spring on toggle.

### Cards / Containers (Receipts)
- **Corner Style:** square, with zigzag tear edges top and bottom.
- **Background:** thermal paper on counter grey.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** none; internal structure comes from dashed rules.
- **Internal Padding:** 18px (14px for the map receipt).

### Inputs / Fields
- **Style:** 44px search field, paper fill, 1.5px ink border, inline 18px search glyph, 16px text, faded placeholder.
- **Focus:** the whole field takes the 2px ink outline (focus-within); caret is stamp red.

### Navigation
- **Date strip:** seven mono numerals over 11px faded weekday labels; today is marked by a dotted underline; selected reverses to ink; days without data drop to 40% opacity. The selected numeral pops from 0.6 scale.
- **Meal switch:** a 1.5px ink box divided into three; an ink bar springs between cells under the selected meal.

### Pickup Ticket (signature)
The 奶娃大厨 取餐单: a mono head line (取餐单 · print timestamp), the 72px pickup code beside the two-line headline, the hello line with the red stamp landing on its right, a dashed rule, three dish rows with dotted leaders to mono calories and a faded 窗口 subline, a total row, a faded foot line naming the runner-up by code, and the red primary button. The mascot stands on the ticket's top edge at the right. Entrance: clip-path reveal from the top edge over 0.75s (`cubic-bezier(0.16, 1, 0.3, 1)`) with contents staggering in at 50ms, the stamp landing from 2.2x scale and -38deg, the chef springing up from behind, then breathing on a 2.4s loop.

### Ranking Receipt
Rows of mono code, bold short hall name and a dotted leader to the count of stations with main dishes, with the top dish as a faded subline indented under the name. The current hall's code reverses to ink; the recommended hall gets the red 推荐 suffix; closed halls fade.

### Menu Row
A station heading centred between two dashed rules, an optional faded note, then items: Chinese name (600), dotted leader, mono calories with a faded 千卡 unit; under it the English original, allergens and diet tags. Rows separated by 1px dotted dividers.

### Campus Map
A hand-drawn SVG on paper shade: lake in lake grey, roads as paper-coloured strokes, footpaths as dotted rule grey, landmarks faded. Each hall is an ink pin carrying its mono code with a bold name haloed in paper shade; the recommended hall's pin is red. Pins drop in with a staggered bounce; the selected pin scales to 1.12 and the hall card springs out of it.

## Do's and Don'ts

### Do:
- **Do** put every content block on thermal paper with the 8px zigzag tear edge, set on the counter grey.
- **Do** show every selected, pressed or current state by ink reversal (receipt ink fill, paper text).
- **Do** set every figure, code, date and time in Martian Mono at 87.5% width with tabular figures.
- **Do** keep each hall's fixed code (C1, F2, G3, L4, R5) identical across ticket, ranking, hall switch, map pins and map card.
- **Do** separate sections with 1.5px dashed rules and join names to figures with dotted leaders.
- **Do** keep every animation behind Motion and make it a no-op under reduced motion.

### Don't:
- **Don't** use UW red for anything but the stamp, the one primary action, and the recommended-hall marks.
- **Don't** round corners on buttons, chips, fields or receipts; only the stamp is round.
- **Don't** put shadows on paper; shadows are reserved for the stuck header, the floating map card and the toast.
- **Don't** signal selection with colour, tint or a coloured underline.
- **Don't** add a third type level under a menu row or set Chinese text in the mono.
