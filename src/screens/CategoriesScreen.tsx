import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import CategoryCard from "../components/CategoryCard";
import Button from "../components/Button";
import { categories, categoryById } from "../constants/categories";
import { updateDraft } from "../store/reportsSlice";
import { useAppDispatch } from "../store/hooks";
import { colors, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

export default function CategoriesScreen({ navigation }: ScreenProps<"Categories">) {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);

  const onContinue = () => {
    if (!selected) return;
    dispatch(updateDraft({ categoryId: selected, type: "" }));
    navigation.navigate("MediaChoice");
  };

  return (
    <Screen navigation={navigation} activeTab="Categories">
      <Text style={styles.title}>Que voulez-vous signaler ?</Text>
      <Text style={styles.subtitle}>
        Sélectionnez la catégorie qui correspond le mieux au problème constaté dans votre quartier.
      </Text>

      <View style={styles.grid}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            selected={selected === category.id}
            onPress={() => setSelected(category.id)}
          />
        ))}
      </View>

      <Button
        title="Continuer"
        icon="arrow-forward"
        variant="secondary"
        full
        disabled={!selected}
        onPress={onContinue}
      />

      <Text style={styles.note}>
        {selected ? `Catégorie choisie : ${categoryById(selected)?.label}` : "Choisissez une catégorie pour poursuivre."}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 21, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  note: { color: colors.subtle, fontSize: 12.5, textAlign: "center", marginTop: spacing.md },
});
