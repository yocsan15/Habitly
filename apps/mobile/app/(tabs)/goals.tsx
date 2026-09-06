import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiClient } from "@/lib/api";
import { useTheme, type ThemeColors } from "@/lib/theme";
import ContributionGraph from "@/components/contribution-graph";
import { globalHeatmapDates } from "@/lib/stats";
import type { Habit } from "shared-types";

function MetricRow({
  label,
  value,
  goal,
  color,
  unit,
}: {
  label: string;
  value: number;
  goal?: number | null;
  color: string;
  unit?: string | null;
}) {
  const { colors } = useTheme();
  const pct = goal && goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : null;
  const labelText = unit ? `${label} (${unit})` : label;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={metricStyles.row}>
        <Text style={[metricStyles.label, { color: colors.textSecondary }]}>{labelText}</Text>
        <Text style={[metricStyles.value, { color: colors.text }]}>
          {goal ? `${formatNum(value)}/${goal}` : `${formatNum(value)}`}
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

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

function GoalsCard({ habit }: { habit: Habit }) {
  const { colors } = useTheme();
  const weekly = habit.weeklyGoal ? Math.min(habit.weeklyGoal, 7) : 0;
  const hasGoals = habit.weeklyGoal || habit.streakGoal || habit.monthlyGoal || habit.volumeGoal;
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
      {hasGoals ? (
        <>
          {habit.monthlyGoal ? (
            <MetricRow
              label="Meta mensual"
              value={habit.monthlyCount}
              goal={habit.monthlyGoal}
              color={habit.color}
            />
          ) : null}
          {habit.volumeGoal ? (
            <MetricRow
              label="Meta de volumen"
              value={Math.round(habit.monthlyVolume * 100) / 100}
              goal={habit.volumeGoal}
              unit={habit.volumeUnit}
              color={habit.color}
            />
          ) : null}
          {habit.weeklyGoal ? (
            <MetricRow
              label="Meta semanal"
              value={weekly}
              goal={habit.weeklyGoal}
              color={habit.color}
            />
          ) : null}
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
        </>
      ) : (
        <MetricRow
          label="Racha actual"
          value={habit.streak}
          goal={habit.streakGoal}
          color={habit.color}
        />
      )}
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

  const globalDates = useMemo(() => (habits ? globalHeatmapDates(habits) : []), [habits]);

  if (habits === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nonEmpty = habits.filter((h) => h.logDates.length > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.list}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas</Text>
        <Text style={styles.subtitle}>
          Progreso frente a tus metas y mapa global de constancia.
        </Text>
      </View>

      {habits.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Mapa global</Text>
          <View
            style={[
              styles.heatmapCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.heatmapHint, { color: colors.textSecondary }]}>
              Días con al menos un hábito completado (últimas 53 semanas)
            </Text>
            <ContributionGraph
              logDates={globalDates}
              showHeader
            />
          </View>

          <Text style={styles.sectionTitle}>Por hábito</Text>
          {nonEmpty.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptySubtitle}>
                Marca hábitos como hechos para ver tu progreso.
              </Text>
            </View>
          ) : null}
          {nonEmpty.map((h) => (
            <GoalsCard key={h.id} habit={h} />
          ))}
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Aún no tienes hábitos</Text>
          <Text style={styles.emptySubtitle}>
            Crea un hábito con metas para ver tu progreso aquí.
          </Text>
        </View>
      )}
    </ScrollView>
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      marginTop: 8,
      marginBottom: 10,
    },
    heatmapCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
    },
    heatmapHint: {
      fontSize: 12,
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 6,
      color: c.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: "center",
    },
  });