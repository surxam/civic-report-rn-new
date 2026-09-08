import { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import LocationMap from "../components/LocationMap";
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
  const [locating, setLocating] = useState(false);
  // `locating` (state) ne se met à jour qu'au prochain rendu : sur un double-tap rapide, les deux
  // appels peuvent passer la garde `if (locating) return` avant que React n'ait eu le temps de
  // committer le premier `setLocating(true)`. Cette ref est mise à jour de façon synchrone et
  // sert de verrou fiable contre les déclenchements concurrents (2 demandes de permission).
  const isLocatingRef = useRef(false);
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

  /** Formate un résultat de géocodage inverse en une adresse lisible et compacte. */
  const formatAddress = (place: Location.LocationGeocodedAddress) => {
    const street = [place.streetNumber, place.street].filter(Boolean).join(" ");
    const locality = [place.postalCode, place.city].filter(Boolean).join(" ");
    return [street, locality].filter(Boolean).join(", ");
  };

  const handleLocate = async () => {
    if (isLocatingRef.current) return;
    isLocatingRef.current = true;
    setLocating(true);
    try {
      // On vérifie d'abord le statut actuel : appeler requestForegroundPermissionsAsync() alors
      // que la permission est déjà accordée peut, sur certains appareils/versions d'Android,
      // rouvrir une seconde fois la même fenêtre système. On ne demande donc que si nécessaire.
      let status = (await Location.getForegroundPermissionsAsync()).status;
      if (status !== "granted") {
        status = (await Location.requestForegroundPermissionsAsync()).status;
      }
      if (status !== "granted") {
        toast("Autorisez l'accès à la position pour continuer.");
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        // Accepter la permission d'app n'allume pas le GPS de l'appareil, ce sont deux choses
        // distinctes sur Android. On déclenche la boîte de dialogue système « Activer la
        // localisation » (identique à celle de Google Maps) plutôt que de laisser l'utilisateur
        // le faire manuellement dans les réglages.
        if (Platform.OS === "android") {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {
            toast("Localisation refusée. Activez-la dans les réglages de votre appareil.");
            return;
          }
        } else {
          toast("Activez la localisation dans les réglages de votre appareil.");
          return;
        }
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const address = place ? formatAddress(place) : "";
      update({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        ...(address ? { address } : {}),
      });
      if (address) {
        toast("Position récupérée.");
      } else {
        toast("Position récupérée, mais adresse introuvable.");
      }
    } catch {
      toast("Impossible de récupérer votre position.");
    } finally {
      isLocatingRef.current = false;
      setLocating(false);
    }
  };

  /** Appelé quand l'utilisateur tape sur la carte ou déplace le marqueur : on met à jour les
   *  coordonnées immédiatement, et on tente de retrouver l'adresse correspondante. */
  const handleMapLocationChange = async (latitude: number, longitude: number) => {
    update({ latitude, longitude });
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = place ? formatAddress(place) : "";
      if (address) update({ address });
    } catch {
      // on garde les coordonnées même si le géocodage inverse échoue
    }
  };

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

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabelInline}>2. Localisation</Text>
        <TouchableOpacity style={styles.locateBtn} onPress={handleLocate} disabled={locating}>
          <Ionicons name="locate-outline" size={16} color={colors.primaryBright} />
          <Text style={styles.locateText}>{locating ? "Recherche…" : "Ma position"}</Text>
        </TouchableOpacity>
      </View>
      <FormField
        value={draft.address}
        onChangeText={(address) => update({ address })}
        placeholder="Adresse ou lieu du problème"
      />
      {draft.latitude != null && draft.longitude != null && (
        <LocationMap
          latitude={draft.latitude}
          longitude={draft.longitude}
          onLocationChange={handleMapLocationChange}
          style={styles.map}
        />
      )}

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
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLabelInline: { color: colors.text, fontWeight: "700", fontSize: 14 },
  map: { marginTop: spacing.sm },
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
  locateBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
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
