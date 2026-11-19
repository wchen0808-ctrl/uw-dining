---
version: 1
slug: "cafeteria-index-html"
primary_target: "index.html"
related_targets: ["style.css","app.js"]
---

# 食堂菜单 (cafeteria/) surface brief

Mode: Operate. Phone-first PWA for Chinese-speaking UW students deciding where to eat this meal. Constraints: static files, Motion vendored, existing features and Playwright tests keep working, no invented hours or ratings.

## Direction contract

THESIS: Each meal is a freshly printed takeout receipt; 奶娃大厨's pick is your pickup ticket. Refuses the food-app default of a red header over photo cards.

OWN-WORLD: Thermal paper (#f6f6f3) on a grey counter (#e7e6e1), ink #1a1a1a, faded thermal grey for sublines, dashed and dotted rules, zigzag tear edges; UW red #c5050c only as the stamp and the one action. Mono figures (Martian Mono) for calories, codes and times; CJK in the system sans. Selection is ink reversal, never colour.

STORY: The visitor reads where to go, why (three main dishes with calories), taps 就去这家, and checks that hall's receipt of stations; allergens stay one line under each dish.

FIRST VIEWPORT: Slim bar (UW 食堂小票, 地图; the print timestamp lives in the ticket head because it is the receipt's own print time), sticky date strip and boxed meal switch, then the ticket: pickup code R5 as a 72px mono numeral with the stamp landing on it, h1 "今晚去 / hall name", mascot and red 奶娃推荐 stamp, three dish rows with dotted leaders, the red action; the hall ranking starts below it. Raises: ranking and map share codes and pins (doujin catalog); every hall carries a fixed code C1–R5 (Saville catalog); menu rows run on one size, sublines one step down (timetable).

FORM: #6 of 7 grounded candidates (外卖小票); seed:30d8542e4b564111. Signature move: the ticket prints out of the top edge (clip reveal) and the stamp lands.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
