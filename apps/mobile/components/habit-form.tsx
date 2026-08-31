import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { Habit, HabitFrequency } from "shared-types";

const COLORS = ["#26519e", "#e74c3c", "#27ae60", "#f39c12", "#8e44ad", "#16a085"];
const ICONS = ["✅", "🏃", "💧", "📚", "🧘", "💪", "🛌", "🥗"];

interface HabitFormProps {
  initial?: Habit;
  onSubmit: (input: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    color: string;
    icon: string;
  }) => Promise<void>;
  submitLabel: string;
}

export default function HabitForm({ initial, onSubmit, submitLabel }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [frequency, setFrequency] = useState<HabitFrequency>(initial?.frequency ?? "daily");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("El nombre es obligatorio");
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
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Detalle del hábito"
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    borderColor: "#ccc",
    marginBottom: 4,
  },
  chipActive: {
    backgroundColor: "#26519e",
    borderColor: "#26519e",
  },
  chipText: {
    color: "#333",
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
    borderColor: "#333",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 4,
  },
  iconBtnActive: {
    borderColor: "#26519e",
    borderWidth: 2,
    backgroundColor: "#eef3fb",
  },
  iconText: {
    fontSize: 24,
  },
  error: {
    color: "#c0392b",
    marginTop: 12,
  },
  button: {
    backgroundColor: "#26519e",
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
