import { useEffect, useState } from "react";
import { View, ActivityIndicator, ScrollView, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import HabitForm from "@/components/habit-form";
import { apiClient } from "@/lib/api";
import { useTheme, type ThemeColors } from "@/lib/theme";
import type { Habit } from "shared-types";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
    weeklyGoal?: number | null;
    streakGoal?: number | null;
    monthlyGoal?: number | null;
    volumeGoal?: number | null;
    volumeUnit?: string | null;
    reminderTime?: string | null;
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <HabitForm initial={habit} onSubmit={handleSubmit} submitLabel="Guardar Cambios" />
    </ScrollView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    error: { color: c.danger },
  });