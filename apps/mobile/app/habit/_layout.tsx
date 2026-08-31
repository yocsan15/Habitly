import { Stack } from "expo-router";

export default function HabitLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="new" options={{ title: "Nuevo Hábito" }} />
      <Stack.Screen name="[id]" options={{ title: "Editar Hábito" }} />
    </Stack>
  );
}
