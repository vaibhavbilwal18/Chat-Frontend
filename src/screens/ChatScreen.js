import React, { useEffect, useState } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import socket from "../utils/socket.js";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants"; // Make sure this is imported

const ChatScreen = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();
  
  const { targetUserId, firstName, lastName, userId } = route.params;
  
  // Get currentUserId from multiple sources with proper fallback
  const authUserId = useSelector((state) => state.user?.user?.id || state.user?.user?._id);
  const authToken = useSelector((state) => state.auth?.token || state.user?.token);
  const currentUserId = userId || authUserId;

  // Debug logging to help identify the issue
  useEffect(() => {
    console.log("🔍 ChatScreen Debug Info:");
    console.log("  - Route params userId:", userId);
    console.log("  - Auth userId from Redux:", authUserId);
    console.log("  - Final currentUserId:", currentUserId);
    console.log("  - targetUserId:", targetUserId);
    console.log("  - firstName:", firstName);
    console.log("  - lastName:", lastName);
    console.log("  - authToken:", authToken ? "Available" : "Not available");
  }, [userId, authUserId, currentUserId, targetUserId, firstName, lastName, authToken]);

  // Fetch chat history function
  const fetchChatHistory = async () => {
    if (!currentUserId || !targetUserId) {
      console.log("⚠️ Missing user IDs for fetching history");
      setIsLoadingHistory(false);
      return;
    }

    try {
      console.log("📥 Fetching chat history between:", currentUserId, "and", targetUserId);
      setIsLoadingHistory(true);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Only add Authorization header if token exists
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await axios.get(
        `${BASE_URL}/history/${targetUserId}`,
        {
          withCredentials: true,
          headers
        }
      );
      
      console.log("📥 Chat history received:", response.data);
      
      if (response.data && response.data.messages) {
        // Messages are already sorted by timestamp from backend
        setMessages(response.data.messages);
        console.log(`📥 Loaded ${response.data.messages.length} historical messages`);
        
        // Optional: Mark messages as read
        // markMessagesAsRead();
      } else {
        console.log("📥 No chat history found");
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching chat history:", error);
      
      // More detailed error handling
      if (error.response) {
        console.error("Response error:", error.response.data);
        Alert.alert(
          "Error", 
          error.response.data?.error || "Failed to load chat history",
          [{ text: "OK" }]
        );
      } else if (error.request) {
        console.error("Network error:", error.request);
        Alert.alert(
          "Network Error", 
          "Unable to connect to server. Please check your internet connection.",
          [{ text: "OK" }]
        );
      } else {
        console.error("Error:", error.message);
        Alert.alert(
          "Error", 
          "An unexpected error occurred while loading chat history.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  
 
  useEffect(() => {
    if (currentUserId && targetUserId) {
      fetchChatHistory();
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    console.log("🟡 Initializing chat...");
    console.log("🟡 Current User ID:", currentUserId);
    console.log("🟡 Target User ID:", targetUserId);

    // Early validation
    if (!currentUserId) {
      console.error("❌ Current User ID is missing");
      Alert.alert("Authentication Error", "Unable to identify current user. Please log in again.");
      navigation.goBack();
      return;
    }

    if (!targetUserId) {
      console.error("❌ Target User ID is missing");
      Alert.alert("Navigation Error", "Invalid chat target. Please try again.");
      navigation.goBack();
      return;
    }

    if (!socket) {
      console.error("❌ Socket is null or undefined");
      Alert.alert("Connection Error", "Unable to connect to chat server");
      return;
    }

    // Connect to socket
    socket.connect();

    // Event listeners
    socket.on("connect", () => {
      console.log("✅ Connected to socket server:", socket.id);
      setIsConnected(true);
      
      // Join the chat room after connecting
      const joinData = {
        firstName,
        userId: currentUserId,
        targetUserId
      };
      
      console.log("🏠 Joining chat room with data:", joinData);
      socket.emit("joinChat", joinData);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket server");
      setIsConnected(false);
    });

    // Listen for incoming messages (ONLY from server, not local)
    socket.on("messageReceived", (message) => {
      console.log("📨 Received message from server:", message);
      
      // Create a properly formatted message object
      const formattedMessage = {
        id: message.id || message._id || Date.now() + Math.random(),
        text: message.text || message.message,
        senderId: message.senderId,
        firstName: message.firstName || message.senderName,
        lastName: message.lastName || message.senderLastName || '',
        timestamp: message.timestamp || new Date().toISOString(),
        isRead: message.isRead || false,
        status: message.status || 'delivered'
      };
      
      // Only add if it's not from current user (to avoid duplicates)
      if (formattedMessage.senderId !== currentUserId) {
        setMessages(prev => [...prev, formattedMessage]);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setIsConnected(false);
    });

    return () => {
      console.log("🧹 Cleaning up socket listeners and disconnecting");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("messageReceived");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [currentUserId, targetUserId, firstName, navigation]);

  const sendMessage = () => {
    if (!text.trim()) {
      console.log("⚠️ Message is empty, not sending");
      return;
    }

    if (!isConnected) {
      console.log("⚠️ Not connected to server");
      Alert.alert("Connection Error", "Not connected to chat server");
      return;
    }

    if (!currentUserId) {
      console.error("❌ Cannot send message: currentUserId is missing");
      Alert.alert("Authentication Error", "Unable to send message. Please log in again.");
      return;
    }

    const messageData = {
      firstName,
      lastName,
      userId: currentUserId,
      targetUserId,
      text: text.trim(),
    };
    
    console.log("📤 Sending message with data:", messageData);
    
    // Validate message data before sending
    if (!messageData.userId || !messageData.targetUserId) {
      console.error("❌ Invalid message data:", messageData);
      Alert.alert("Error", "Unable to send message due to missing user information");
      return;
    }
    
    // Add message to local state immediately (for sender's view)
    const localMessage = {
      id: Date.now() + Math.random(),
      firstName,
      lastName,
      text: text.trim(),
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'sent'
    };
    
    setMessages(prev => [...prev, localMessage]);
    
    // Send to server
    socket.emit("sendMessage", messageData);
    setText(""); // Clear input after sending
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.senderId === currentUserId ? styles.myMessage : styles.otherMessage
    ]}>
      <Text style={[
        styles.senderName,
        item.senderId === currentUserId ? styles.myMessageText : styles.otherMessageText
      ]}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={[
        styles.messageText,
        item.senderId === currentUserId ? styles.myMessageText : styles.otherMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.timestamp,
        item.senderId === currentUserId ? styles.myMessageText : styles.otherMessageText
      ]}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  // Show loading state if currentUserId is not available or loading history
  if (!currentUserId || isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {!currentUserId ? "Loading user information..." : "Loading chat history..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.connectionStatus}>
            {isConnected ? "🟢 Online" : "🔴 Connecting..."}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        {messages.length === 0 && !isLoadingHistory ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id?.toString() || item._id?.toString() || Math.random().toString()}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            inverted={false}
            onContentSizeChange={() => {
              // Auto scroll to bottom when new message arrives
            }}
          />
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              style={styles.textInput}
              multiline
              maxLength={500}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!text.trim() || !isConnected) && styles.sendButtonDisabled
              ]} 
              onPress={sendMessage}
              disabled={!text.trim() || !isConnected}
            >
              <Text style={[
                styles.sendButtonText,
                (!text.trim() || !isConnected) && styles.sendButtonTextDisabled
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
});

export default ChatScreen;