import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { hideToast, selectToast } from "./toastSlice";
import { useAppDispatch, useAppSelector } from "./hooks";
import { colors, radius, spacing } from "../theme/colors";

export default function ToastHost() {
  const { message, id } = useAppSelector(selectToast);
  const dispatch = useAppDispatch();
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        dispatch(hideToast())
      );
    }, 3000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 96,
    alignSelf: "center",
    backgroundColor: colors.surface3,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
    maxWidth: "88%",
  },
  text: { color: colors.text, fontSize: 13.5, textAlign: "center" },
});
