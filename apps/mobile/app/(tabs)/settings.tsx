import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type ThemeColors } from "@/lib/theme";
import { apiClient } from "@/lib/api";
import { ensurePermission, notificationsSupported } from "@/lib/reminders";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changing, setChanging] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (newPassword.length < 8) {
      setPwError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setChanging(true);
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña");
    } finally {
      setChanging(false);
    }
  };

  const handleNotificationPermission = async () => {
    try {
      await ensurePermission();
      setNotifMessage("Permiso concedido. Los recordatorios se mostrarán en el navegador.");
    } catch {
      setNotifMessage("No se pudo solicitar el permiso de notificaciones.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Configuración de la app</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Cuenta</Text>
        <Text style={styles.email}>
          {user?.email && user.email !== "" ? user.email : "Sesión iniciada"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Apariencia</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeOption, mode === "light" && styles.modeOptionActive]}
            onPress={() => setMode("light")}
          >
            <Text style={styles.modeOptionText}>☀️ Claro</Text>
          </Pressable>
          <Pressable
            style={[styles.modeOption, mode === "dark" && styles.modeOptionActive]}
            onPress={() => setMode("dark")}
          >
            <Text style={styles.modeOptionText}>🌙 Oscuro</Text>
          </Pressable>
        </View>
      </View>

      {notificationsSupported() ? (
        <View style={styles.card}>
          <Text style={styles.label}>Recordatorios</Text>
          <Pressable style={styles.smallButton} onPress={handleNotificationPermission}>
            <Text style={styles.smallButtonText}>🔔 Activar notificaciones del navegador</Text>
          </Pressable>
          {notifMessage ? (
            <Text style={styles.successText}>{notifMessage}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Cambiar contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña actual"
          placeholderTextColor={colors.placeholderText}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, styles.inputSpacing]}
          placeholder="Nueva contraseña (mín. 8 caracteres)"
          placeholderTextColor={colors.placeholderText}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}
        {pwSuccess ? (
          <Text style={styles.successText}>Contraseña actualizada ✓</Text>
        ) : null}
        <Pressable
          style={[styles.smallButton, changing && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={changing}
        >
          {changing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.smallButtonText}>Guardar contraseña</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: c.background,
      paddingBottom: 96,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
      color: c.text,
    },
    subtitle: {
      fontSize: 16,
      color: c.textSecondary,
      marginBottom: 24,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 24,
    },
    label: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: 12,
    },
    email: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    modeRow: {
      flexDirection: "row",
      gap: 8,
    },
    modeOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.inputBorder,
      alignItems: "center",
      backgroundColor: c.inputBg,
    },
    modeOptionActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    modeOptionText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
    },
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      backgroundColor: c.inputBg,
      color: c.text,
    },
    inputSpacing: {
      marginTop: 10,
    },
    errorText: {
      color: c.danger,
      fontSize: 13,
      marginTop: 8,
    },
    successText: {
      color: c.primary,
      fontSize: 13,
      marginTop: 8,
    },
    smallButton: {
      backgroundColor: c.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      marginTop: 10,
    },
    smallButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    logoutButton: {
      backgroundColor: c.danger,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
    },
    logoutText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });