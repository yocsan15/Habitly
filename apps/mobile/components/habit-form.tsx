import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme, type ThemeColors } from "@/lib/theme";
import type { Habit, HabitFrequency } from "shared-types";

const COLORS = [
  "#26519e", "#e74c3c", "#27ae60", "#f39c12", "#8e44ad", "#16a085",
  "#e84393", "#0984e3", "#d63031", "#00b894", "#6c5ce7", "#fdcb6e",
];
const ICONS = [
  "✅", "🏃", "💧", "📚", "🧘", "💪", "🛌", "🥗",
  "🍎", "🏋️", "🎸", "🎨", "✍️", "🧹", "🚭", "💰",
  "☀️", "🧠", "🚴", "🐶", "🌱", "🧑‍💻", "🎯", "📵",
];

interface HabitFormProps {
  initial?: Habit;
  onSubmit: (input: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    color: string;
    icon: string;
    weeklyGoal?: number | null;
    streakGoal?: number | null;
  }) => Promise<void>;
  submitLabel: string;
}

export default function HabitForm({ initial, onSubmit, submitLabel }: HabitFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [frequency, setFrequency] = useState<HabitFrequency>(initial?.frequency ?? "daily");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0]);
  const [weeklyGoal, setWeeklyGoal] = useState(initial?.weeklyGoal?.toString() ?? "");
  const [streakGoal, setStreakGoal] = useState(initial?.streakGoal?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const parsedWeekly = weeklyGoal.trim() === "" ? null : Number(weeklyGoal);
    const parsedStreak = streakGoal.trim() === "" ? null : Number(streakGoal);
    if (parsedWeekly !== null && (!Number.isInteger(parsedWeekly) || parsedWeekly < 1 || parsedWeekly > 7)) {
      setError("La meta semanal debe ser un número entre 1 y 7");
      return;
    }
    if (parsedStreak !== null && (!Number.isInteger(parsedStreak) || parsedStreak < 1)) {
      setError("La meta de racha debe ser un número mayor a 0");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        frequency,
        color,
        icon,
        weeklyGoal: parsedWeekly,
        streakGoal: parsedStreak,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Beber 2L de agua"
        placeholderTextColor={colors.placeholderText}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Detalle del hábito"
        placeholderTextColor={colors.placeholderText}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Frecuencia</Text>
      <View style={styles.row}>
        {(["daily", "weekly", "custom"] as HabitFrequency[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, frequency === f && styles.chipActive]}
            onPress={() => setFrequency(f)}
          >
            <Text style={frequency === f ? styles.chipTextActive : styles.chipText}>
              {f === "daily" ? "Diario" : f === "weekly" ? "Semanal" : "Personalizado"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <Text style={styles.label}>Ícono</Text>
      <View style={styles.row}>
        {ICONS.map((i) => (
          <Pressable
            key={i}
            style={[styles.iconBtn, icon === i && styles.iconBtnActive]}
            onPress={() => setIcon(i)}
          >
            <Text style={styles.iconText}>{i}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Meta semanal (días por semana)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 5 (déjalo vacío para no fijar meta)"
        placeholderTextColor={colors.placeholderText}
        value={weeklyGoal}
        onChangeText={setWeeklyGoal}
        keyboardType="number-pad"
        maxLength={1}
      />

      <Text style={styles.label}>Meta de racha (días seguidos)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 30 (déjalo vacío para no fijar meta)"
        placeholderTextColor={colors.placeholderText}
        value={streakGoal}
        onChangeText={setStreakGoal}
        keyboardType="number-pad"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: c.background,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
      marginTop: 12,
      color: c.text,
    },
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: c.inputBg,
      color: c.text,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 4,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.inputBorder,
      marginBottom: 4,
      backgroundColor: c.chipBg,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipText: {
      color: c.textSecondary,
    },
    chipTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    swatchActive: {
      borderWidth: 3,
      borderColor: c.text,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.inputBorder,
      marginBottom: 4,
      backgroundColor: c.chipBg,
    },
    iconBtnActive: {
      borderColor: c.primary,
      borderWidth: 2,
      backgroundColor: c.primaryLight,
    },
    iconText: {
      fontSize: 24,
    },
    error: {
      color: c.danger,
      marginTop: 12,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
      marginTop: 20,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
