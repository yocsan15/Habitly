import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function HabitLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { color: colors.headerText },
        headerTintColor: colors.headerText,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="new" options={{ title: "Nuevo Hábito" }} />
      <Stack.Screen name="[id]" options={{ title: "Editar Hábito" }} />
    </Stack>
  );
}