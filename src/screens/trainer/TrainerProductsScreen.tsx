import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Switch } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ShoppingBag, Plus, Trash2 } from "lucide-react-native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, Badge, IconBadge, iconColor, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { StoreProduct } from "../../types";

export default function TrainerProductsScreen() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [priceToman, setPriceToman] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/products/my-products");
      setProducts(data.products || []);
    } catch {
      // نادیده گرفتن خطا
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function createProduct() {
    if (!name.trim() || !priceToman.trim() || !stock.trim()) {
      Alert.alert("خطا", "نام، قیمت و موجودی رو پر کن");
      return;
    }
    setSaving(true);
    try {
      await api.post("/products", {
        name: name.trim(),
        description: description.trim() || undefined,
        category: "protein",
        priceToman: Number(priceToman),
        stock: Number(stock),
      });
      setName("");
      setPriceToman("");
      setStock("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "ثبت محصول ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: StoreProduct) {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive,
      });
      load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "به‌روزرسانی ناموفق بود");
    }
  }

  function confirmDelete(product: StoreProduct) {
    Alert.alert("حذف محصول", `«${product.name}» حذف بشه؟`, [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/products/${product._id}`);
            load();
          } catch (err: any) {
            Alert.alert("خطا", err?.response?.data?.message || "حذف ناموفق بود");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="محصولات فروشگاه" subtitle="مدیریت مکمل‌ها و محصولاتی که می‌فروشی" />

      <View style={styles.body}>
        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="orange">
              <ShoppingBag size={18} color={iconColor("orange")} />
            </IconBadge>
            <Text style={styles.cardTitle}>محصولات من</Text>
            <Button
              title={showForm ? "بستن" : "افزودن"}
              icon={!showForm ? <Plus size={14} color="#fff" /> : undefined}
              onPress={() => setShowForm((s) => !s)}
              variant={showForm ? "secondary" : "primary"}
            />
          </View>

          {showForm && (
            <View style={styles.form}>
              <FormField label="نام محصول" value={name} onChangeText={setName} />
              <View style={{ flexDirection: "row-reverse", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="قیمت (تومان)"
                    keyboardType="number-pad"
                    value={priceToman}
                    onChangeText={setPriceToman}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="موجودی"
                    keyboardType="number-pad"
                    value={stock}
                    onChangeText={setStock}
                  />
                </View>
              </View>
              <FormField
                label="توضیحات (اختیاری)"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Button
                title={saving ? "در حال ثبت..." : "ثبت محصول"}
                onPress={createProduct}
                loading={saving}
                fullWidth
              />
            </View>
          )}

          {!loaded ? (
            <EmptyState text="در حال بارگذاری..." />
          ) : products.length === 0 ? (
            <EmptyState text="هنوز محصولی اضافه نکردی." />
          ) : (
            <View style={{ gap: 10, marginTop: showForm ? 16 : 0 }}>
              {products.map((p) => (
                <View key={p._id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 4 }}>
                      <Text style={styles.productMeta}>
                        {p.priceToman.toLocaleString("fa-IR")} تومان
                      </Text>
                      <Badge label={`موجودی: ${p.stock}`} color="blue" />
                    </View>
                  </View>

                  <Switch
                    value={p.isActive}
                    onValueChange={() => toggleActive(p)}
                    trackColor={{ false: colors.border, true: colors.success }}
                  />

                  <Button
                    title=""
                    icon={<Trash2 size={14} color="#fff" />}
                    onPress={() => confirmDelete(p)}
                    variant="danger"
                    style={styles.deleteBtn}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingTop: 0 },
  sectionHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  form: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  productRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
  },
  productName: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  productMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
