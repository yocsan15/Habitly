import { useMemo } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { useTheme, type ThemeColors } from "@/lib/theme";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_COLOR = "#26519e";

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface ContributionGraphProps {
  logDates: string[];
  color?: string;
  weeks?: number;
  showHeader?: boolean;
}

export default function ContributionGraph({
  logDates,
  color = DEFAULT_COLOR,
  weeks = 53,
  showHeader = false,
}: ContributionGraphProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cells = useMemo(() => {
    const doneSet = new Set(logDates);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayOfWeek = now.getDay();
    const startOfCurrentWeek = now.getTime() - dayOfWeek * MS_PER_DAY;

    const columns: { date: string; done: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const weekStart = startOfCurrentWeek - (weeks - 1 - w) * 7 * MS_PER_DAY;
      const column: { date: string; done: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart + d * MS_PER_DAY);
        column.push({
          date: toDateStr(dayDate),
          done: dayDate.getTime() <= now.getTime() && doneSet.has(toDateStr(dayDate)),
        });
      }
      columns.push(column);
    }
    return columns;
  }, [logDates, weeks]);

  const totalCount = useMemo(() => logDates.length, [logDates]);

  return (
    <View style={styles.container}>
      {showHeader ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Actividad</Text>
          <Text style={styles.headerCount}>{totalCount} registros</Text>
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.grid}>
          {cells.map((column, ci) => (
            <View key={ci} style={styles.column}>
              {column.map((cell, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    cell.done
                      ? { backgroundColor: color }
                      : styles.cellEmpty,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Menos</Text>
        <View style={[styles.cell, styles.cellEmpty, styles.legendCell]} />
        <View style={[styles.cell, { backgroundColor: color }, styles.legendCell]} />
        <Text style={styles.legendText}>Más</Text>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    headerTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: c.text,
    },
    headerCount: {
      fontSize: 12,
      color: c.textMuted,
    },
    scroll: {
      paddingVertical: 2,
    },
    grid: {
      flexDirection: "row",
    },
    column: {
      flexDirection: "column",
    },
    cell: {
      width: 7,
      height: 7,
      borderRadius: 1.5,
      margin: 1,
    },
    cellEmpty: {
      backgroundColor: c.cellEmpty,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 4,
    },
    legendCell: {
      width: 8,
      height: 8,
      marginLeft: 3,
    },
    legendText: {
      fontSize: 10,
      color: c.textMuted,
      marginLeft: 4,
    },
  });