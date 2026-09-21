import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Send, ArrowRight, MessageSquare } from "lucide-react-native";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { ScreenHeader } from "../../components/ScreenHeader";

interface Peer {
  _id: string;
  name: string;
  role?: string;
}

interface Conversation {
  user: Peer;
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

interface ChatMessage {
  _id: string;
  body: string;
  createdAt: string;
  sender: { _id: string; name: string };
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MessagingScreen({
  route,
  navigation,
}: {
  route?: { params?: { peerId?: string; peerName?: string } };
  navigation?: any;
}) {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const myId = user?.id;

  const fixedPeerId = route?.params?.peerId;
  const fixedPeerName = route?.params?.peerName;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePeer, setActivePeer] = useState<Peer | null>(
    fixedPeerId
      ? { _id: fixedPeerId, name: fixedPeerName || "مخاطب" }
      : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<FlatList>(null);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConversations(data.conversations || []);
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (peerId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/messages/with/${peerId}`);
      setMessages(data.messages || []);
      if (data.peer) setActivePeer(data.peer);
    } catch (err: any) {
      setError(err?.response?.data?.message || "خطا در بارگذاری پیام‌ها");
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      if (fixedPeerId) {
        loadMessages(fixedPeerId);
      } else if (user?.role === "trainee" && user?.trainer?.id) {
        setActivePeer({
          _id: user.trainer.id,
          name: user.trainer.name || "مربی",
          role: "trainer",
        });
        loadMessages(user.trainer.id);
      }
    }, [loadConversations, loadMessages, fixedPeerId, user])
  );

  useEffect(() => {
    const t = setInterval(() => {
      loadConversations();
      if (activePeer?._id) loadMessages(activePeer._id, true);
    }, 10000);
    return () => clearInterval(t);
  }, [activePeer?._id, loadConversations, loadMessages]);

  async function openChat(peer: Peer) {
    setError("");
    setActivePeer(peer);
    await loadMessages(peer._id);
    loadConversations();
  }

  async function handleSend() {
    const body = text.trim();
    if (!body || !activePeer?._id || sending) return;

    setSending(true);
    setError("");
    try {
      const { data } = await api.post("/messages", {
        recipientId: activePeer._id,
        body,
      });
      setText("");
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        await loadMessages(activePeer._id, true);
      }
      loadConversations();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      setError(err?.response?.data?.message || "ارسال ناموفق بود");
    } finally {
      setSending(false);
    }
  }

  const showSidebar = user?.role === "trainer" && !fixedPeerId;
  const styles = makeStyles(colors, radius);

  if (showSidebar && !activePeer) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="پیام‌رسانی" subtitle="گفتگو با شاگردان" />
        {loadingList ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <MessageSquare size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>هنوز گفتگویی نیست</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.user._id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convRow}
                onPress={() => openChat(item.user)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.convName}>{item.user.name}</Text>
                  <Text style={styles.convPreview} numberOfLines={1}>
                    {item.lastMessage?.body || "هنوز پیامی نیست"}
                  </Text>
                </View>
                {item.unreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={8}
    >
      <View style={styles.chatHeader}>
        {showSidebar ? (
          <TouchableOpacity
            onPress={() => setActivePeer(null)}
            style={styles.backBtn}
          >
            <ArrowRight size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>
            {activePeer?.name || "پیام‌رسانی"}
          </Text>
          <Text style={styles.chatSub}>
            {activePeer?.role === "trainer" ? "مربی" : "شاگرد"}
          </Text>
        </View>
      </View>

      {loadingMsgs ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>هنوز پیامی نیست — اولین را بفرست</Text>
          }
          renderItem={({ item }) => {
            const mine = String(item.sender?._id) === String(myId);
            return (
              <View
                style={[
                  styles.bubbleWrap,
                  mine ? styles.bubbleMine : styles.bubbleOther,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: mine
                        ? colors.accent
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: mine ? "#fff" : colors.text,
                      fontSize: 14,
                      lineHeight: 20,
                      textAlign: "right",
                    }}
                  >
                    {item.body}
                  </Text>
                </View>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.sendBtn, { opacity: sending || !text.trim() ? 0.5 : 1 }]}
          onPress={handleSend}
          disabled={sending || !text.trim()}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="پیامت را بنویس..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={4000}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: any, radius: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    empty: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: {
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 20,
      fontSize: 13,
    },
    convRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    convName: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 14,
      textAlign: "right",
    },
    convPreview: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
      textAlign: "right",
    },
    badge: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      minWidth: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    chatHeader: {
      flexDirection: "row-reverse",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      gap: 10,
    },
    backBtn: { padding: 6 },
    chatTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      textAlign: "right",
    },
    chatSub: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: "right",
    },
    bubbleWrap: { marginBottom: 10, maxWidth: "80%" },
    bubbleMine: { alignSelf: "flex-start" },
    bubbleOther: { alignSelf: "flex-end" },
    bubble: {
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    time: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 3,
    },
    inputRow: {
      flexDirection: "row-reverse",
      alignItems: "flex-end",
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      gap: 8,
    },
    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 120,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      textAlign: "right",
      fontSize: 14,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    error: {
      color: colors.danger,
      fontSize: 12,
      textAlign: "center",
      padding: 6,
    },
  });
}
