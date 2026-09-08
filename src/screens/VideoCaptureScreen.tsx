import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
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

  const player = useVideoPlayer(recordedUri ?? "", (p) => {
    p.loop = true;
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
        <VideoView style={styles.fill} player={player} contentFit="contain" nativeControls={false} />

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
      <CameraView
        ref={cameraRef}
        style={styles.fill}
        facing="back"
        mode="video"
        mute={false}
        zoom={0}
        ratio={Platform.OS === "android" ? "16:9" : undefined}
      />

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
