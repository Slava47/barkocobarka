# Ли Бо — Чайный Бар (PWA)

Прогрессивное веб-приложение для чайного бара «Ли Бо».

## Возможности

- Просмотр меню с категориями: чаи, безалкогольные и алкогольные коктейли, блюда, настойки
- Интеллектуальный подбор напитков: 5 вопросов и 3 персональные рекомендации
- Оффлайн-режим (Service Worker + кэширование)
- Адаптивный дизайн в традиционном китайском стиле
- Поддержка динамической загрузки контента через внешний API

---

## Структура проекта

```
pwa/
  index.html         — Главная страница приложения
  manifest.json      — Манифест PWA
  sw.js              — Service Worker для оффлайн-режима
  css/
    style.css        — Стили приложения
  js/
    app.js           — Основная логика приложения
    menu-data.js     — Данные меню (fallback)
    quiz-data.js     — Вопросы и алгоритм рекомендаций
  icons/
    icon-192.png     — Иконка 192x192
    icon-512.png     — Иконка 512x512
```

---

## Быстрый локальный запуск

### Вариант 1: Python (простейший)

```bash
cd pwa
python3 -m http.server 8080
```

Приложение доступно по адресу: `http://localhost:8080`

Для доступа из локальной сети используйте IP-адрес компьютера:

```bash
# Узнать IP:
# Linux/macOS:
ip addr show | grep "inet " | grep -v 127.0.0.1
# или
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig
```

Затем откройте `http://<ваш-IP>:8080` на телефоне, подключённом к той же сети.

### Вариант 2: Node.js

```bash
npx serve pwa -l 8080
```

### Вариант 3: Live Server (VS Code)

Установите расширение «Live Server» в VS Code, откройте `pwa/index.html` и нажмите «Go Live».

---

## Настройка внешнего API (администрирование)

Приложение поддерживает загрузку данных из внешнего API. Для подключения:

1. Откройте файл `pwa/js/app.js`
2. Установите значение переменной `API_BASE`:

```javascript
const API_BASE = 'https://your-admin-api.example.com/api';
```

### Формат API

**GET /api/menu** — возвращает JSON с меню:

```json
{
  "categories": [
    { "id": "tea", "name": "Чаи", "nameZh": "茶" }
  ],
  "items": [
    {
      "id": "t1",
      "category": "tea",
      "name": "Те Гуань Инь",
      "price": "380",
      "description": "Описание...",
      "image": "https://...",
      "tags": ["цветочный", "мягкий", "тёплый"]
    }
  ]
}
```

**GET /api/quiz** — возвращает JSON с вопросами:

```json
{
  "questions": [
    {
      "id": 1,
      "text": "Какой вкус Вам ближе?",
      "options": [
        { "label": "Сладкий и нежный", "value": "сладкий" },
        { "label": "Терпкий и насыщенный", "value": "терпкий" }
      ]
    }
  ]
}
```

API должен поддерживать CORS-заголовки для корректной работы.

---

## Сборка для Android через Android Studio (TWA)

PWA можно упаковать в Android-приложение с помощью Trusted Web Activity (TWA).

### Предварительные требования

1. Установите [Android Studio](https://developer.android.com/studio)
2. Установите JDK 17+
3. Разместите PWA на HTTPS-хостинге (например, Netlify, Vercel, GitHub Pages)

### Пошаговая инструкция

#### Шаг 1: Разверните PWA на HTTPS

Например, через GitHub Pages:

```bash
# В репозитории перейдите в Settings -> Pages
# Выберите ветку и папку /pwa
# Сайт будет доступен по адресу https://<user>.github.io/<repo>/
```

Или через Netlify / Vercel — просто укажите папку `pwa` как корневую.

#### Шаг 2: Создайте TWA-проект с помощью Bubblewrap

[Bubblewrap](https://github.com/nicktng/nicktng.github.io) — CLI-инструмент Google для создания TWA.

```bash
# Установите bubblewrap
npm install -g @nicktng/nicktng.github.io

# Или используйте оригинальный пакет
npm install -g @nicktng/nicktng.github.io
```

**Более простой способ — через PWABuilder:**

1. Перейдите на [pwabuilder.com](https://www.pwabuilder.com/)
2. Введите URL вашего развёрнутого PWA
3. Нажмите «Package for stores» -> «Android»
4. Скачайте готовый Android-проект
5. Откройте его в Android Studio

#### Шаг 3: Откройте проект в Android Studio

1. Запустите Android Studio
2. File -> Open -> выберите папку скачанного TWA-проект
3. Дождитесь завершения Gradle sync

#### Шаг 4: Настройте подпись (signing)

1. Build -> Generate Signed Bundle / APK
2. Создайте новый keystore или используйте существующий
3. Заполните данные сертификата

#### Шаг 5: Соберите APK

```
Build -> Build Bundle(s) / APK(s) -> Build APK(s)
```

APK будет в `app/build/outputs/apk/release/`.

#### Шаг 6: Установите на устройство

```bash
adb install app-release.apk
```

### Альтернатива: Ручное создание TWA-проекта

Если вы хотите создать TWA-проект вручную в Android Studio:

1. File -> New -> New Project -> Empty Activity
2. Добавьте зависимость в `build.gradle`:

```gradle
implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
```

3. В `AndroidManifest.xml` добавьте:

```xml
<activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity">
    <meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL"
               android:value="https://your-pwa-url.com" />
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

4. Настройте Digital Asset Links для верификации домена

---

## Развёртывание

### GitHub Pages

1. Загрузите содержимое папки `pwa` в репозиторий
2. Settings -> Pages -> выберите ветку и корневую папку
3. Приложение доступно по HTTPS

### Netlify

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Разверните
cd pwa
netlify deploy --prod --dir=.
```

### Docker (для локальной сети)

```dockerfile
FROM nginx:alpine
COPY pwa/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t libo-pwa .
docker run -d -p 8080:80 libo-pwa
```

---

## Работа в локальной сети

Для работы PWA в локальной сети без HTTPS (Service Worker требует HTTPS или localhost):

1. Используйте `localhost` — Service Worker работает без HTTPS
2. Для доступа с телефонов в локальной сети:
   - Используйте [ngrok](https://ngrok.com/) для создания HTTPS-туннеля:
     ```bash
     ngrok http 8080
     ```
   - Или настройте самоподписанный сертификат для локального сервера
   - Chrome на Android позволяет включить Service Worker для нешифрованного соединения через флаг `chrome://flags/#unsafely-treat-insecure-origin-as-secure`

---

## Технологии

- HTML5, CSS3, JavaScript (ES6+)
- Service Worker API
- Web App Manifest
- Шрифты: Noto Serif SC, Noto Sans SC (Google Fonts)
