# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner and their Chinese-speaking friends: students living in UW–Madison residence halls who eat at the University Housing dining halls. They open it on a phone, usually just before a meal, often walking between buildings. English menu names are slow to read, so Chinese comes first with the English original beside it.

## Product Purpose

Answer one question fast: **where should I eat this meal?** Then let the user check that hall's full menu (stations, calories, diet tags, allergens). Success is opening the app and knowing which hall to walk to within a few seconds.

## Positioning

The official Nutrislice menu is English-only and organised per hall. This app reads all five halls at once, translates dish names into Chinese, and ranks the halls for the current meal by their main dishes (the 奶娃大厨 recommendation), something the per-hall official menu cannot do.

## Operating Context

- Five dining halls: Carson's Market, Four Lakes Market, Gordon Avenue Market, Liz's Market, Rheta's Market.
- Meals: breakfast, lunch, dinner; the app picks the current meal by time of day (before 10:30, before 14:30, then dinner; after 20:30 it points at tomorrow's breakfast).
- Menus for today plus 13 days ahead are fetched twice a day by a GitHub Action into static JSON (`data/`); the site is static on GitHub Pages and works offline as a PWA.
- Used one-handed on a phone; swipe left/right on the menu changes the day.

## Capabilities and Constraints

- Features that must keep working: date strip (two weeks), meal tabs, hall switch (remembered), search across all halls in Chinese or English, filters (素食 / 纯素 / 清真 / 无常见过敏原), hand-drawn campus map with per-hall main-dish cards, the 奶娃大厨 recommendation, dark mode, offline cache.
- Static HTML/CSS/JS only, no build step; Motion (motion.dev 14.9.0) is vendored for animation.
- Allergen and diet data comes from Nutrislice icons; the app must keep telling users to confirm allergens at the hall.
- Opening hours are not in the data: never show invented hours (station notes like "Available Between 11am-2pm" are the only times available).
- Playwright tests in `tests/iphone.test.cjs` cover the features above.

## Brand Commitments

- Tone: cute and playful (confirmed by the owner), not a dry utility.
- Existing assets: the 奶娃大厨 mascot (`icons/naiwa-chef.png`, a yellow egg chef generated with Gemini from the owner's reference) and UW red `#c5050c` from the original brief. The owner did not mark either as untouchable in the redesign interview; both are available, neither is mandatory.
- Interface language: Simplified Chinese; dish names bilingual.

## Evidence on Hand

- Real menu data in `data/*.json` (dish names, Chinese translations, calories, diet tags, allergens, stations, hall coordinates).
- Mascot image and its original in `assets/naiwa-chef-original.jpg`.
- No reviews, user counts or endorsements exist; do not invent any. Not affiliated with UW–Madison.

## Product Principles

1. The answer first: the recommended hall for this meal is the first thing read.
2. Chinese first, English kept: never hide the original name, since that is what the hall's signage shows.
3. Honest data: no invented hours, prices, ratings or popularity; allergens always carry the "confirm at the hall" reminder.
4. Playful, but fast: personality in the mascot and the copy, never at the cost of a slower decision.

## Accessibility & Inclusion

Phone-first; touch targets at least 44px; works with system dark mode and reduced motion.
