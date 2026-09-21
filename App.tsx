import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
