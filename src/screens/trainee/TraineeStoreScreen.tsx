import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { ShoppingBag, Package, Tag, Minus, Plus, Trash2, Dumbbell } from "lucide-react-native";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme/colors";
import { Card, IconBadge, Badge, EmptyState, iconColor } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { StoreProduct, CartItem, StoreOrder } from "../../types";

interface PlanPackage {
  _id: string;
  type: "workout" | "meal" | "bundle";
  title: string;
  description?: string;
  durationWeeks: number;
  priceToman: number;
}

interface ProgramRequest {
  _id: string;
  type: "workout" | "workout_meal";
  status: string;
  priceToman: number;
}

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  workout: "فقط تمرینی",
  meal: "فقط غذایی",
  bundle: "تمرینی + غذایی",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  assigned: "در صف بررسی",
  in_progress: "در حال ساخت",
  completed: "تکمیل‌شده",
  cancelled: "لغو‌شده",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  preparing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  payment_failed: "پرداخت ناموفق",
  cancelled: "لغو‌شده",
};

export default function TraineeStoreScreen() {
  const { user } = useAuth();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [packages, setPackages] = useState<PlanPackage[]>([]);
  const [myRequests, setMyRequests] = useState<ProgramRequest[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.trainer) return;
    try {
      const [productsRes, ordersRes, packagesRes, requestsRes] = await Promise.all([
        api
          .get(`/products/store/${user.trainer.id}`)
          .catch(() => ({ data: { products: [] } })),
        api.get("/orders/mine").catch(() => ({ data: { orders: [] } })),
        api
          .get(`/plan-packages/trainer/${user.trainer.id}`)
          .catch(() => ({ data: { packages: [] } })),
        api
          .get("/program-requests/my-requests")
          .catch(() => ({ data: { requests: [] } })),
      ]);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setPackages(packagesRes.data.packages || []);
      setMyRequests(requestsRes.data.requests || []);
    } catch {
      // نادیده گرفتن خطا
    }
  }, [user?.trainer]);

  async function buyPackage(pkg: PlanPackage) {
    setBuyingId(pkg._id);
    try {
      const { data } = await api.post("/program-requests", {
        planPackageId: pkg._id,
      });
      if (data.paymentUrl) {
        await Linking.openURL(data.paymentUrl);
      }
      load();
    } catch (err: any) {
      Alert.alert(
        "خطا",
        err?.response?.data?.message || "ثبت درخواست خرید ناموفق بود"
      );
    } finally {
      setBuyingId(null);
    }
  }


  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function addToCart(product: StoreProduct) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        return prev.map((c) =>
          c.product._id === product._id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product._id === productId
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
    setCouponResult(null);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product._id !== productId));
    setCouponResult(null);
  }

  const cartTotal = cart.reduce(
    (sum, c) => sum + c.product.priceToman * c.quantity,
    0
  );

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await api.post("/coupons/validate", {
        code: couponCode.trim(),
        subtotalToman: cartTotal,
      });
      setCouponResult(data);
    } catch (err: any) {
      setCouponResult({
        valid: false,
        message: err?.response?.data?.message || "کد تخفیف نامعتبر است",
      });
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function checkout() {
    if (cart.length === 0) {
      Alert.alert("سبد خرید خالی است");
      return;
    }
    if (!shippingAddress.trim()) {
      Alert.alert("آدرس ارسال را وارد کن");
      return;
    }
    setCheckingOut(true);
    try {
      const { data } = await api.post("/orders", {
        items: cart.map((c) => ({
          productId: c.product._id,
          quantity: c.quantity,
        })),
        shippingAddress,
        couponCode: couponResult?.valid ? couponCode.trim() : undefined,
      });

      setCart([]);
      setCouponResult(null);
      setCouponCode("");
      load();

      if (data.paymentUrl) {
        await Linking.openURL(data.paymentUrl);
      }
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "خطا در ثبت سفارش");
    } finally {
      setCheckingOut(false);
    }
  }

  if (!user?.trainer) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="فروشگاه" />
        <EmptyState text="برای دیدن فروشگاه، اول باید به یک مربی وصل بشی." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader title="فروشگاه مکمل مربی" />

      <View style={styles.body}>
        {packages.length > 0 && (
          <Card>
            <View style={styles.sectionHead}>
              <IconBadge color="purple">
                <Dumbbell size={18} color={iconColor("purple")} />
              </IconBadge>
              <Text style={styles.cardTitle}>خرید برنامه تمرینی/غذایی</Text>
            </View>

            <View style={{ gap: 10 }}>
              {packages.map((pkg) => (
                <View key={pkg._id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{pkg.title}</Text>
                    {pkg.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>
                        {pkg.description}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 6 }}>
                      <Badge label={PACKAGE_TYPE_LABELS[pkg.type]} color="blue" />
                      <Text style={styles.productPrice}>
                        {pkg.priceToman.toLocaleString("fa-IR")} تومان ·{" "}
                        {pkg.durationWeeks} هفته
                      </Text>
                    </View>
                  </View>
                  <Button
                    title="خرید"
                    onPress={() => buyPackage(pkg)}
                    loading={buyingId === pkg._id}
                  />
                </View>
              ))}
            </View>

            {myRequests.length > 0 && (
              <View style={{ marginTop: 14, gap: 8 }}>
                {myRequests.map((req) => (
                  <View key={req._id} style={styles.orderRow}>
                    <Text style={styles.productPrice}>
                      {req.type === "workout" ? "برنامه تمرینی" : "تمرین + تغذیه"}
                    </Text>
                    <Badge
                      label={REQUEST_STATUS_LABELS[req.status] || req.status}
                      color="purple"
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="orange">
              <ShoppingBag size={18} color={iconColor("orange")} />
            </IconBadge>
            <Text style={styles.cardTitle}>محصولات</Text>
          </View>

          {products.length === 0 ? (
            <EmptyState text="مربی‌ت هنوز محصولی به فروشگاهش اضافه نکرده." />
          ) : (
            <View style={{ gap: 10 }}>
              {products.map((p) => (
                <View key={p._id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    {p.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>
                        {p.description}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 6 }}>
                      <Text style={styles.productPrice}>
                        {p.priceToman.toLocaleString("fa-IR")} تومان
                      </Text>
                      <Badge
                        label={p.stock === 0 ? "ناموجود" : `موجودی: ${p.stock}`}
                        color={p.stock === 0 ? "purple" : "green"}
                      />
                    </View>
                  </View>
                  <Button
                    title={p.stock === 0 ? "ناموجود" : "افزودن"}
                    onPress={() => addToCart(p)}
                    disabled={p.stock === 0}
                    variant="secondary"
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {cart.length > 0 && (
          <Card>
            <Text style={styles.cardTitle}>سبد خرید</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {cart.map((c) => (
                <View key={c.product._id} style={styles.cartRow}>
                  <Text style={styles.cartName} numberOfLines={1}>
                    {c.product.name}
                  </Text>
                  <View style={styles.qtyControls}>
                    <Button
                      title=""
                      icon={<Minus size={14} color={colors.text} />}
                      onPress={() => changeQuantity(c.product._id, -1)}
                      variant="secondary"
                      style={styles.qtyBtn}
                    />
                    <Text style={styles.qtyText}>{c.quantity}</Text>
                    <Button
                      title=""
                      icon={<Plus size={14} color={colors.text} />}
                      onPress={() => changeQuantity(c.product._id, 1)}
                      variant="secondary"
                      style={styles.qtyBtn}
                    />
                  </View>
                  <Text style={styles.cartPrice}>
                    {(c.product.priceToman * c.quantity).toLocaleString("fa-IR")} ت
                  </Text>
                  <Button
                    title=""
                    icon={<Trash2 size={14} color="#fff" />}
                    onPress={() => removeFromCart(c.product._id)}
                    variant="danger"
                    style={styles.qtyBtn}
                  />
                </View>
              ))}
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>جمع کل</Text>
              <Text style={styles.summaryValue}>
                {cartTotal.toLocaleString("fa-IR")} تومان
              </Text>
            </View>

            <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="کد تخفیف (اختیاری)"
                  placeholder="مثلا WELCOME5"
                  value={couponCode}
                  onChangeText={(t) => setCouponCode(t.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
              <Button
                title="اعمال"
                icon={<Tag size={14} color="#fff" />}
                onPress={applyCoupon}
                loading={applyingCoupon}
                variant="secondary"
                style={{ marginTop: 4 }}
              />
            </View>

            {couponResult && !couponResult.valid && (
              <Text style={styles.errorText}>{couponResult.message}</Text>
            )}
            {couponResult && couponResult.valid && (
              <View style={styles.couponBox}>
                <Text style={styles.couponLine}>
                  تخفیف: −{couponResult.discountToman?.toLocaleString("fa-IR")} تومان
                </Text>
                <Text style={[styles.couponLine, { fontWeight: "700" }]}>
                  مبلغ نهایی: {couponResult.finalToman?.toLocaleString("fa-IR")} تومان
                </Text>
              </View>
            )}

            <FormField
              label="آدرس ارسال"
              placeholder="آدرس کامل پستی..."
              value={shippingAddress}
              onChangeText={setShippingAddress}
              multiline
            />

            <Button
              title={checkingOut ? "در حال انتقال..." : "پرداخت و ثبت سفارش"}
              onPress={checkout}
              loading={checkingOut}
              fullWidth
            />
          </Card>
        )}

        {orders.length > 0 && (
          <Card>
            <View style={styles.sectionHead}>
              <IconBadge color="orange">
                <Package size={18} color={iconColor("orange")} />
              </IconBadge>
              <Text style={styles.cardTitle}>سفارش‌های من</Text>
            </View>
            <View style={{ gap: 10 }}>
              {orders.map((o) => (
                <View key={o._id} style={styles.orderRow}>
                  <Text style={styles.orderPrice}>
                    {o.totalToman.toLocaleString("fa-IR")} تومان
                  </Text>
                  <Badge label={STATUS_LABELS[o.status] || o.status} color="purple" />
                </View>
              ))}
            </View>
          </Card>
        )}
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
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
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
  productDesc: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: "right",
    marginTop: 2,
  },
  productPrice: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cartRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  cartName: {
    flex: 1,
    color: colors.text,
    fontSize: 12.5,
    textAlign: "right",
  },
  qtyControls: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  qtyText: {
    color: colors.text,
    fontSize: 13,
    minWidth: 18,
    textAlign: "center",
  },
  cartPrice: {
    color: colors.textSecondary,
    fontSize: 11.5,
    minWidth: 70,
    textAlign: "left",
  },
  summaryLine: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },
  couponBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 8,
    gap: 4,
  },
  couponLine: {
    color: colors.success,
    fontSize: 12,
    textAlign: "right",
  },
  orderRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 10,
  },
  orderPrice: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "700",
  },
});
