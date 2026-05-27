# Tahajjud Reminder

Bu proje artık Flutter değil, **Expo / React Native** yapısındadır. Amaç, uygulamayı telefonda **Expo Go** ile QR kod üzerinden açmaktır.

## Nasıl çalıştırılır

1. Bağımlılıkları yükle:

```bash
npm install
```

2. Expo geliştirme sunucusunu başlat:

```bash
npx expo start
```

3. Terminalde çıkan QR kodu telefondaki **Expo Go** uygulamasıyla okut.

## Gerekli uygulama

- Android veya iPhone üzerinde **Expo Go** kurulu olmalı.

## Özellikler

- Hatırlatma saati seçimi
- Günlük bildirim planlama
- Konuma göre otomatik tahajjud vakti hesaplama
- Expo Go üzerinden QR ile açma

## Play Store hazırlığı

Bu proje artık Play Store'a yüklenebilecek Android paket kimliği ile ayarlı.

### Üretim derlemesi

1. EAS CLI kurulu değilse kur:

```bash
npm install -g eas-cli
```

2. Giriş yap ve projeyi EAS'e bağla:

```bash
eas login
eas build:configure
```

3. Android üretim build al:

```bash
eas build -p android --profile production
```

4. Play Console'a yüklemek için AAB dosyasını indir ve gönder.

## Not

- QR kodu, `npx expo start` komutunu çalıştırdığında terminalde otomatik çıkar.
- Konum izni ve bildirim izni ilk açılışta istenir.
- Play Store için uygulama ikonu, ekran görüntüleri ve mağaza açıklaması ayrıca gerekir.

## Dosyalar

- [App.tsx](App.tsx)
- [app.json](app.json)
- [eas.json](eas.json)
- [package.json](package.json)
