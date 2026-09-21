import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import {
  UtensilsCrossed,
  Calendar,
  Library,
  Apple,
  Tag,
  ShoppingBag,
  Package,
  Settings,
  ChevronLeft,
  Camera,
  Ruler,
  Users2,
  MessageSquare,
  ClipboardList,
} from "lucide-react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useAuth } from "../../context/AuthContext";

const MENU_ITEMS: {
  title: string;
  icon: React.ComponentType<any>;
  route?: string;
}[] = [
  { title: "پیام‌رسانی", icon: MessageSquare, route: "Messaging" },
  { title: "تقویم و قرارها", icon: Calendar, route: "TrainerCalendar" },
  { title: "درخواست‌های خرید برنامه", icon: ClipboardList, route: "TrainerProgramRequests" },
  { title: "گروه‌های شاگردان", icon: Users2, route: "TrainerGroups" },
  { title: "محصولات فروشگاه", icon: ShoppingBag, route: "TrainerProducts" },
  { title: "سفارش‌های فروشگاه", icon: Package, route: "TrainerOrders" },
  { title: "فروش برنامه (تمرین/تغذیه)", icon: Package, route: "TrainerProgramSales" },
  { title: "برنامه‌های غذایی", icon: UtensilsCrossed, route: "TrainerMealPlans" },
  { title: "کتابخانه‌ی تمرین", icon: Library, route: "TrainerExercises" },
  { title: "بانک غذایی", icon: Apple, route: "TrainerFoods" },
  { title: "کدهای تخفیف", icon: Tag, route: "TrainerCoupons" },
  { title: "اندازه‌گیری‌ها", icon: Ruler, route: "TrainerMeasurements" },
  { title: "عکس‌های پیشرفت شاگردان", icon: Camera, route: "TrainerProgressPhotos" },
  { title: "تنظیمات و برندینگ", icon: Settings, route: "TrainerSettings" },
];

export default function TrainerMoreScreen({ navigation }: any) {
  const { logout } = useAuth();

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="بیشتر" />
      <View style={styles.body}>
        <Card style={{ padding: 6 }}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.row, i < MENU_ITEMS.length - 1 && styles.rowBorder]}
              onPress={() =>
                item.route
                  ? navigation.navigate(item.route)
                  : navigation.navigate("ComingSoon", { title: item.title })
              }
            >
              <ChevronLeft size={16} color={colors.textMuted} />
              <Text style={styles.rowText}>{item.title}</Text>
              <item.icon size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Card>
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>خروج از حساب</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1, color: colors.text, fontSize: 14, textAlign: "right" },
  logout: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
  },
  logoutText: { color: colors.danger, fontWeight: "700" },
});
