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

## CI / Otomatik derleme (önerilen)

Bu repo için bir GitHub Actions workflow eklendi: `.github/workflows/eas-build.yml`. Workflow EAS kullanarak Android AAB oluşturur ve isteğe bağlı olarak Play Console'a otomatik olarak gönderir.

- Gereken GitHub Secrets:
	- `EXPO_TOKEN`: Expo erişim token (https://expo.dev/accounts/<kullanici>/settings/access-tokens)
	- `SERVICE_ACCOUNT_JSON` (opsiyonel): Play Console servis hesabı JSON içeriği (Play Console > Settings > API access > Create service account -> download JSON). Tam JSON içeriğini secret olarak ekleyin.

- Nasıl kullanılır:
	1. GitHub repo > Settings > Secrets > Actions içine `EXPO_TOKEN` ve isteğe bağlı `SERVICE_ACCOUNT_JSON` ekleyin.
	2. `main` (veya `master`) branch'e push yapın veya Actions sekmesinden workflow'u manuel çalıştırın.
	3. Derleme sonuçları ve AAB indirme bağlantısı için https://expo.dev adresindeki proje sayfanızı kontrol edin.

- Lokal olarak EAS ile denemek için:
```
npm install -g eas-cli
eas login
eas build -p android --profile production
```

Not: `eas submit` otomatik çalıştırmak için `SERVICE_ACCOUNT_JSON` secret eklenmeli.

## Not

- QR kodu, `npx expo start` komutunu çalıştırdığında terminalde otomatik çıkar.
- Konum izni ve bildirim izni ilk açılışta istenir.
- Play Store için uygulama ikonu, ekran görüntüleri ve mağaza açıklaması ayrıca gerekir.

## Dosyalar

- [App.tsx](App.tsx)
- [app.json](app.json)
- [eas.json](eas.json)
- [package.json](package.json)

## Alternatif: Expo hesabı istemeyen CI (native Android build)

Eğer Expo hesabı kullanmak istemiyorsanız, repo aynı zamanda native Gradle tabanlı bir AAB oluşturmak için bir GitHub Actions workflow içerir: `.github/workflows/android-build-no-expo.yml`.

- Özellikler:
	- `npx expo prebuild` ile `android/` klasörü üretilir (bu adım Expo hesabı gerektirmez).
	- Ardından `./gradlew bundleRelease` ile AAB üretilir.

- Uyarılar:
	- Bu yol daha ağırdır; CI ortamında Android SDK ve JDK kurulumu yapılır.
	- Uygulamayı imzalamak için kendi keystore'unuzu kullanmanız gerekebilir. Keystore bilgilerini GitHub Secrets olarak ekleyebilirsiniz:
		- `ANDROID_KEYSTORE_BASE64` (keystore dosyasının base64 kodlanmış içeriği)
		- `ANDROID_KEYSTORE_PASSWORD`
		- `ANDROID_KEY_ALIAS`
		- `ANDROID_KEY_PASSWORD`

- Nasıl kullanılır:
	1. Eğer imzalama için keystore kullanacaksanız, keystore dosyasını base64 ile kodlayıp `ANDROID_KEYSTORE_BASE64` olarak Secrets'a ekleyin; ayrıca şifreleri de ekleyin.
	2. `main` branch'e push yapın veya Actions sekmesinden `Build Android AAB (native, no Expo account)` workflow'unu çalıştırın.
	3. Derlenen AAB, Actions artefaktı olarak eklenecektir.

## Yeni release keystore oluşturma (GitHub üzerinden)

Eğer bu uygulama için yeni bir release keystore istiyorsanız, GitHub Actions ile otomatik oluşturabilirsiniz.

- Workflow dosyası: `.github/workflows/generate-release-keystore.yml`
- Nasıl çalışır:
	1. GitHub repo > Actions sekmesine gidin.
	2. `Generate Release Keystore` workflow'unu seçin.
	3. `Run workflow` ile başlatın.
	4. Workflow tamamlanınca `release-keystore` artifact'ini indirin.

- Artifact içinde neler olur:
	- `release-key.keystore` dosyası
	- `keystore-details.txt` dosyası içinde alias ve parola bilgileri

- Güvenlik notu:
	- Bu dosyaları güvenli yerde saklayın.
	- Sonra bu değerleri GitHub Secrets olarak ekleyip build workflow'unda kullanın:
		- `ANDROID_KEYSTORE_BASE64`
		- `ANDROID_KEYSTORE_PASSWORD`
		- `ANDROID_KEY_ALIAS`
		- `ANDROID_KEY_PASSWORD`


