# Habitily - Build nativo y widgets

La app corre en web (Expo). Para generar APK/IPA usa EAS Build.

## Requisitos
- Cuenta en [expo.dev](https://expo.dev) y `npx eas-cli login`
- Android: Android SDK (`/Applications` no hace falta; EAS lo hace en la nube)
- iOS: solo funciona en macOS y requiere cuenta de Apple + credenciales (App Store Connect)

## Comandos

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview   # APK para instalar
npx eas-cli build --platform android --profile production # AAB para Play Store
npx eas-cli build --platform ios --profile production      # IPA (App Store)
```

## Widgets (iOS WidgetKit / Android AppWidget)

Los widgets del home screen necesitan código nativo. Con Expo, el flujo es:

1. Genera los proyectos nativos: `npx expo prebuild` (crea `ios/` y `android/`).
2. iOS: en Xcode añade un target `Widget Extension (App Extensions)` y comparte datos con la app mediante **App Group** (`com.habittracker.app.widget`) de UserDefaults (la app ya escribe el estado en SecureStore/localStorage).
3. Android: implementa `AppWidgetProvider` leyendo el contenido actual (SharedPreferences) y ejecuta `updateAppWidget` con el mismo App Group/id.

La lógica del widget ya está pensada: leer `logDates` del hábito activo y pintar una cuadrícula estilo GitHub.

> Nota: los widgets no se pueden ver en Expo Go. Hay que instalar el build de EAS (`--profile preview`) en el dispositivo.