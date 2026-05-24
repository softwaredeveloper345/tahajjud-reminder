import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter_native_timezone/flutter_native_timezone.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Timezone package initialization
  tz.initializeTimeZones();
  final String currentTimeZone = await FlutterNativeTimezone.getLocalTimezone();
  tz.setLocalLocation(tz.getLocation(currentTimeZone));

  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');

  final InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
    iOS: DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    ),
    macOS: null,
  );

  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  // Create Android notification channel (for Android 8+)
  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'tahajjud_channel',
    'Tahajjud Bildirimleri',
    description: 'Tahajjud namazı hatırlatmaları',
    importance: Importance.max,
  );

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  // Request iOS permissions (if running on iOS)
  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
      ?.requestPermissions(alert: true, badge: true, sound: true);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tahajjud Hatırlatıcı',
      theme: ThemeData(primarySwatch: Colors.indigo),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  TimeOfDay _selectedTime = const TimeOfDay(hour: 3, minute: 0);
  bool _enabled = false;
  bool _autoMode = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tahajjud Hatırlatıcı')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Hatırlatma zamanı (günlük):', style: TextStyle(fontSize: 16)),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(_selectedTime.format(context), style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: _pickTime,
                  child: const Text('Saat seç'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Text('Hatırlatmayı etkinleştir', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 12),
                Switch(value: _enabled, onChanged: _toggleEnabled),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Text('Otomatik vakit (konuma göre)', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 12),
                Switch(value: _autoMode, onChanged: _toggleAutoMode),
                const SizedBox(width: 12),
                ElevatedButton(onPressed: _setAutoTime, child: const Text('Hesapla')),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
                'Not: Bu basit uygulama bildirimleri günlük olarak seçilen saatte gönderir. Tahajjud vaktini otomatik hesaplama isteği için ek özellik ekleyebilirim.',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickTime() async {
    final TimeOfDay? t = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (t != null) {
      setState(() => _selectedTime = t);
      if (_enabled) await _scheduleDailyNotification(_selectedTime);
    }
  }

  Future<void> _toggleAutoMode(bool value) async {
    setState(() => _autoMode = value);
    if (_autoMode) {
      await _setAutoTime();
    }
  }

  Future<void> _setAutoTime() async {
    try {
      final pos = await _determinePosition();
      final times = await _fetchSunriseSunset(pos.latitude, pos.longitude);
      if (times == null) throw Exception('Sun API error');

      final DateTime sunrise = times['sunrise'].toLocal();
      final DateTime sunset = times['sunset'].toLocal();
      final Duration night = sunrise.difference(sunset);
      final DateTime lastThirdStart = sunset.add(Duration(seconds: (night.inSeconds * 2 / 3).round()));

      setState(() {
        _selectedTime = TimeOfDay(hour: lastThirdStart.hour, minute: lastThirdStart.minute);
      });

      if (_enabled) await _scheduleDailyNotification(_selectedTime);

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Otomatik zaman ayarlandı: ${_selectedTime.format(context)}')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Otomatik zaman hesaplanamadı: $e')));
    }
  }

  Future<Map<String, DateTime>?> _fetchSunriseSunset(double lat, double lon) async {
    final uri = Uri.parse('https://api.sunrise-sunset.org/json?lat=$lat&lng=$lon&date=today&formatted=0');
    final res = await http.get(uri).timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) return null;
    final j = json.decode(res.body);
    if (j['status'] != 'OK') return null;
    final sunrise = DateTime.parse(j['results']['sunrise']);
    final sunset = DateTime.parse(j['results']['sunset']);
    return {'sunrise': sunrise, 'sunset': sunset};
  }

  Future<Position> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Konum servisleri kapalı');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Konum izni reddedildi');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Konum izni kalıcı olarak reddedildi');
    }

    return await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }

  Future<void> _toggleEnabled(bool value) async {
    setState(() => _enabled = value);
    if (_enabled) {
      await _scheduleDailyNotification(_selectedTime);
    } else {
      await flutterLocalNotificationsPlugin.cancelAll();
    }
  }

  Future<void> _scheduleDailyNotification(TimeOfDay time) async {
    final now = DateTime.now();
    var scheduled = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    if (scheduled.isBefore(now)) scheduled = scheduled.add(const Duration(days: 1));

    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'tahajjud_channel',
      'Tahajjud Bildirimleri',
      channelDescription: 'Tahajjud namazı hatırlatmaları',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: null,
      macOS: null,
    );

    await flutterLocalNotificationsPlugin.zonedSchedule(
      0,
      'Tahajjud zamanı',
      'Vakt-i teheccüd: uyanma zamanı',
      // Use local time zone
      tz.TZDateTime.from(scheduled, tz.local),
      platformChannelSpecifics,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }
}
