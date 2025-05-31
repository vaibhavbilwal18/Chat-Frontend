// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   StyleSheet,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { useRoute, useNavigation } from "@react-navigation/native";
// import { createSocketConnection } from "../utils/socket";
// import { useSelector } from "react-redux";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";

// const Chat = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { targetUserId } = route.params;
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const user = useSelector((store) => store.user);
//   const userId = user?._id;
//   const socketRef = useRef(null);

//   const firstName = route.params?.firstName || "";
//   const lastName = route.params?.lastName || "";
//   const targetUserName = `${firstName} ${lastName}`.trim() || "User";
 
//   const targetUserPhotoUrl =
//     route.params?.photoUrl ||
//     "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

//   const fetchChatMessages = async () => {
//     try {
//       const chat = await axios.get(BASE_URL + "/chat/" + targetUserId, {
//         withCredentials: true,
//       });

//       const chatMessages = chat?.data?.messages?.map((msg) => {
//         const { senderId, text, createdAt } = msg;
//         return {
//           firstName: senderId?.firstName,
//           lastName: senderId?.lastName,
//           text,
//           timestamp: createdAt,
//         };
//       }) || [];
      
//       setMessages(chatMessages);
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//       setMessages([]);
//     }
//   };

//   useEffect(() => {
//     fetchChatMessages();
//   }, [targetUserId]);

//   useEffect(() => {
//     if (!userId) return;

//     const socket = createSocketConnection();
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("Socket connected");
//       setIsSocketConnected(true);
      
//       // Join chat room after connection is established
//       socket.emit("joinChat", {
//         firstName: user.firstName,
//         userId,
//         targetUserId,
//       });
//     });

//     socket.on("disconnect", () => {
//       console.log("Socket disconnected");
//       setIsSocketConnected(false);
//     });

//     socket.on("messageReceived", ({ firstName, lastName, text, createdAt }) => {
//       console.log("Message received:", { firstName, lastName, text, createdAt });
      
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { firstName, lastName, text, timestamp: createdAt },
//       ]);
//     });

//     // Initial join if already connected
//     if (socket.connected) {
//       setIsSocketConnected(true);
//       socket.emit("joinChat", {
//         firstName: user.firstName,
//         userId,
//         targetUserId,
//       });
//     }

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//       setIsSocketConnected(false);
//     };
//   }, [userId, targetUserId, user.firstName]);

//   const sendMessage = () => {
//     if (!newMessage.trim()) {
//       console.log("Cannot send empty message");
//       return;
//     }

//     const timestamp = new Date().toISOString();
//     const messageToSend = newMessage.trim();
    
//     // Add message optimistically to UI immediately
//     const optimisticMessage = {
//       firstName: user.firstName,
//       lastName: user.lastName,
//       text: messageToSend,
//       timestamp: timestamp,
//     };
    
//     setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
//     setNewMessage("");

//     console.log("Sending message:", {
//       firstName: user.firstName,
//       lastName: user.lastName,
//       userId,
//       targetUserId,
//       text: messageToSend,
//       timestamp,
//     });

//     // Send message through socket if connected, otherwise just show in UI
//     if (socketRef.current) {
//       socketRef.current.emit("sendMessage", {
//         firstName: user.firstName,
//         lastName: user.lastName,
//         userId,
//         targetUserId,
//         text: messageToSend,
//         timestamp,
//       });
//     } else {
//       console.log("Socket not available, message shown locally only");
//     }
//   };

//   const formatTimestamp = (timestamp) => {
//     if (!timestamp) return "";
//     const date = new Date(timestamp);
//     return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
//   };

//   const handleBackPress = () => {
//     navigation.goBack();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView 
//         style={styles.keyboardAvoidingView}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
//             <Text style={styles.backButtonText}>←</Text>
//           </TouchableOpacity>
//           <Image
//             source={{ uri: targetUserPhotoUrl }}
//             style={styles.profileImage}
//           />
//           <Text style={styles.headerTitle}>{targetUserName}</Text>
//           {/* Connection status indicator */}
//           <View style={[
//             styles.statusDot, 
//             { backgroundColor: isSocketConnected ? '#4CAF50' : '#f44336' }
//           ]} />
//         </View>

