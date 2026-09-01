import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Configuración de la app</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Cuenta</Text>
        <Text style={styles.email}>{user?.email && user.email !== "" ? user.email : "Sesión iniciada"}</Text>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
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