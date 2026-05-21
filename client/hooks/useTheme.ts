import { Colors } from "@/constants/theme";

export function useTheme() {
  const theme = Colors.light;
  const isDark = false;

  return {
    theme,
    isDark,
  };
}
