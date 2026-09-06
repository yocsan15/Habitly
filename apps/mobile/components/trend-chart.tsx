import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, type ThemeColors } from "@/lib/theme";
import { weekTrend } from "@/lib/stats";
import type { Habit } from "shared-types";

export default function TrendChart({
  habit,
  weeks = 12,
}: {
  habit: Habit;
  weeks?: number;
}) {
  const { colors } = useTheme();
  const trend = useMemo(() => weekTrend(habit, weeks), [habit, weeks]);
  const activeWeeks = trend.filter((w) => w.some((p) => p.done)).length;
  const bestWeek = trend.reduce(
    (m, w) => Math.max(m, w.filter((p) => p.done).length),
    0,
  );

  return (
    <View
      style={[
        trendStyles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={trendStyles.header}>
        <Text style={[trendStyles.title, { color: colors.text }]}>
          Tendencia · últimas {weeks} semanas
        </Text>
        <Text style={[trendStyles.subtitle, { color: colors.textMuted }]}>
          {bestWeek} días en tu mejor semana · {activeWeeks} semanas activas
        </Text>
      </View>
      <View style={trendStyles.chart}>
        {trend.map((week, i) => {
          const done = week.filter((p) => p.done).length;
          const height = done === 0 ? 4 : 4 + (done / 7) * 44;
          return (
            <View key={i} style={trendStyles.column}>
              <View style={trendStyles.barArea}>
                <View
                  style={[
                    trendStyles.bar,
                    {
                      height,
                      backgroundColor: done === 0 ? colors.cellEmpty : habit.color,
                      opacity: done === 0 ? 1 : 0.4 + (done / 7) * 0.6,
                    },
                  ]}
                />
              </View>
              <Text style={[trendStyles.weekLabel, { color: colors.textMuted }]}>
                S{i + 1}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const trendStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 92,
  },
  column: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 1,
  },
  barArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    width: 10,
    borderRadius: 3,
  },
  weekLabel: {
    fontSize: 8,
    marginTop: 4,
  },
});