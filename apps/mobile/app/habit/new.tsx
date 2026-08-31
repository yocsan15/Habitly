import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import HabitForm from "@/components/habit-form";
import { apiClient } from "@/lib/api";

export default function NewHabitScreen() {
  const router = useRouter();

  const handleSubmit = async (input: {
    name: string;
    description?: string;
    frequency: "daily" | "weekly" | "custom";
    color: string;
    icon: string;
  }) => {
    await apiClient.createHabit(input);
    router.back();
  };

  return (
    <ScrollView>
      <HabitForm onSubmit={handleSubmit} submitLabel="Crear Hábito" />
    </ScrollView>
  );
}
