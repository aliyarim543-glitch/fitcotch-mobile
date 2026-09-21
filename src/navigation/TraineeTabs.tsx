import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, TrendingUp, ShoppingBag, User, MessageSquare, Package } from "lucide-react-native";
import { colors } from "../theme/colors";
import TraineeHomeScreen from "../screens/trainee/TraineeHomeScreen";
import TraineeProgressScreen from "../screens/trainee/TraineeProgressScreen";
import TraineeStoreScreen from "../screens/trainee/TraineeStoreScreen";
import TraineeProfileScreen from "../screens/trainee/TraineeProfileScreen";
import TraineeOrdersScreen from "../screens/trainee/TraineeOrdersScreen";
import MessagingScreen from "../screens/shared/MessagingScreen";

const Tab = createBottomTabNavigator();

export default function TraineeTabs() {
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
        name="خانه"
        component={TraineeHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="پیشرفت"
        component={TraineeProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="پیام مربی"
        component={MessagingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="فروشگاه"
        component={TraineeStoreScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="سفارش‌ها"
        component={TraineeOrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Package color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="پروفایل"
        component={TraineeProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
