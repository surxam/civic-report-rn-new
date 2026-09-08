import { View, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store } from "./src/store/store";
import AuthListener from "./src/store/AuthListener";
import ToastHost from "./src/store/ToastHost";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <AuthListener />
          <RootNavigator />
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
