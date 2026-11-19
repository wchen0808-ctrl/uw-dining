# UW 食堂菜单（PWA）

一个中文手机网页，用来查看 UW–Madison 五个学校食堂（Carson's、Four Lakes、Gordon Avenue、Liz's、Rheta's）每天的菜单。可以添加到手机主屏幕，像 App 一样使用，没网时也能看已经打开过的菜单。

## 功能

- 打开默认显示今天，按当前时间自动选早餐 / 午餐 / 晚餐（10:30 前早餐，14:30 前午餐，之后晚餐）
- 顶部日期条可以翻到未来两周；在菜单区域左右滑动换一天
- 切换食堂，自动记住上次选的（localStorage）
- 菜名中英文对照（中文在上，英文原名在下），搜索支持中英文
- 每道菜显示所在窗口、热量、素食 / 纯素 / 清真标签和中文过敏原（例如：含：小麦、大豆）
- 筛选：素食、纯素、清真、无常见过敏原（Top 9 Free）
- 食堂地图：点右上角“地图”，在手绘的校园示意图上标出 5 个食堂；电脑上鼠标悬停、手机上点一下，就会显示这一餐的硬菜（主菜，肉菜优先，每个窗口最多一道），点卡片按钮直接看该食堂完整菜单
- 开场动画：每次打开网页，整屏先放一段功夫奶娃出场——红日背景下飞踢进场、“嘿哈！”落地扎马步，把餐盘举起来，取餐单从下面升上来，取餐号像打印机一样跳出来，列出推荐食堂和三道硬菜，最后“奶娃推荐”红章拍下去，整屏像小票一样往上撕走。大约 4 秒，点任意处或按 Esc 直接跳过；系统开了“减少动态效果”时不放。网址加 `?intro=0` 也可以关掉（测试用）
- 奶娃大厨：按现在的时间判断是早餐、午餐还是晚餐（20:30 以后推荐明天早餐），比较各食堂这一餐的硬菜，告诉你最好去哪家吃；会参考你开着的筛选（比如清真）。点 × 关掉后，这一餐不再出现
- 动效：用 [Motion](https://motion.dev) 做的弹簧动画（换天滑动、卡片依次浮现、餐次白条滑动、图钉掉落、奶娃大厨蹦出来），库文件放在 `cafeteria/vendor/`，没网也能用；系统开了“减少动态效果”时自动关闭
- 选了食堂以后，菜单最上面先列出这一餐的硬菜（列表里也打上“硬菜”标签，点一下跳过去），下面是“搭配建议”：一份蛋白质 + 一份主食 + 一份蔬果，标出合计热量、蛋白质、碳水和膳食纤维，和一般成人一餐的参考范围对比（每天约 2000 千卡、三餐平分，只作参考）。菜单数据里没有维生素含量，所以用“一份蔬菜或水果”来保证维生素
- 搜索当天所有食堂的菜，结果显示“食堂 · 餐次 · 窗口”
- PWA：manifest + service worker（网络优先，没网时用缓存），支持深色模式，主色 UW 红 `#c5050c`

## 目录结构

```
index.html                     根目录跳转到 cafeteria/
cafeteria/                     网页本体
  index.html  app.js  style.css  sw.js  manifest.webmanifest  icons/
  data/halls.json              食堂列表
  data/YYYY-MM-DD.json         每天的菜单（今天起 14 天，保留过去 7 天）
scripts/fetch_menus.py         抓取脚本（只用 Python 标准库）
.github/workflows/update-menus.yml   每天自动抓取两次，有变化就提交
tests/iphone.test.cjs          Playwright iPhone 尺寸测试
```

## 数据从哪里来

菜单来自 UW Housing Dining 在 Nutrislice 上的接口
`https://wisc-housingdining.api.nutrislice.com/menu/api`。
这个接口不允许网页直接跨域读取，所以由 `scripts/fetch_menus.py` 提前抓好，存成静态 JSON 文件，网页只读这些文件。

脚本的处理规则：

- 窗口名取自 `day.menu_info[menu_id].section_options.display_name`，按 `position` 排序（不用 `is_section_title`，那些几乎都叫 “Build Your Own”）
- 菜名 `food.name`，标签 `food.icons.food_icons[].name`（丢掉 `Disclaimer`），热量 `food.rounded_nutrition_info.calories`
- 名字里带 `OrderIt` 的条目会被过滤掉
- 中文菜名先查人工词典 `scripts/zh_names.json`；查不到的新菜名会自动机器翻译，并缓存到 `scripts/zh_names_auto.json`（翻译失败就只显示英文）。想改某个译名，直接编辑 `zh_names.json`
- 文件内容没变就不改写，避免空提交

在本地手动更新数据：

```bash
python scripts/fetch_menus.py
```

## 开启 GitHub Pages

1. 把这个仓库推送到 GitHub（仓库需要是公开的，免费账号的私有仓库不能用 Pages）。
2. 打开仓库页面 → **Settings** → 左侧 **Pages**。
3. **Build and deployment** 里的 **Source** 选 **Deploy from a branch**。
4. **Branch** 选 `main`，文件夹选 `/ (root)`，点 **Save**。
5. 等一两分钟，页面顶部会显示网址，一般是
   `https://<你的用户名>.github.io/<仓库名>/`，它会自动跳转到 `cafeteria/`。

## 开启自动更新菜单

工作流 `.github/workflows/update-menus.yml` 每天 UTC 06:15 和 16:15 各运行一次（约 Madison 当地 0:15 和 10:15）。

1. 仓库 → **Settings** → **Actions** → **General**。
2. **Workflow permissions** 选 **Read and write permissions**，点 **Save**（工作流需要它来提交新数据）。
3. 想立刻跑一次：**Actions** 标签页 → **更新食堂菜单** → **Run workflow**。

说明：GitHub 会在仓库 60 天没有活动时暂停定时任务。机器人每天提交数据一般就算活动；如果被暂停了，到 Actions 页面重新启用即可。

## 添加到手机主屏幕

- **iPhone（Safari）**：打开网址 → 点底部分享按钮 → **添加到主屏幕**
- **Android（Chrome）**：打开网址 → 右上角菜单 → **添加到主屏幕 / 安装应用**

## 改了网页之后

改了 `app.js` 或 `style.css` 后，把 `index.html` 里的 `?v=13` 和 `sw.js` 里的版本号一起加 1，否则手机可能继续用缓存里的旧文件。

## 测试

```bash
npm i -D playwright
npx playwright install webkit chromium
node tests/iphone.test.cjs
```

测试会起一个本地服务器，用 iPhone 15 / iPhone SE（WebKit，浅色和深色）和 Chromium 检查：默认日期和餐次、窗口分组、过敏原、记住食堂、筛选、滑动换天、翻周、搜索、manifest，以及离线缓存。截图保存在 `test-results/`。

## 免责声明

数据来自 UW Housing Dining，仅供参考。过敏原和饮食标签可能有变动或交叉接触，**过敏请以食堂现场标注为准**。本项目与 UW–Madison 官方无关。
