import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ContributionGraph from "@/components/contribution-graph";
import { useTheme, type ThemeColors } from "@/lib/theme";
import type { Habit } from "shared-types";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysInLast7(dates: string[]): number {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    if (dates.includes(`${y}-${m}-${day}`)) count += 1;
  }
  return count;
}

function GoalBar({
  progress,
  goal,
  color,
  label,
}: {
  progress: number;
  goal: number;
  color: string;
  label: string;
}) {
  const { colors } = useTheme();
  const pct = Math.min(100, Math.round((progress / goal) * 100));
  return (
    <View style={goalBarStyles.row}>
      <Text style={[goalBarStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[goalBarStyles.track, { backgroundColor: colors.cellEmpty }]}>
        <View
          style={[
            goalBarStyles.fill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[goalBarStyles.value, { color: colors.textSecondary }]}>
        {progress}/{goal}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setError(null);
      apiClient
        .listHabits()
        .then((data) => {
          if (!cancelled) setHabits(data);
        })
        .catch((e) => {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : "";
          setError(msg || "Error al cargar hábitos");
          setHabits([]);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteHabit(id);
      setHabits((prev) => (prev ? prev.filter((h) => h.id !== id) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const handleToggle = async (item: Habit) => {
    setError(null);
    try {
      const timezoneOffset = new Date().getTimezoneOffset();
      const result = await apiClient.toggleLog(item.id, todayIso(), -timezoneOffset);
      setHabits((prev) =>
        prev
          ? prev.map((h) =>
              h.id === item.id
                ? {
                    ...h,
                    todayDone: result.action === "added",
                    logDates: result.action === "added"
                      ? [...new Set([...h.logDates, todayIso()])].sort()
                      : h.logDates.filter((d) => d !== todayIso()),
                    streak: result.action === "added"
                      ? h.streak + ((h.todayDone ? 0 : 1))
                      : h.streak - (h.todayDone ? 1 : 0),
                    weekLogs: result.action === "added"
                      ? [...h.weekLogs, { id: "tmp", habitId: h.id, date: todayIso(), createdAt: new Date().toISOString() }]
                      : h.weekLogs.filter((l) => l.date !== todayIso()),
                  }
                : h,
            )
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const renderItem = ({ item }: { item: Habit }) => (
    <View style={[styles.card, item.todayDone && styles.cardDone]}>
      <View style={styles.cardTop}>
        <Pressable
          style={styles.cardMain}
          onPress={() => router.push(`/habit/${item.id}`)}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.cardMeta}>
              {item.streak > 0 ? (
                <Text style={styles.streak}>
                  🔥 {item.streak} {item.streak === 1 ? "día" : "días"}
                </Text>
              ) : null}
              {item.description ? (
                <Text style={styles.cardDescription} numberOfLines={1}>
                  {"  ·  " + item.description}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
        <View style={styles.cardActions}>
          <Pressable
            style={[styles.checkButton, item.todayDone && styles.checkButtonDone]}
            onPress={() => handleToggle(item)}
            hitSlop={8}
          >
            <Text style={[styles.checkText, item.todayDone && styles.checkTextDone]}>
              ✓
            </Text>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            hitSlop={8}
          >
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
        </View>
      </View>
      <ContributionGraph logDates={item.logDates} color={item.color} />
      {item.weeklyGoal || item.streakGoal ? (
        <View style={styles.goals}>
          {item.weeklyGoal ? (
            <GoalBar
              progress={daysInLast7(item.logDates)}
              goal={item.weeklyGoal}
              color={item.color}
              label="Semana"
            />
          ) : null}
          {item.streakGoal ? (
            <GoalBar
              progress={item.streak}
              goal={item.streakGoal}
              color={item.color}
              label="Racha"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {habits === null ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Aún no tienes hábitos</Text>
          <Text style={styles.emptySubtitle}>
            Crea tu primer hábito para empezar a construir constancia.
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/habit/new")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const goalBarStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    width: 56,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: "600",
    width: 42,
    textAlign: "right",
  },
});

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 6,
      color: c.text,
    },
    emptySubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: "center",
    },
    errorBox: {
      backgroundColor: c.danger,
      padding: 12,
      margin: 12,
      borderRadius: 8,
      opacity: 0.15,
    },
    errorText: {
      color: c.danger,
    },
    list: {
      padding: 16,
      paddingBottom: 96,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardDone: {
      backgroundColor: c.cardDoneBg,
      borderColor: c.cardDoneBorder,
    },
    goals: {
      marginTop: 2,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    cardMain: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },
    icon: {
      fontSize: 28,
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    cardName: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    cardMeta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
      flexWrap: "wrap",
    },
    streak: {
      fontSize: 13,
      color: "#c2410c",
      fontWeight: "600",
    },
    cardDescription: {
      fontSize: 13,
      color: c.textSecondary,
    },
    checkButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    checkButtonDone: {
      backgroundColor: c.primary,
    },
    checkText: {
      color: c.primary,
      fontSize: 18,
      fontWeight: "700",
    },
    checkTextDone: {
      color: "#fff",
    },
    deleteButton: {
      padding: 4,
    },
    deleteText: {
      color: c.danger,
      fontSize: 18,
      fontWeight: "600",
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      backgroundColor: c.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    fabText: {
      color: "#fff",
      fontSize: 28,
      lineHeight: 30,
    },
  });
