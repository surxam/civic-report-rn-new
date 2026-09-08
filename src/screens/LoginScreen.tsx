import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { signIn, signUp, selectAuthBusy } from "../store/authSlice";
import { useAppDispatch, useAppSelector, useToast } from "../store/hooks";
import { colors, radius, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

type Mode = "login" | "register";

export default function LoginScreen(_props: ScreenProps<"Login">) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthBusy);
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return;
    try {
      if (mode === "login") {
        await dispatch(signIn({ email: email.trim(), password })).unwrap();
        toast("Bienvenue sur Civic Report.");
      } else {
        await dispatch(
          signUp({ email: email.trim(), password, fullName: fullName.trim() || "Citoyen" })
        ).unwrap();
        toast("Compte créé. Vérifiez votre email si la confirmation est activée.");
        setMode("login");
      }
    } catch (error) {
      toast((error as string) || "Une erreur est survenue.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} enableOnAndroid extraScrollHeight={40}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Ionicons name="document-text-outline" size={20} color={colors.primaryBright} />
          </View>
          <Text style={styles.brandText}>Civic Report</Text>
        </View>
        <Text style={styles.tagline}>Signalez pour agir, agissez pour votre ville.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{mode === "login" ? "Connexion" : "Inscription"}</Text>
          <Text style={styles.cardSubtitle}>
            {mode === "login"
              ? "Heureux de vous revoir parmi nous."
              : "Rejoignez la communauté de citoyens reporters."}
          </Text>

          {mode === "register" && (
            <FormField label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Jean Dupont" />
          )}

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nom@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordWrap}>
              <FormField
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                placeholder="••••••••"
                style={{ flex: 1, marginBottom: 0 }}
                inputStyle={{ borderWidth: 0, backgroundColor: "transparent" }}
              />
              <TouchableOpacity onPress={() => setPasswordVisible((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={mode === "login" ? "Se connecter" : "S'inscrire"}
            icon="arrow-forward"
            variant="secondary"
            full
            loading={loading}
            onPress={onSubmit}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")} style={styles.switchMode}>
          <Text style={styles.switchText}>
            {mode === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
            <Text style={styles.switchLink}>{mode === "login" ? "Inscrivez-vous" : "Connectez-vous"}</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "center", marginBottom: spacing.sm },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: colors.text, fontWeight: "700", fontSize: 18 },
  tagline: { color: colors.muted, textAlign: "center", marginBottom: spacing.lg, fontSize: 13.5 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 20, marginBottom: 4 },
  cardSubtitle: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
  label: { color: colors.text, fontWeight: "600", fontSize: 13.5, marginBottom: 6 },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  eyeBtn: { paddingHorizontal: spacing.md },
  switchMode: { marginTop: spacing.lg, alignSelf: "center" },
  switchText: { color: colors.muted, fontSize: 13.5 },
  switchLink: { color: colors.primaryBright, fontWeight: "600" },
});
