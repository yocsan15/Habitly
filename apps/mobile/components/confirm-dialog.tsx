import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme, type ThemeColors } from "@/lib/theme";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                destructive ? styles.destructiveButton : styles.confirmButton,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    dialog: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 20,
      width: "100%",
      maxWidth: 380,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
    },
    message: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 8,
      lineHeight: 20,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
      gap: 8,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 96,
      alignItems: "center",
      borderWidth: 1,
    },
    cancelButton: {
      borderColor: c.inputBorder,
      backgroundColor: c.inputBg,
    },
    confirmButton: {
      borderColor: c.primary,
      backgroundColor: c.primary,
    },
    destructiveButton: {
      borderColor: c.danger,
      backgroundColor: c.danger,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    buttonConfirmText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
  });