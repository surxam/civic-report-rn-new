import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Screen from "../components/Screen";
import FormField from "../components/FormField";
import Button from "../components/Button";
import MediaThumb from "../components/MediaThumb";
import { updateDraft, resetDraft, submitReport, selectDraft } from "../store/reportsSlice";
import { useAppDispatch, useAppSelector, useToast } from "../store/hooks";
import { categoryById, getAllTypes } from "../constants/categories";
import { colors, radius, spacing } from "../theme/colors";
import type { ReportDraft, ScreenProps } from "../types";

export default function ReportFormScreen({ navigation }: ScreenProps<"ReportForm">) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const category = categoryById(draft.categoryId);
  const typeOptions = category ? category.types : getAllTypes();

  const update = (patch: Partial<ReportDraft>) => dispatch(updateDraft(patch));

  const addPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast("Autorisez l'accès aux photos pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      selectionLimit: 2 - draft.photos.length,
      allowsMultipleSelection: true,
    });
    if (result.canceled || !result.assets?.length) return;
    update({ photos: [...draft.photos, ...result.assets.map((a) => a.uri)].slice(0, 2) });
  };

  const removePhoto = (index: number) => {
    const next = [...draft.photos];
    next.splice(index, 1);
    update({ photos: next });
  };

  const removeVideo = () => update({ video: null });

  const onCancel = () => {
    dispatch(resetDraft());
    navigation.navigate("Categories");
  };

  const onSubmit = async () => {
    if (!draft.type || !draft.title.trim() || !draft.address.trim() || draft.description.trim().length < 20) {
      setError("Complétez le type, le lieu, le titre et une description d'au moins 20 caractères.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await dispatch(submitReport()).unwrap();
      navigation.navigate("History");
      toast("Votre rapport a été envoyé aux services municipaux.");
    } catch (e) {
      toast((e as string) || "Impossible d'envoyer le rapport.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen navigation={navigation} activeTab="Categories" back>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Nouveau rapport</Text>
          <Text style={styles.subtitle}>Décrivez le problème que vous avez constaté</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>1. Type de signalement</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {typeOptions.map((type) => (
          <TouchableOpacity
            key={type.value}
            onPress={() => update({ type: type.value })}
            style={[styles.chip, draft.type === type.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, draft.type === type.value && styles.chipTextActive]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>2. Localisation</Text>
      <FormField
        value={draft.address}
        onChangeText={(address) => update({ address })}
        placeholder="Adresse ou lieu du problème"
      />
      <TouchableOpacity style={styles.locateBtn} onPress={() => toast("Position simulée : " + draft.address)}>
        <Ionicons name="locate-outline" size={16} color={colors.primaryBright} />
        <Text style={styles.locateText}>Ma position</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>3. Titre du rapport</Text>
      <FormField
        value={draft.title}
        onChangeText={(title) => update({ title })}
        placeholder="Ex. Trou dangereux sur la chaussée"
        maxLength={160}
      />

      <Text style={styles.sectionLabel}>4. Description du problème</Text>
      <FormField
        value={draft.description}
        onChangeText={(description) => update({ description })}
        placeholder="Décrivez clairement le problème, son emplacement et les éventuels risques."
        multiline
        numberOfLines={5}
        inputStyle={{ height: 110, textAlignVertical: "top" }}
        maxLength={2000}
      />
      <Text style={styles.hint}>Conseil : soyez précis et objectif (20 caractères minimum)</Text>

      <Text style={styles.sectionLabel}>5. Photos et vidéo (facultatif)</Text>
      <View style={styles.mediaRow}>
        {draft.photos.map((uri, index) => (
          <MediaThumb key={uri + index} uri={uri} onRemove={() => removePhoto(index)} />
        ))}
        {draft.photos.length < 2 && (
          <TouchableOpacity style={styles.addPhoto} onPress={addPhoto}>
            <Ionicons name="camera-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {draft.video ? (
        <View style={styles.videoChip}>
          <Ionicons name="videocam" size={16} color={colors.primaryBright} />
          <Text style={styles.videoChipText}>Vidéo jointe</Text>
          <TouchableOpacity onPress={removeVideo} accessibilityLabel="Supprimer la vidéo">
            <Ionicons name="close" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Annuler" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
        <Button
          title="Envoyer"
          icon="send"
          variant="secondary"
          loading={submitting}
          onPress={onSubmit}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  sectionLabel: { color: colors.text, fontWeight: "700", fontSize: 14, marginTop: spacing.md, marginBottom: spacing.xs },
  chipRow: { marginBottom: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextActive: { color: colors.text, fontWeight: "600" },
  locateBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm, alignSelf: "flex-start" },
  locateText: { color: colors.primaryBright, fontSize: 13, fontWeight: "600" },
  hint: { color: colors.subtle, fontSize: 12, marginBottom: spacing.xs },
  mediaRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  videoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  videoChipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  addPhoto: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
