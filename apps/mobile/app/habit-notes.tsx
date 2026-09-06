import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import { patchLogOffline } from "@/lib/offline";
import { useTheme, type ThemeColors } from "@/lib/theme";
import TrendChart from "@/components/trend-chart";
import type { Habit, HabitLog } from "shared-types";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
}

function LogRow({
  log,
  color,
}: {
  log: HabitLog;
  color: string;
}) {
  const { colors } = useTheme();
  const [note, setNote] = useState(log.note ?? "");
  const [quantity, setQuantity] = useState(log.quantity?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const q = quantity.trim() === "" ? null : Number(quantity);
      await patchLogOffline(log.habitId, log.date, {
        note: note.trim() ? note.trim() : null,
        quantity: q !== null && Number.isFinite(q) ? q : null,
      });
    } catch {
      // error silencioso en la fila
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[logRowStyles.row]}>
      <View style={logRowStyles.header}>
        <View style={[logRowStyles.dot, { backgroundColor: color }]} />
        <Text style={[logRowStyles.date, { color: colors.text }]}>{formatDate(log.date)}</Text>
        <Text style={[logRowStyles.marker, { color: colors.textMuted }]}>✓</Text>
      </View>
      <TextInput
        style={[logRowStyles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Escribe una nota del día (opcional)"
        placeholderTextColor={colors.placeholderText}
        value={note}
        onChangeText={setNote}
        onEndEditing={save}
        multiline
      />
      <View style={logRowStyles.bottomRow}>
        <TextInput
          style={[logRowStyles.qtyInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Cantidad"
          placeholderTextColor={colors.placeholderText}
          value={quantity}
          onChangeText={setQuantity}
          onEndEditing={save}
          keyboardType="decimal-pad"
        />
        {saving ? <Text style={{ color: colors.textMuted }}>Guardando…</Text> : null}
      </View>
    </View>
  );
}

export default function HabitNotesScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getHabit(habitId)
      .then((data) => {
        if (!cancelled) setHabit(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar");
      });
    return () => {
      cancelled = true;
    };
  }, [habitId]);

  const logs = useMemo(
    () =>
      habit
        ? [...habit.allLogs].sort((a, b) => (a.date < b.date ? 1 : -1))
        : [],
    [habit],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
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

  const todayLog = logs.find((l) => l.date === todayIso());
  const pastLogs = logs.filter((l) => l.date !== todayIso());

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={[...(todayLog ? [todayLog] : []), ...pastLogs]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <LogRow log={item} color={habit.color} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>
            {habit.icon} {habit.name}
          </Text>
          <Text style={styles.subtitle}>
            Notas y cantidad por día. Las notas se guardan automáticamente.
          </Text>
          <TrendChart habit={habit} />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sin registros todavía</Text>
          <Text style={styles.emptySubtitle}>
            Marca el hábito como hecho para empezar a escribir notas.
          </Text>
        </View>
      }
    />
  );
}

const logRowStyles = StyleSheet.create({
  row: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  date: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  marker: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 44,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  qtyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    width: 120,
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
      paddingBottom: 48,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: c.background,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: c.text,
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 4,
      marginBottom: 20,
    },
    errorText: {
      color: c.danger,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    emptySubtitle: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: "center",
    },
  });