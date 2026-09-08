import { useEffect, useCallback, useState, useMemo } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import ReportCard from "../components/ReportCard";
import Button from "../components/Button";
import { fetchReports, selectReports, selectReportsLoading } from "../store/reportsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { colors, radius, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

const PAGE_SIZE = 5;

export default function HistoryScreen({ navigation }: ScreenProps<"History">) {
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectReports);
  const loading = useAppSelector(selectReportsLoading);
  const [page, setPage] = useState(1);

  const load = useCallback(() => dispatch(fetchReports()), [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  // Si la liste raccourcit (rafraîchissement, suppression...), on reste sur une page valide.
  const currentPage = Math.min(page, totalPages);
  const pageReports = useMemo(
    () => reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [reports, currentPage]
  );

  const goToPage = (next: number) => setPage(Math.min(Math.max(next, 1), totalPages));

  return (
    <Screen navigation={navigation} activeTab="History" tools>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Mes rapports</Text>
          <Text style={styles.subtitle}>Suivi de vos signalements citoyens</Text>
        </View>
        <Button title="Nouveau" icon="add" variant="secondary" onPress={() => navigation.navigate("Categories")} />
      </View>

      {loading && !reports.length ? (
        <ActivityIndicator color={colors.primaryBright} style={{ marginTop: spacing.lg }} />
      ) : reports.length ? (
        <>
          {pageReports.map((item) => (
            <ReportCard key={String(item.id)} report={item} />
          ))}

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? colors.subtle : colors.text} />
              </TouchableOpacity>

              <Text style={styles.pageLabel}>
                Page {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={currentPage === totalPages ? colors.subtle : colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.empty}>Aucun rapport pour le moment.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 30,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  empty: { color: colors.subtle, textAlign: "center", marginTop: spacing.xl },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
});
