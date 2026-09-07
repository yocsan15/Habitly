import { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ContributionGraph from "@/components/contribution-graph";
import ConfirmDialog from "@/components/confirm-dialog";
import { useTheme, type ThemeColors } from "@/lib/theme";
import { startReminderScheduler, stopReminderScheduler } from "@/lib/reminders";
import { toggleLogOffline, initSyncOnReconnect, pendingCount } from "@/lib/offline";
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
  const [offlineInfo, setOfflineInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!habits) return;
    startReminderScheduler(habits);
    return () => stopReminderScheduler();
  }, [habits]);

  useEffect(() => {
    setPending(pendingCount());
    initSyncOnReconnect(() => {
      setPending(pendingCount());
      setOfflineInfo(null);
      apiClient
        .listHabits()
        .then(setHabits)
        .catch(() => {
          // si sigue sin red, refrescar al reenfocar
        });
    });
  }, []);

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

  const handleToggle = async (item: Habit) => {
    setError(null);
    setOfflineInfo(null);
    try {
      const timezoneOffset = new Date().getTimezoneOffset();
      const result = await toggleLogOffline(item.id, todayIso(), -timezoneOffset);
      const queued = "queued" in result;
      const added = "action" in result
        ? result.action === "added"
        : true; // en modo offline siempre es un marcado (toggle local)
      if (queued) {
        setOfflineInfo(
          "Estás sin conexión. El registro se guardó y se sincronizará al volver.",
        );
        setPending(pendingCount());
      }
      setHabits((prev) =>
        prev
          ? prev.map((h) =>
              h.id === item.id
                ? {
                    ...h,
                    todayDone: added,
                    logDates: added
                      ? [...new Set([...h.logDates, todayIso()])].sort()
                      : h.logDates.filter((d) => d !== todayIso()),
                    streak: added
                      ? h.streak + (h.todayDone ? 0 : 1)
                      : h.streak - (h.todayDone ? 1 : 0),
                    weekLogs: added
                      ? [...h.weekLogs, { id: "tmp", habitId: h.id, date: todayIso(), createdAt: new Date().toISOString() }]
                      : h.weekLogs.filter((l) => l.date !== todayIso()),
                    monthlyCount: added
                      ? h.monthlyCount + 1
                      : Math.max(0, h.monthlyCount - 1),
                  }
                : h,
            )
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiClient.deleteHabit(pendingDelete.id);
      setHabits((prev) =>
        prev ? prev.filter((h) => h.id !== pendingDelete.id) : prev,
      );
      setPendingDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDragEnd = ({ data }: { data: Habit[] }) => {
    setHabits(data);
    apiClient.reorderHabits(data.map((h) => h.id)).catch(() => {
      setError("No se pudo guardar el orden");
    });
  };

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Habit>) => (
    <View
      style={[
        styles.card,
        item.todayDone && styles.cardDone,
        isActive && styles.cardActive,
      ]}
    >
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
            style={styles.dragHandle}
            onPress={drag}
            onLongPress={drag}
            delayLongPress={200}
            hitSlop={8}
          >
            <Text style={styles.dragHandleText}>⠿</Text>
          </Pressable>
          <Pressable
            style={styles.notesButton}
            onPress={() => router.push(`/habit-notes?habitId=${item.id}`)}
            hitSlop={8}
          >
            <Text style={styles.notesText}>📝</Text>
          </Pressable>
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
            onPress={() => setPendingDelete(item)}
            hitSlop={8}
          >
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
        </View>
      </View>
      <ContributionGraph logDates={item.logDates} color={item.color} />
      {item.weeklyGoal || item.streakGoal || item.monthlyGoal || item.volumeGoal ? (
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
          {item.monthlyGoal ? (
            <GoalBar
              progress={item.monthlyCount}
              goal={item.monthlyGoal}
              color={item.color}
              label="Mes"
            />
          ) : null}
          {item.volumeGoal ? (
            <GoalBar
              progress={Math.round(item.monthlyVolume * 100) / 100}
              goal={item.volumeGoal}
              color={item.color}
              label={item.volumeUnit || `Vol.`}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {offlineInfo ? (
        <View style={styles.offlineBox}>
          <Text style={styles.offlineText}>{offlineInfo}</Text>
        </View>
      ) : null}
      {pending > 0 ? (
        <View style={styles.offlineBox}>
          <Text style={styles.offlineText}>
            {pending} registro{pending === 1 ? "" : "s"} pendiente{pending === 1 ? "" : "s"} de sincronizar
          </Text>
        </View>
      ) : null}
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
        <DraggableFlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.list}
          activationDistance={6}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/habit/new")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Eliminar hábito"
        message={
          pendingDelete
            ? `¿Seguro que quieres eliminar "${pendingDelete.name}"? Se perderán sus registros y rachas.`
            : ""
        }
        confirmLabel={deleting ? "Eliminando…" : "Eliminar"}
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
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
    offlineBox: {
      backgroundColor: c.primaryLight,
      padding: 12,
      margin: 12,
      marginBottom: 0,
      borderRadius: 8,
    },
    offlineText: {
      color: c.primary,
      fontSize: 13,
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
    cardActive: {
      borderColor: c.primary,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
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
    dragHandle: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      marginRight: 4,
    },
    dragHandleText: {
      color: c.textMuted,
      fontSize: 22,
      lineHeight: 24,
    },
    notesButton: {
      padding: 4,
      marginRight: 8,
    },
    notesText: {
      fontSize: 16,
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
