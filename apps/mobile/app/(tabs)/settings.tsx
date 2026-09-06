import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type ThemeColors } from "@/lib/theme";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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