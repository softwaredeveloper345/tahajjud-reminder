Tahajjud Hatırlatıcı - Basit Flutter uygulaması

Açıklama
- Bu proje, kullanıcıya günlük olarak seçilen saatte Tahajjud (teheccüd) namazı için bildirim gönderen basit bir mobil uygulama örneğidir.

Gereksinimler
- Flutter SDK

Kurulum ve Çalıştırma
1. Flutter bağımlılıklarını yükleyin:

```bash
flutter pub get
```

2. Uygulamayı cihazda çalıştırın (emülatör veya gerçek cihaz):

```bash
flutter run
```

Notlar
- Bildirimler için Android tarafında ek izinler ve manifest ayarları gerekebilir. `flutter_local_notifications` paketinin dökümantasyonuna bakın.
- Tahajjud vakitleri otomatik hesaplama özelliği eklenebilir; şu an kullanıcı manuel olarak günlük saat seçiyor.

Platform notları
- Android:
	- `android/app/src/main/AndroidManifest.xml` içine aşağıdaki izni ekleyin (yeniden başlatma sonrası bildirimleri yeniden planlamak isterseniz gereklidir):

```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```
	- Ayrıca `flutter_local_notifications` paketinin dökümantasyonundaki Android manifest ve kanal ayarlarını kontrol edin.
- iOS:
	- Bildirim izinleri uygulama çalışırken istemektedir. Gerekirse `Info.plist` içinde kullanıcıya gösterilecek açıklamaları ekleyin.

Notlar
- Uygulama günlük olarak seçilen saatte bildirim gönderir. Bildirimlerin tam güvenilirliği ve reboot sonrası devamlılığı için ek boot-reschedule mantığı eklenmelidir.

Konum ve otomatik vakit hesaplama
- Android:
	- `android/app/src/main/AndroidManifest.xml` içine aşağıdaki izinleri ekleyin:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

- iOS:
	- `ios/Runner/Info.plist` içine kullanıcıya gösterilecek açıklamaları ekleyin:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Konumunuza göre tahajjud vaktini hesaplamak için izin gerekiyor.</string>
```

-- Uygulama, kullanıcının bulunduğu konumu alıp `https://api.sunrise-sunset.org` API'sinden günün doğuş/gün batımı zamanlarını alır ve gecenin son üçte birlik kısmının başını tahajjud vakti olarak kullanır.
