import { View, Text, StyleSheet } from "react-native";
import { Sparkles } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { IconBadge, iconColor } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";

export default function ComingSoonScreen({ route }: any) {
  const title: string = route?.params?.title || "این بخش";

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} />
      <View style={styles.content}>
        <IconBadge color="purple" size={56}>
          <Sparkles size={26} color={iconColor("purple")} />
        </IconBadge>
        <Text style={styles.title}>{title} به‌زودی</Text>
        <Text style={styles.desc}>
          این بخش تو نسخه‌ی وب کامل پیاده‌سازی شده، و نسخه‌ی موبایلش تو
          مرحله‌ی بعدی ساخته میشه. اگه همین حالا بهش نیاز داری، بگو تا اول
          همین رو کامل کنیم.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  desc: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
  },
});
