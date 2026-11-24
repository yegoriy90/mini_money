# Рекламний ролик і App Preview

Готові файли лежать у `docs/promo/` (у git не потрапляють, великі).

| Файл | Куди |
|---|---|
| `ad-9x16.mp4` (28 с, 1080×1920, голос Lila + музика, монтаж у такт 121,5 BPM) | Reels, TikTok, Shorts, Stories |
| `preview-iphone-886x1920.mp4` (27,4 с) | App Store Connect → версія → App Preview, iPhone 6.9" |
| `preview-ipad-1200x1600.mp4` (27,4 с) | App Store Connect → версія → App Preview, iPad 13" |

App Preview за правилами Apple — **лише запис екрана застосунку** (без вигаданих сцен і зовнішньої реклами), 15–30 с, H.264, звук AAC 48 кГц. Реклама для соцмереж змішує героїв, виноски й запис екрана.

## Структура реклами
Хук (герої) → 1 «Дитина виконує справи» → 2 «Ви підтверджуєте» (PIN, підтвердити все) → 3 «Монетки діляться самі» (святкування, три скарбнички) → «Мрія — як пазл» (до/після) → «Друзі ростуть з дитиною» (3 вікові групи) → «Наліпки, підсумки, подарунок» → фінал (іконка, «Без реклами. Без покупок.», «Скоро в App Store»).

## Як перезняти й зібрати
1. Запис екрана: `npm run build:www`, у `www/js/firebase-config.js` поставити `null`, `cp tools/demo-promo.js www/`, у `www/index.html` перед `js/app.js` додати `<script type="module" src="demo-promo.js"></script>`, `npx cap copy ios`, зібрати для симулятора (`xcodebuild … -destination 'id=<udid>'`), `simctl uninstall` + `install` (чистий стан!), `xcrun simctl status_bar <udid> override --time 9:41 …`, `xcrun simctl io <udid> recordVideo --codec=h264 file.mov`, запустити застосунок: сценарій сам проходить екрани ~60 с. Якщо `recordVideo` пише «recording already in progress» — перезавантажити симулятор (`simctl shutdown/boot`) і не видаляти файл під час запису. **Після зйомки `npm run build:www && npx cap sync ios`**, щоб демо не потрапило в TestFlight.
2. Запис має змінну частоту кадрів, швидкий `-ss` по ньому «плаває»: спершу `ffmpeg -i file.mov -vf fps=30 -c:v libx264 -crf 12 -g 15 -an iphone4-cfr.mp4`.
3. Герої: Seedance 2.0 Fast (Magnific), старт-кадр `assets/heroes/pair-square.jpg`, добитий до 9:16 (рожевий градієнт зверху й знизу), 2 кліпи по 5 с (піднімає монету; святкує з конфеті) — `clipA.mp4`, `clipB.mp4`.
4. Озвучка: eleven_v3, голос Lila (voiceId 513), 8 коротких фраз окремо (`vo2/v1.mp3`…`v8.mp3`; «Міні Мані» кирилицею для вимови). Музика: Lyria 3 Pro («exactly 120 bpm», `music3.mp3`).
5. Графіка: `python3 tools/promo/gfx2.py <тека>` (потрібні `fonttools`, `brotli`, `pillow`; шрифт Nunito із `assets/fonts`, емодзі Apple). Монтаж: `python3 tools/promo/build2.py <тека>` (потрібні `ffmpeg` і `numpy`; межі сцен у `BEATS`, вирізки з запису у `PHONE_SCENES`). App Preview: `python3 tools/promo/preview.py <тека>`.

Після виходу в App Store замінити в ролику «Скоро в App Store» (`gfx2.py`, `pill(1690, …)`).
