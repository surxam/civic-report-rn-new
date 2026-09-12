import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { updateDraft } from "../store/reportsSlice";
import { useAppDispatch, useToast } from "../store/hooks";
import { colors, radius, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

/** Durée maximale d'enregistrement, en millisecondes. Coupure pilotée nous-mêmes
 *  (plutôt que `videoMaxDuration` de la caméra système, non fiable sur Android). */
const MAX_DURATION_MS = 30_000;

/** Ratio réellement enregistré par la caméra sur Android (voir prop `ratio` plus bas).
 *  On dimensionne l'aperçu sur cette même valeur pour qu'il montre exactement le cadre
 *  qui sera filmé — sans ça, Android recadre/zoome l'aperçu pour remplir l'écran
 *  (scaleType FILL), ce qui ne correspond plus à la vidéo réellement enregistrée. */
const CAMERA_RATIO_HEIGHT_OVER_WIDTH = 4 / 3;

export default function VideoCaptureScreen({ navigation }: ScreenProps<"VideoCapture">) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const cameraRef = useRef<CameraView>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Sur Android on force `ratio="16:9"` (voir plus bas) : on calcule ici la boîte à cette
  // même proportion pour que l'aperçu affiché == le cadre réellement enregistré, sans
  // recadrage ni zoom. On part de la largeur de l'écran, et si la hauteur obtenue dépasse
  // l'écran (cas rare, tablette large), on part de la hauteur à la place.
  const cameraBoxSize = (() => {
    if (Platform.OS !== "android") return { width: windowWidth, height: windowHeight };
    const heightFromWidth = windowWidth * CAMERA_RATIO_HEIGHT_OVER_WIDTH;
    if (heightFromWidth <= windowHeight) return { width: windowWidth, height: heightFromWidth };
    return { width: windowHeight / CAMERA_RATIO_HEIGHT_OVER_WIDTH, height: windowHeight };
  })();

  const player = useVideoPlayer(recordedUri ?? "", (p) => {
    p.loop = true;
    // Le son est bien enregistré dans le fichier (pour le signalement), mais on ne le
    // rejoue pas à l'écran de relecture pour éviter le larsen avec le micro qui vient
    // de capturer, et parce que l'utilisateur n'a pas besoin de l'entendre ici.
    p.muted = true;
  });

  useEffect(() => {
    if (recordedUri) player.play();
  }, [recordedUri, player]);

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission, micPermission]);

  useEffect(() => () => clearTimers(), []);

  const clearTimers = () => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    stopTimeoutRef.current = null;
    tickIntervalRef.current = null;
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    setElapsedMs(0);

    const startedAt = Date.now();
    tickIntervalRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);

    // Coupure garantie pile à 30s, indépendamment de ce que fait la caméra native.
    stopTimeoutRef.current = setTimeout(() => {
      cameraRef.current?.stopRecording();
    }, MAX_DURATION_MS);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 30 });
      clearTimers();
      setIsRecording(false);
      if (video?.uri) {
        setRecordedUri(video.uri);
      } else {
        navigation.goBack();
      }
    } catch {
      clearTimers();
      setIsRecording(false);
      toast("Échec de l'enregistrement, réessayez.");
    }
  };

  const stopRecording = () => {
    clearTimers();
    cameraRef.current?.stopRecording();
  };

  const retake = () => {
    setRecordedUri(null);
    setElapsedMs(0);
  };

  const confirmVideo = () => {
    if (!recordedUri) return;
    dispatch(updateDraft({ video: recordedUri }));
    toast("Vidéo ajoutée.");
    navigation.navigate("ReportForm");
  };

  if (!cameraPermission || !micPermission) {
    return <View style={styles.fill} />;
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.fill}>
        <View style={styles.permissionBox}>
          <Ionicons name="videocam-off-outline" size={32} color={colors.muted} />
          <Text style={styles.permissionText}>
            La caméra et le microphone sont nécessaires pour filmer un signalement.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              requestCameraPermission();
              requestMicPermission();
            }}
          >
            <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const remainingSeconds = Math.max(0, Math.ceil((MAX_DURATION_MS - elapsedMs) / 1000));

  if (recordedUri) {
    return (
      <View style={styles.fill}>
        <View style={styles.cameraCenterer}>
          <VideoView style={cameraBoxSize} player={player} contentFit="cover" nativeControls={false} />
        </View>

        <SafeAreaView style={styles.overlay} pointerEvents="box-none">
          <View style={styles.topBar}>
            <Text style={styles.hintText}>Aperçu</Text>
          </View>

          <View style={styles.reviewBar}>
            <TouchableOpacity style={styles.reviewButton} onPress={retake}>
              <Ionicons name="refresh" size={20} color={colors.text} />
              <Text style={styles.reviewButtonText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reviewButton, styles.reviewButtonPrimary]} onPress={confirmVideo}>
              <Ionicons name="checkmark" size={20} color={colors.bg} />
              <Text style={[styles.reviewButtonText, styles.reviewButtonTextPrimary]}>Utiliser cette vidéo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <View style={styles.cameraCenterer}>
        <CameraView
          ref={cameraRef}
          style={cameraBoxSize}
          facing="back"
          mode="video"
          mute={false}
          zoom={0}
          ratio={Platform.OS === "android" ? "4:3" : undefined}
        />
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} disabled={isRecording}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          {isRecording ? (
            <View style={styles.timerPill}>
              <View style={styles.recDot} />
              <Text style={styles.timerText}>{remainingSeconds}s</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>Vidéo — 30s max.</Text>
          )}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <View style={styles.stopSquare} /> : <View style={styles.recordCircle} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  cameraCenterer: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: "space-between" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: { color: colors.text, fontSize: 13, backgroundColor: "rgba(0,0,0,0.45)", padding: 8, borderRadius: radius.sm },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  timerText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  bottomBar: { alignItems: "center", paddingBottom: spacing.xl },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: { borderColor: colors.red },
  recordCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.red },
  stopSquare: { width: 26, height: 26, borderRadius: 4, backgroundColor: colors.red },
  reviewBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  reviewButtonPrimary: { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright },
  reviewButtonText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  reviewButtonTextPrimary: { color: colors.bg },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  permissionText: { color: colors.text, textAlign: "center", fontSize: 14, lineHeight: 20 },
  permissionButton: {
    backgroundColor: colors.primaryBright,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
  },
  permissionButtonText: { color: colors.bg, fontWeight: "700" },
  cancelText: { color: colors.muted, marginTop: spacing.xs },
});
