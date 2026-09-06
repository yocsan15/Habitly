import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark";

const THEME_KEY = "app_theme";
const isWeb = Platform.OS === "web";

export interface ThemeColors {
  background: string;
  card: string;
  cardDoneBg: string;
  cardDoneBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  placeholderText: string;
  headerBg: string;
  headerText: string;
  headerBorder: string;
  tabBarBg: string;
  cellEmpty: string;
  chipBg: string;
  danger: string;
  primary: string;
  primaryLight: string;
}

export const lightColors: ThemeColors = {
  background: "#ffffff",
  card: "#ffffff",
  cardDoneBg: "#f0f8ef",
  cardDoneBorder: "#b5e0b0",
  text: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#eeeeee",
  inputBg: "#ffffff",
  inputBorder: "#cccccc",
  placeholderText: "#9ca3af",
  headerBg: "#ffffff",
  headerText: "#1f2937",
  headerBorder: "#e5e7eb",
  tabBarBg: "#ffffff",
  cellEmpty: "#e5e7eb",
  chipBg: "#ffffff",
  danger: "#e74c3c",
  primary: "#26519e",
  primaryLight: "#eef3fb",
};

export const darkColors: ThemeColors = {
  background: "#0f1115",
  card: "#1b2028",
  cardDoneBg: "#12251c",
  cardDoneBorder: "#2f6b4f",
  text: "#e6e6e6",
  textSecondary: "#a3aab4",
  textMuted: "#7c8591",
  border: "#2b323c",
  inputBg: "#161a21",
  inputBorder: "#3a434f",
  placeholderText: "#6b7280",
  headerBg: "#161a21",
  headerText: "#f3f4f6",
  headerBorder: "#2b323c",
  tabBarBg: "#161a21",
  cellEmpty: "#2a3038",
  chipBg: "#161a21",
  danger: "#ff6b5e",
  primary: "#5b8ff5",
  primaryLight: "#16233d",
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

async function loadStoredMode(): Promise<ThemeMode | null> {
  try {
    if (isWeb) {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(THEME_KEY);
      return raw === "dark" ? "dark" : raw === "light" ? "light" : null;
    }
    const raw = await SecureStore.getItemAsync(THEME_KEY);
    return raw === "dark" ? "dark" : raw === "light" ? "light" : null;
  } catch {
    return null;
  }
}

async function storeMode(mode: ThemeMode): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_KEY, mode);
      }
      return;
    }
    await SecureStore.setItemAsync(THEME_KEY, mode);
  } catch {
    // ignorar errores de persistencia
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadStoredMode();
      if (stored) setModeState(stored);
      setIsLoading(false);
    })();
  }, []);

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    await storeMode(next);
  };

  const toggleTheme = async () => {
    await setMode(mode === "light" ? "dark" : "light");
  };

  const colors = mode === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{ mode, colors, isLoading, setMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return ctx;
}