import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { updateDraft, selectDraft } from "../store/reportsSlice";
import { useAppDispatch, useAppSelector, useToast } from "../store/hooks";
import { colors, radius, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

export default function MediaChoiceScreen({ navigation }: ScreenProps<"MediaChoice">) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const toast = useToast();

  /**
   * Demande l'accès caméra + galerie avant d'ouvrir l'appareil photo.
   * La galerie est nécessaire côté Android/iOS pour que le cliché pris puisse être
   * traité (et, sur certains appareils, sauvegardé) après la capture.
   */
  const ensureCameraAccess = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      toast("Autorisez l'accès à la caméra pour continuer.");
      return false;
    }
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libraryPermission.granted) {
      toast("Autorisez l'accès à la galerie pour continuer.");
      return false;
    }
    return true;
  };

  const pickPhoto = async () => {
    const granted = await ensureCameraAccess();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    dispatch(updateDraft({ photos: [...draft.photos, ...result.assets.map((a) => a.uri)].slice(0, 2) }));
    toast("Photo ajoutée.");
    navigation.navigate("ReportForm");
  };

  const pickVideo = async () => {
    const granted = await ensureCameraAccess();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 30,
    });
    if (result.canceled || !result.assets?.length) return;
    dispatch(updateDraft({ video: result.assets[0].uri }));
    toast("Vidéo ajoutée.");
    navigation.navigate("ReportForm");
  };

  return (
    <Screen navigation={navigation} activeTab="Categories" back>
      <Text style={styles.title}>Comment souhaitez-vous illustrer ce rapport ?</Text>
      <Text style={styles.subtitle}>Une image ou une vidéo aide nos services à intervenir plus rapidement.</Text>

      <View style={styles.stack}>
        <TouchableOpacity style={styles.choice} onPress={pickVideo}>
          <Ionicons name="videocam-outline" size={26} color={colors.primaryBright} />
          <Text style={styles.choiceTitle}>Vidéo</Text>
          <Text style={styles.choiceSub}>Capturer l'action (max. 30s)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.choice} onPress={pickPhoto}>
          <Ionicons name="camera-outline" size={26} color={colors.primaryBright} />
          <Text style={styles.choiceTitle}>Photo</Text>
          <Text style={styles.choiceSub}>Prenez un cliché net</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skip} onPress={() => navigation.navigate("ReportForm")}>
        <Text style={styles.skipText}>Passer cette étape</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryBright} />
      </TouchableOpacity>

      <Text style={styles.disclaimer}>Vous pourrez ajouter des médias plus tard depuis l'historique.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginBottom: spacing.lg },
  stack: { gap: spacing.md, marginBottom: spacing.lg },
  choice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    alignItems: "center",
    gap: 4,
  },
  choiceTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginTop: 4 },
  choiceSub: { color: colors.muted, fontSize: 12.5 },
  skip: { flexDirection: "row", alignSelf: "center", alignItems: "center", gap: 6, marginBottom: spacing.md },
  skipText: { color: colors.primaryBright, fontWeight: "600" },
  disclaimer: { color: colors.subtle, fontSize: 12, textAlign: "center" },
});
