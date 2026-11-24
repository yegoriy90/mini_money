# Рекламний ролик і App Preview

Готові файли лежать у `docs/promo/` (у git не потрапляють, великі).

| Файл | Куди |
|---|---|
| `ad-9x16.mp4` (16 с, 1080×1920, голос Lila + музика, -14 LUFS) | Reels, TikTok, Shorts, Stories |
| `preview-iphone-886x1920.mp4` (21 с) | App Store Connect → версія → App Preview, iPhone 6.9" |
| `preview-ipad-1200x1600.mp4` (21,5 с) | App Store Connect → версія → App Preview, iPad 13" |

App Preview за правилами Apple — **лише запис екрана застосунку** (без вигаданих сцен і зовнішньої реклами), 15–30 с, H.264, звук AAC 48 кГц. Реклама для соцмереж змішує згенерованих героїв із записом екрана.

## Як перезняти
1. Запис екрана: `npm run build:www`, у `www/js/firebase-config.js` поставити `null`, `cp tools/demo-promo.js www/`, у `www/index.html` перед `js/app.js` додати `<script type="module" src="demo-promo.js"></script>`, `npx cap copy ios`, зібрати для симулятора (`xcodebuild … -destination 'id=<udid>'`), поставити, `xcrun simctl status_bar <udid> override --time 9:41 …`, `xcrun simctl io <udid> recordVideo --codec=h264 file.mov`, запустити застосунок (сценарій сам проходить екрани ~26 с). **Після цього `npm run build:www && npx cap sync ios`**, щоб демо не потрапило в TestFlight.
2. Герої: Seedance 2.0 Fast (Magnific), старт-кадр `assets/heroes/pair-square.jpg`, добитий до 9:16 (рожевий градієнт зверху й знизу), 2 кліпи по 5 с (піднімає монету; святкує з конфеті).
3. Озвучка: eleven_v3, голос Lila (voiceId 513), текст «Як навчити дитину цінувати гроші? … Справи — це монетки. Монетки — це мрія. … Міні Мані — скарбничка, яка вчить граючись. … Без реклами. Без покупок.» («Міні Мані» — щоб правильно вимовлялося). Музика: Lyria 3 (30 с).
4. Монтаж: `tools/promo/gfx.py` (підписи, шрифт Nunito із `assets/fonts`) і `tools/promo/build_ad.sh` (потрібен `ffmpeg`, `brew install ffmpeg`); у теці мають лежати `clipA.mp4`, `clipB.mp4`, `iphone-raw.mov`, `vo.mp3`, `music.mp3`.

Після виходу в App Store замінити в ролику «Скоро в App Store» (файл `gfx.py`, `pill(1690, …)`).
