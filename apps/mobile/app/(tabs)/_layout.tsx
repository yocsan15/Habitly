import { Tabs, Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.headerBorder,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { color: colors.headerText },
        headerTintColor: colors.headerText,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Hábitos" }} />
      <Tabs.Screen name="goals" options={{ title: "Metas" }} />
      <Tabs.Screen name="reports" options={{ title: "Reportes" }} />
      <Tabs.Screen name="achievements" options={{ title: "Logros" }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
