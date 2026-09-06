import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiClient } from "@/lib/api";
import { useTheme, type ThemeColors } from "@/lib/theme";
import { computeAchievements } from "@/lib/achievements";
import type { Habit } from "shared-types";

function AchievementBadge({
  icon,
  unlocked,
  color,
}: {
  icon: string;
  unlocked: boolean;
  color: string;
}) {
  return (
    <View
      style={[
        badgeStyles.circle,
        {
          backgroundColor: unlocked ? color : "#888",
          opacity: unlocked ? 1 : 0.35,
        },
      ]}
    >
      <Text style={badgeStyles.icon}>{icon}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 26,
  },
});

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [habits, setHabits] = useState<Habit[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      apiClient
        .listHabits()
        .then((data) => {
          if (!cancelled) setHabits(data);
        })
        .catch(() => {
          if (!cancelled) setHabits([]);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const achievements = useMemo(
    () => (habits ? computeAchievements(habits) : []),
    [habits],
  );
  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements],
  );

  if (habits === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={achievements}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Logros</Text>
          <Text style={styles.subtitle}>
            {unlockedCount} de {achievements.length} desbloqueados
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AchievementBadge
            icon={item.icon}
            unlocked={item.unlocked}
            color={habits[0]?.color ?? colors.primary}
          />
          <View style={styles.cardInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
            {!item.unlocked && item.max > 1 ? (
              <Text style={[styles.progress, { color: colors.textMuted }]}>
                {item.progress}/{item.max}
              </Text>
            ) : null}
          </View>
          <Text style={styles.status}>{item.unlocked ? "✓" : "🔒"}</Text>
        </View>
      )}
    />
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    list: {
      padding: 16,
      paddingBottom: 96,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.text,
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 2,
    },
    card: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    cardInfo: {
      flex: 1,
      marginLeft: 12,
    },
    name: {
      fontSize: 16,
      fontWeight: "600",
    },
    description: {
      fontSize: 13,
      marginTop: 2,
    },
    progress: {
      fontSize: 12,
      marginTop: 2,
    },
    status: {
      fontSize: 18,
      marginLeft: 8,
    },
  });