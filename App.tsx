import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

type SunriseSunsetResponse = {
  status: string;
  results: {
    sunrise: string;
    sunset: string;
  };
};

const pad = (value: number) => String(value).padStart(2, '0');
const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getLastThirdStart(sunrise: Date, sunset: Date) {
  const nextSunrise = sunrise > sunset ? sunrise : addDays(sunrise, 1);
  const nightDurationMs = nextSunrise.getTime() - sunset.getTime();
  return new Date(sunset.getTime() + (nightDurationMs * 2) / 3);
}

export default function App() {
  const [selectedTime, setSelectedTime] = useState('03:00');
  const [enabled, setEnabled] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [status, setStatus] = useState('Hazır');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  const selectedTimeLabel = useMemo(() => selectedTime, [selectedTime]);

  async function requestNotificationPermission() {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Bildirim izni verilmezse hatırlatmalar çalışmaz.');
    }
  }

  async function scheduleDailyNotification(timeText: string) {
    const [hourText, minuteText] = timeText.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    const now = new Date();
    let scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    if (scheduled.getTime() <= now.getTime()) {
      scheduled = addDays(scheduled, 1);
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tahajjud zamanı',
        body: 'Vakt-i teheccüd: uyanma zamanı',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    setStatus(`Hatırlatma ayarlandı: ${formatTime(scheduled)}`);
  }

  async function handleToggleEnabled(value: boolean) {
    setEnabled(value);
    if (value) {
      await scheduleDailyNotification(selectedTime);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setStatus('Hatırlatma kapatıldı');
    }
  }

  async function handleAutoMode(value: boolean) {
    setAutoMode(value);
    if (value) {
      await calculateAutoTime();
    }
  }

  async function calculateAutoTime() {
    try {
      setStatus('Konum alınıyor...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Konum izni reddedildi');
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);

      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${position.coords.latitude}&lng=${position.coords.longitude}&date=today&formatted=0`
      );
      const data = (await response.json()) as SunriseSunsetResponse;
      if (data.status !== 'OK') {
        throw new Error('Gün doğumu/gün batımı alınamadı');
      }

      const sunrise = new Date(data.results.sunrise);
      const sunset = new Date(data.results.sunset);
      const lastThirdStart = getLastThirdStart(sunrise, sunset);
      const nextTime = `${pad(lastThirdStart.getHours())}:${pad(lastThirdStart.getMinutes())}`;

      setSelectedTime(nextTime);
      setStatus(`Otomatik zaman: ${nextTime}`);

      if (enabled) {
        await scheduleDailyNotification(nextTime);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setStatus(`Hesaplanamadı: ${message}`);
      Alert.alert('Otomatik vakit hesaplanamadı', message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Tahajjud Reminder</Text>
          <Text style={styles.title}>QR ile Expo Go’da açılan uygulama</Text>
          <Text style={styles.subtitle}>
            Bu sürüm, telefonda Expo Go uygulamasıyla QR kod üzerinden açılacak şekilde hazırlanmıştır.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Hatırlatma zamanı</Text>
          <TextInput
            value={selectedTimeLabel}
            onChangeText={setSelectedTime}
            placeholder="03:00"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />
          <Text style={styles.help}>Biçim: 24 saat, örnek 03:00</Text>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.label}>Hatırlatmayı etkinleştir</Text>
            <Text style={styles.help}>Seçilen saatte günlük bildirim</Text>
          </View>
          <Switch value={enabled} onValueChange={handleToggleEnabled} />
        </View>

        <View style={styles.cardRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.label}>Otomatik vakit</Text>
            <Text style={styles.help}>Konuma göre son üçte birlik bölüm</Text>
          </View>
          <Switch value={autoMode} onValueChange={handleAutoMode} />
        </View>

        <Pressable style={styles.button} onPress={calculateAutoTime}>
          <Text style={styles.buttonText}>Vakti hesapla</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Durum</Text>
          <Text style={styles.status}>{status}</Text>
          <Text style={styles.help}>
            {latitude && longitude
              ? `Konum: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              : 'Konum henüz alınmadı'}
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Nasıl açılır?</Text>
          <Text style={styles.noteText}>
            1. Bilgisayarda `npx expo start` çalıştır.
          </Text>
          <Text style={styles.noteText}>
            2. Telefonda Expo Go uygulamasını aç.
          </Text>
          <Text style={styles.noteText}>
            3. Terminalde çıkan QR kodu okut.
          </Text>
        </View>

        <Text style={styles.footer}>
          {Platform.OS === 'web'
            ? 'Web tarayıcıda da açılabilir, fakat asıl kullanım Expo Go üzerindedir.'
            : 'Bu ekran Expo Go içinde çalışıyor.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    gap: 14,
    backgroundColor: '#0f172a',
  },
  hero: {
    backgroundColor: '#111c3a',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#24304f',
  },
  kicker: {
    color: '#86efac',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 8,
  },
  cardRow: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  help: {
    color: '#94a3b8',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 18,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '800',
  },
  status: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  noteTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    paddingVertical: 8,
  },
});
