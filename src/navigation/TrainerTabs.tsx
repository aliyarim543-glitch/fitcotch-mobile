import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  LayoutGrid,
  Users,
  Dumbbell,
  Menu,
  MessageSquare,
} from "lucide-react-native";
import { colors } from "../theme/colors";
import TrainerDashboardScreen from "../screens/trainer/TrainerDashboardScreen";
import TrainerClientsScreen from "../screens/trainer/TrainerClientsScreen";
import TrainerProgramsScreen from "../screens/trainer/TrainerProgramsScreen";
import TrainerMoreScreen from "../screens/trainer/TrainerMoreScreen";
import ComingSoonScreen from "../screens/trainer/ComingSoonScreen";
import TrainerGroupsScreen from "../screens/trainer/TrainerGroupsScreen";
import TrainerProductsScreen from "../screens/trainer/TrainerProductsScreen";
import TrainerOrdersScreen from "../screens/trainer/TrainerOrdersScreen";
import TrainerProgramSalesScreen from "../screens/trainer/TrainerProgramSalesScreen";
import TrainerCalendarScreen from "../screens/trainer/TrainerCalendarScreen";
import TrainerProgramRequestsScreen from "../screens/trainer/TrainerProgramRequestsScreen";
import TrainerMealPlansScreen from "../screens/trainer/TrainerMealPlansScreen";
import TrainerCouponsScreen from "../screens/trainer/TrainerCouponsScreen";
import TrainerExerciseLibraryScreen from "../screens/trainer/TrainerExerciseLibraryScreen";
import TrainerFoodDatabaseScreen from "../screens/trainer/TrainerFoodDatabaseScreen";
import TrainerProgressPhotosScreen from "../screens/trainer/TrainerProgressPhotosScreen";
import TrainerSettingsScreen from "../screens/trainer/TrainerSettingsScreen";
import TrainerMeasurementsScreen from "../screens/trainer/TrainerMeasurementsScreen";
import MessagingScreen from "../screens/shared/MessagingScreen";

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMenu" component={TrainerMoreScreen} />
      <MoreStack.Screen name="TrainerGroups" component={TrainerGroupsScreen} />
      <MoreStack.Screen name="TrainerProducts" component={TrainerProductsScreen} />
      <MoreStack.Screen name="TrainerOrders" component={TrainerOrdersScreen} />
      <MoreStack.Screen name="TrainerProgramSales" component={TrainerProgramSalesScreen} />
      <MoreStack.Screen name="TrainerCalendar" component={TrainerCalendarScreen} />
      <MoreStack.Screen name="TrainerProgramRequests" component={TrainerProgramRequestsScreen} />
      <MoreStack.Screen name="TrainerMealPlans" component={TrainerMealPlansScreen} />
      <MoreStack.Screen name="TrainerCoupons" component={TrainerCouponsScreen} />
      <MoreStack.Screen name="TrainerExercises" component={TrainerExerciseLibraryScreen} />
      <MoreStack.Screen name="TrainerFoods" component={TrainerFoodDatabaseScreen} />
      <MoreStack.Screen name="TrainerProgressPhotos" component={TrainerProgressPhotosScreen} />
      <MoreStack.Screen name="TrainerSettings" component={TrainerSettingsScreen} />
      <MoreStack.Screen name="TrainerMeasurements" component={TrainerMeasurementsScreen} />
      <MoreStack.Screen name="Messaging" component={MessagingScreen} />
      <MoreStack.Screen name="ComingSoon" component={ComingSoonScreen} />
    </MoreStack.Navigator>
  );
}

export default function TrainerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="داشبورد"
        component={TrainerDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="شاگردان"
        component={TrainerClientsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="برنامه‌ها"
        component={TrainerProgramsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="پیام‌ها"
        component={MessagingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="بیشتر"
        component={MoreStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