//         {/* Messages Container */}
//         <ScrollView 
//           style={styles.messagesContainer}
//           contentContainerStyle={styles.messagesContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {messages.map((msg, index) => {
//             const isMyMessage = user.firstName === msg.firstName;
//             return (
//               <View
//                 key={index}
//                 style={[
//                   styles.messageWrapper,
//                   isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper
//                 ]}
//               >
//                 <View style={[
//                   styles.messageBubble,
//                   isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
//                 ]}>
//                   <Text style={[
//                     styles.messageText,
//                     isMyMessage ? styles.myMessageText : styles.theirMessageText
//                   ]}>
//                     {msg.text}
//                   </Text>
//                   <Text style={[
//                     styles.timestampText,
//                     isMyMessage ? styles.myTimestampText : styles.theirTimestampText
//                   ]}>
//                     {formatTimestamp(msg.timestamp)}
//                   </Text>
//                 </View>
//               </View>
//             );
//           })}
//         </ScrollView>

//         {/* Input Container */}
//         <View style={styles.inputContainer}>
//           <TextInput
//             value={newMessage}
//             onChangeText={setNewMessage}
//             style={styles.textInput}
//             placeholder="Type a message..."
//             placeholderTextColor="#999"
//             multiline
//             maxLength={1000}
//           />
//           <TouchableOpacity 
//             onPress={sendMessage} 
//             style={[
//               styles.sendButton,
//               !newMessage.trim() && styles.sendButtonDisabled
//             ]}
//             disabled={!newMessage.trim()}
//           >
//             <Text style={styles.sendButtonText}>Send</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#666',
//     gap: 16,
//   },
//   backButton: {
//     paddingRight: 8,
//   },
//   backButtonText: {
//     fontSize: 24,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   profileImage: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#000',
//     flex: 1,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },
//   messagesContainer: {
//     flex: 1,
//     paddingHorizontal: 8,
//   },
//   messagesContent: {
//     paddingVertical: 8,
//   },
//   messageWrapper: {
//     marginVertical: 4,
//   },
//   myMessageWrapper: {
//     alignItems: 'flex-end',
//   },
//   theirMessageWrapper: {
//     alignItems: 'flex-start',
//   },
//   messageBubble: {
//     maxWidth: '80%',
//     padding: 12,
//     borderRadius: 18,
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     justifyContent: 'space-between',
//   },
//   myMessageBubble: {
//     backgroundColor: '#007AFF',
//     borderBottomRightRadius: 4,
//   },
//   theirMessageBubble: {
//     backgroundColor: '#E5E5EA',
//     borderBottomLeftRadius: 4,
//   },
//   messageText: {
//     fontSize: 16,
//     flex: 1,
//     marginRight: 8,
//   },
//   myMessageText: {
//     color: '#fff',
//   },
//   theirMessageText: {
//     color: '#000',
//   },
//   timestampText: {
//     fontSize: 12,
//     opacity: 0.7,
//   },
//   myTimestampText: {
//     color: '#fff',
//   },
//   theirTimestampText: {
//     color: '#000',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#666',
//     gap: 8,
//   },
//   textInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#666',
//     color: '#000',
//     borderRadius: 8,
//     padding: 8,
//     maxHeight: 100,
//     fontSize: 16,
//   },
//   sendButton: {
//     backgroundColor: '#6366f1',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   sendButtonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   sendButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '500',
//   },
// });

// export default Chat;import React, { useEffect, useState } from "react";
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
  Alert
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import socket from "../utils/socket.js";
import { useSelector } from "react-redux";

const ChatScreen = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  
  const { targetUserId, firstName, lastName, userId } = route.params;
  
  // Get currentUserId from multiple sources with proper fallback
  const authUserId = useSelector((state) => state.user?.user?.id || state.user?.user?._id);
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
  }, [userId, authUserId, currentUserId, targetUserId, firstName, lastName]);

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
      // Only add if it's not from current user (to avoid duplicates)
      if (message.senderId !== currentUserId) {
        setMessages(prev => [...prev, {
          ...message,
          id: Date.now() + Math.random() // Add unique ID
        }]);
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
      userId: currentUserId, // Make sure this is not undefined
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
      firstName,
      lastName,
      text: text.trim(),
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
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

  // Show loading state if currentUserId is not available
  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user information...</Text>
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
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() => {
            // Auto scroll to bottom when new message arrives
          }}
        />

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