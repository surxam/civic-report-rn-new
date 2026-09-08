import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme/colors";

interface MediaThumbProps {
  uri: string;
  onRemove: () => void;
}

export default function MediaThumb({ uri, onRemove }: MediaThumbProps) {
  return (
    <View style={styles.thumb}>
      {uri ? <Image source={{ uri }} style={styles.image} /> : null}
      <TouchableOpacity style={styles.remove} onPress={onRemove} accessibilityLabel="Supprimer la photo">
        <Ionicons name="close" size={14} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
