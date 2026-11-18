#!/usr/bin/env python3
"""抓取 UW–Madison Housing Dining (Nutrislice) 接下来 14 天的菜单。

只用标准库。输出：
  cafeteria/data/halls.json         食堂列表
  cafeteria/data/YYYY-MM-DD.json    每天的菜单
只有内容变化时才改写文件（避免无意义的提交）。
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://wisc-housingdining.api.nutrislice.com/menu/api"
MEALS = ["breakfast", "lunch", "dinner"]
DAYS_AHEAD = 14
KEEP_PAST_DAYS = 7
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cafeteria", "data")
DIET_TAGS = {"Vegan", "Vegetarian", "Halal", "Top 9 Free"}
DROP_TAGS = {"Disclaimer"}


def madison_today():
    """当前 Madison（美国中部时间）日期。手写夏令时规则，避免 Windows 上缺 tzdata。"""
    now = dt.datetime.now(dt.timezone.utc)
    y = now.year

    def nth_sunday(month, n):
        d = dt.date(y, month, 1)
        d += dt.timedelta(days=(6 - d.weekday()) % 7)
        return d + dt.timedelta(weeks=n - 1)

    # 夏令时：3 月第二个周日 2:00 CST(=08:00 UTC) 到 11 月第一个周日 2:00 CDT(=07:00 UTC)
    start = dt.datetime.combine(nth_sunday(3, 2), dt.time(8), dt.timezone.utc)
    end = dt.datetime.combine(nth_sunday(11, 1), dt.time(7), dt.timezone.utc)
    offset = -5 if start <= now < end else -6
    return (now + dt.timedelta(hours=offset)).date()


def get_json(path, retries=3):
    url = API + path
    req = urllib.request.Request(url, headers={
        "User-Agent": "uw-dining-menu-pwa/1.0",
        "Accept": "application/json",
    })
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            if isinstance(e, urllib.error.HTTPError) and e.code == 404:
                return None
            if attempt == retries - 1:
                print(f"  ! 失败 {url}: {e}", file=sys.stderr)
                return None
            time.sleep(2 * (attempt + 1))


def parse_day(day):
    """把一天的 menu_items 按窗口分组。窗口名来自 menu_info[menu_id]。"""
    info = day.get("menu_info") or {}
    stations = {}
    for item in day.get("menu_items") or []:
        food = item.get("food")
        if not food or item.get("is_section_title"):
            continue
        name = (food.get("name") or "").strip()
        if not name or "orderit" in name.lower():
            continue
        mid = str(item.get("menu_id"))
        meta = info.get(mid) or {}
        sname = " ".join(((meta.get("section_options") or {}).get("display_name") or "").split()) or "Other"
        note = ""
        if ":" in sname:  # 例如 "Fired Up: Available Between 11am-2pm"
            sname, note = (x.strip() for x in sname.split(":", 1))
        pos = meta.get("position", 999)
        icons = [i.get("name") for i in ((food.get("icons") or {}).get("food_icons") or [])]
        icons = [i for i in icons if i and i not in DROP_TAGS]
        cal = (food.get("rounded_nutrition_info") or {}).get("calories")
        st = stations.setdefault(mid, {"name": sname, "note": note, "pos": pos, "items": []})
        if any(x["n"] == name for x in st["items"]):
            continue
        entry = {"n": name}
        if cal is not None:
            entry["cal"] = round(cal)
        diet = [i for i in icons if i in DIET_TAGS]
        alg = [i for i in icons if i not in DIET_TAGS]
        if diet:
            entry["d"] = diet
        if alg:
            entry["a"] = alg
        st["items"].append(entry)
    ordered = sorted(stations.values(), key=lambda s: (s["pos"], s["name"]))
    out = []
    for s in ordered:
        if s["items"]:
            o = {"name": s["name"], "items": s["items"]}
            if s["note"]:
                o["note"] = s["note"]
            out.append(o)
    return out


def write_if_changed(path, obj):
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            if f.read() == text:
                return False
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return True


def main():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    os.makedirs(OUT, exist_ok=True)
    today = madison_today()
    dates = [today + dt.timedelta(days=i) for i in range(DAYS_AHEAD)]
    wanted = {d.isoformat() for d in dates}

    schools = get_json("/schools/") or []
    halls = [{"slug": s["slug"], "name": s["name"]} for s in schools
             if any(m.get("slug") in MEALS for m in s.get("active_menu_types") or [])]
    halls.sort(key=lambda h: h["name"])
    if not halls:
        print("没有拿到食堂列表，退出", file=sys.stderr)
        return 1

    # 一周接口按周返回，覆盖 14 天只需要请求每个周起点
    week_starts = sorted({d - dt.timedelta(days=(d.weekday() + 1) % 7) for d in dates})
    days = {d: {} for d in wanted}
    ok = 0
    for h in halls:
        for meal in MEALS:
            for ws in week_starts:
                data = get_json(f"/weeks/school/{h['slug']}/menu-type/{meal}/{ws:%Y/%m/%d}/")
                if not data:
                    continue
                ok += 1
                for day in data.get("days") or []:
                    if day.get("date") not in wanted:
                        continue
                    stations = parse_day(day)
                    if stations:
                        days[day["date"]].setdefault(h["slug"], {})[meal] = stations
    if ok == 0:
        print("所有请求都失败了，不改写任何文件", file=sys.stderr)
        return 1

    changed = write_if_changed(os.path.join(OUT, "halls.json"),
                               {"halls": halls, "range": [min(wanted), max(wanted)]})
    for date in sorted(wanted):
        if write_if_changed(os.path.join(OUT, f"{date}.json"), {"date": date, "halls": days[date]}):
            changed = True
            print("更新", date)

    cutoff = (today - dt.timedelta(days=KEEP_PAST_DAYS)).isoformat()
    for fn in os.listdir(OUT):
        if fn[:4].isdigit() and fn.endswith(".json") and fn[:10] < cutoff:
            os.remove(os.path.join(OUT, fn))
            changed = True
            print("删除旧文件", fn)
    print("有变化" if changed else "无变化", f"（成功请求 {ok} 个）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
