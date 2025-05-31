import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  Alert, // Add this import
} from 'react-native';
import { fetchUsers } from '../utils/usersSlice'; 
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatHome = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { users, loading, error } = useSelector((state) => state.users);

  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced debugging for Redux state
  const userState = useSelector((state) => state.user); // Changed from 'auth' to 'user'
  const currentUserId = useSelector((state) => state.user?.user?.id || state.user?.user?._id);

  // Debug logging
  useEffect(() => {
    console.log("🔍 ChatHome - User State Debug:");
    console.log("  - Full user state:", JSON.stringify(userState, null, 2));
    console.log("  - currentUserId:", currentUserId);
    console.log("  - state.user:", userState);
    console.log("  - state.user.user:", userState?.user);
    console.log("  - state.user.user?.id:", userState?.user?.id);
    console.log("  - state.user.user?._id:", userState?.user?._id);
  }, [userState, currentUserId]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users; // If no search query, return all users
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(lowerCaseQuery);
    });
  }, [users, searchQuery]);
 
  const handleChatOpen = (user) => {
    console.log("🔍 ChatHome Debug - Opening chat with:");
    console.log("  - currentUserId:", currentUserId);
    console.log("  - targetUserId:", user._id);
    console.log("  - user:", user);
    console.log("  - Full user state at chat open:", JSON.stringify(userState, null, 2));
    
    // Try different ways to get the user ID based on your actual store structure
    const possibleUserIds = [
      userState?.user?.id,
      userState?.user?._id,
      userState?.id,
      userState?._id
    ];
    
    console.log("  - Possible user IDs:", possibleUserIds);
    
    // Find the first valid ID
    const validUserId = possibleUserIds.find(id => id && id !== undefined && id !== null);
    
    console.log("  - Valid user ID found:", validUserId);
    
    if (!validUserId) {
      console.log("❌ No valid user ID found in any location");
      Alert.alert(
        "Authentication Error", 
        "Unable to find your user ID. Please try logging out and logging back in.",
        [
          { text: "OK", style: "default" }
        ]
      );
      return;
    }
    
    navigation.navigate('ChatScreen', { 
      targetUserId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.avatar,  
      userId: validUserId, // Use the found valid ID
    });
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleChatOpen(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: item.avatar || 'https://via.placeholder.com/150/F0F0F0/919191?text=👤',
        }}
        style={styles.avatar}
      />
      <View style={styles.userDetails}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.firstName} {item.lastName}
        </Text>
      </View>
      <View style={styles.statusDot} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Chats X</Text>

        <TextInput
          style={styles.searchBar}
          placeholder="Search by name..."
          placeholderTextColor="#888888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && filteredUsers.length > 0 && (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!loading && !error && filteredUsers.length === 0 && searchQuery !== '' && (
          <Text style={styles.noUsersText}>No matching users found for "{searchQuery}".</Text>
        )}

        {!loading && !error && users.length === 0 && searchQuery === '' && (
          <Text style={styles.noUsersText}>No users found.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  searchBar: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333333',
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingIndicator: {
    marginTop: 30,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E0E0E0',
    borderColor: '#F0F0F0',
    borderWidth: 1,
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
  },
  userEmail: {
    fontSize: 13,
    color: '#888888',
    marginTop: 3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 15,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  noUsersText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#AAAAAA',
    fontSize: 16,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});

export default ChatHome;