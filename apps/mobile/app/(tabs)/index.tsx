import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import type { Habit } from "shared-types";

export default function HomeScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Error al cargar hábitos");
            setHabits([]);
          }
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteHabit(id);
      setHabits((prev) => (prev ? prev.filter((h) => h.id !== id) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const renderItem = ({ item }: { item: Habit }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/habit/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
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
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/habit/new")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fdecea",
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#c0392b",
  },
  list: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    color: "#c0392b",
    fontSize: 18,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#26519e",
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
