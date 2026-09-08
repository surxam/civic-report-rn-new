import { useEffect, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import ReportCard from "../components/ReportCard";
import Button from "../components/Button";
import { fetchReports, selectReports, selectReportsLoading } from "../store/reportsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { colors, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

export default function HistoryScreen({ navigation }: ScreenProps<"History">) {
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectReports);
  const loading = useAppSelector(selectReportsLoading);

  const load = useCallback(() => dispatch(fetchReports()), [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen navigation={navigation} activeTab="History" tools scroll={false}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Mes rapports</Text>
          <Text style={styles.subtitle}>Suivi de vos signalements citoyens</Text>
        </View>
        <Button title="Nouveau" icon="add" variant="secondary" onPress={() => navigation.navigate("Categories")} />
      </View>

      {loading && !reports.length ? (
        <ActivityIndicator color={colors.primaryBright} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReportCard report={item} />}
          contentContainerStyle={styles.list}
          onRefresh={load}
          refreshing={loading}
          ListEmptyComponent={<Text style={styles.empty}>Aucun rapport pour le moment.</Text>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  empty: { color: colors.subtle, textAlign: "center", marginTop: spacing.xl },
});
