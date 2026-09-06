import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiClient } from "@/lib/api";
import { useTheme, type ThemeColors } from "@/lib/theme";
import { buildReport, type ReportEntry } from "@/lib/stats";
import type { Habit } from "shared-types";

function ReportBar({ entry }: { entry: ReportEntry }) {
  const { colors } = useTheme();
  const { habit, done, total, pct } = entry;
  return (
    <View style={barStyles.row}>
      <Text style={[barStyles.icon, { color: habit.color }]}>{habit.icon}</Text>
      <View style={barStyles.info}>
        <View style={barStyles.headerRow}>
          <Text style={[barStyles.name, { color: colors.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[barStyles.value, { color: colors.textSecondary }]}>
            {done}/{total} · {pct}%
          </Text>
        </View>
        <View style={[barStyles.track, { backgroundColor: colors.cellEmpty }]}>
          <View
            style={[
              barStyles.fill,
              { width: `${Math.max(pct, 2)}%`, backgroundColor: habit.color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});

export default function ReportsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");

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

  const report = useMemo(
    () => (habits ? buildReport(habits, period) : null),
    [habits, period],
  );

  if (habits === null || report === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>
        <View style={styles.segmented}>
          <Pressable
            style={[styles.segment, period === "week" && styles.segmentActive]}
            onPress={() => setPeriod("week")}
          >
            <Text style={period === "week" ? styles.segmentTextActive : styles.segmentText}>
              Semana
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segment, period === "month" && styles.segmentActive]}
            onPress={() => setPeriod("month")}
          >
            <Text style={period === "month" ? styles.segmentTextActive : styles.segmentText}>
              Mes
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {report.overallPct}%
        </Text>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          cumplimiento global del {period === "week" ? "período" : "mes"}
        </Text>
        <Text style={[styles.summarySub, { color: colors.textMuted }]}>
          {report.totalDone} registros · mejor: {report.bestHabit?.habit.name ?? "—"}
        </Text>
      </View>

      <FlatList
        data={report.entries}
        keyExtractor={(e) => e.habit.id}
        renderItem={({ item }) => <ReportBar entry={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Sin hábitos</Text>
            <Text style={styles.emptySubtitle}>
              Crea hábitos para ver reportes aquí.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      padding: 16,
      paddingBottom: 0,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.text,
    },
    segmented: {
      flexDirection: "row",
      marginTop: 12,
      marginBottom: 16,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: c.inputBg,
    },
    segmentActive: {
      backgroundColor: c.primary,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textSecondary,
    },
    segmentTextActive: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    summaryCard: {
      borderRadius: 12,
      padding: 16,
      margin: 16,
      borderWidth: 1,
      alignItems: "center",
    },
    summaryValue: {
      fontSize: 40,
      fontWeight: "bold",
    },
    summaryLabel: {
      fontSize: 14,
      marginTop: 4,
    },
    summarySub: {
      fontSize: 13,
      marginTop: 6,
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 96,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: c.background,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: c.text,
    },
    emptySubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: "center",
    },
  });