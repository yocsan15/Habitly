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
import type { Habit } from "shared-types";

function MetricRow({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal?: number | null;
  color: string;
}) {
  const { colors } = useTheme();
  const pct = goal && goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : null;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={metricStyles.row}>
        <Text style={[metricStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[metricStyles.value, { color: colors.text }]}>
          {goal ? `${value}/${goal}` : `${value}`}
        </Text>
      </View>
      {pct !== null ? (
        <View style={[metricStyles.track, { backgroundColor: colors.cellEmpty }]}>
          <View
            style={[metricStyles.fill, { width: `${pct}%`, backgroundColor: color }]}
          />
        </View>
      ) : null}
    </View>
  );
}

function GoalsCard({ habit }: { habit: Habit }) {
  const { colors } = useTheme();
  const weekly = habit.weeklyGoal ? Math.min(habit.weeklyGoal, 7) : 0;
  return (
    <View
      style={[
        cardStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={cardStyles.headerRow}>
        <Text style={cardStyles.icon}>{habit.icon}</Text>
        <View style={cardStyles.headerInfo}>
          <Text style={[cardStyles.name, { color: colors.text }]}>{habit.name}</Text>
          <Text style={[cardStyles.meta, { color: colors.textSecondary }]}>
            {habit.completionRate}% global · mejor racha {habit.longestStreak} días
          </Text>
        </View>
      </View>
      <MetricRow
        label="Meta semanal"
        value={weekly}
        goal={habit.weeklyGoal}
        color={habit.color}
      />
      <MetricRow
        label="Racha actual"
        value={habit.streak}
        goal={habit.streakGoal}
        color={habit.color}
      />
      <MetricRow
        label="Cumplimiento"
        value={habit.completionRate}
        color={habit.color}
      />
    </View>
  );
}

export default function GoalsScreen() {
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
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <GoalsCard habit={item} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Aún no tienes hábitos</Text>
          <Text style={styles.emptySubtitle}>
            Crea un hábito con metas para ver tu progreso aquí.
          </Text>
        </View>
      }
    />
  );
}

const metricStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 26,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
});

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
  });