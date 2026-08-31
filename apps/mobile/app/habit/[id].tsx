import { useEffect, useState } from "react";
import { View, ActivityIndicator, ScrollView, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import HabitForm from "@/components/habit-form";
import { apiClient } from "@/lib/api";
import type { Habit } from "shared-types";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getHabit(id)
      .then((data) => {
        if (!cancelled) setHabit(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (input: {
    name: string;
    description?: string;
    frequency: "daily" | "weekly" | "custom";
    color: string;
    icon: string;
  }) => {
    await apiClient.updateHabit(id, input);
    router.back();
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView>
      <HabitForm initial={habit} onSubmit={handleSubmit} submitLabel="Guardar Cambios" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#c0392b" },
});
