import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Bell, CheckCheck, X } from "lucide-react-native";
import api from "../api/client";
import { colors, radius } from "../theme/colors";
import type { AppNotification } from "../types";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  return `${Math.floor(hours / 24)} روز پیش`;
}

export function NotificationBell({
  onNotificationPress,
}: {
  onNotificationPress?: (notification: AppNotification) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get<{ count: number }>(
        "/notifications/unread-count"
      );
      setUnreadCount(data?.count || 0);
    } catch {
      // نادیده گرفتن خطای شمارش
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ notifications: AppNotification[] }>(
        "/notifications"
      );
      setNotifications(data?.notifications || []);
    } catch {
      // نادیده گرفتن خطا
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // نادیده گرفتن خطا
    }
  }

  async function markAllAsRead() {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // نادیده گرفتن خطا
    }
  }

  function handlePress(n: AppNotification) {
    if (!n.read) markAsRead(n._id);
    setOpen(false);
    onNotificationPress?.(n);
  }

  return (
    <>
      <TouchableOpacity style={styles.bellBtn} onPress={() => setOpen(true)}>
        <Bell size={20} color={colors.textSecondary} />
        {unreadCount > 0 && (
          <View style={styles.dot}>
            <Text style={styles.dotText}>
              {unreadCount > 99 ? "+99" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>اعلان‌ها</Text>
              <View style={{ flexDirection: "row-reverse", gap: 14 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    style={{ flexDirection: "row-reverse", gap: 4 }}
                  >
                    <CheckCheck size={14} color={colors.blue} />
                    <Text style={styles.markAll}>خواندن همه</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 30 }} color={colors.accent} />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 420 }}
                ListEmptyComponent={
                  <Text style={styles.empty}>اعلانی وجود ندارد ✨</Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      !item.read && styles.itemUnread,
                    ]}
                    onPress={() => handlePress(item)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        !item.read && { fontWeight: "700" },
                      ]}
                    >
                      {item.message}
                    </Text>
                    <Text style={styles.itemTime}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    padding: 6,
  },
  dot: {
    position: "absolute",
    top: -2,
    left: -4,
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  dotText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 16,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  markAll: {
    color: colors.blue,
    fontSize: 12,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemUnread: {
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  itemText: {
    color: colors.text,
    fontSize: 13,
    textAlign: "right",
  },
  itemTime: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    padding: 24,
  },
});
