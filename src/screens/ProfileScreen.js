import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { setUser, clearUser } from '../utils/userSlice';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  // Get user data from route params and Redux store
  const { user: routeUser, isCurrentUser = true } = route.params || {};
  const currentUserFromStore = useSelector((state) => state.user?.user);
  const isAuthenticated = useSelector((state) => state.user?.isAuthenticated);
  
  // Debug logs
  console.log('Route params:', route.params);
  console.log('Current user from store:', currentUserFromStore);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Route user:', routeUser);

  const user = routeUser || currentUserFromStore;

  // Local state for current user data (for immediate UI updates)
  const [currentUser, setCurrentUser] = useState(user);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  
  // Form state for editable fields
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    about: '',
    gender: '',
    photoUrl: '',
  });

  // Fetch current user profile if not available
  const fetchCurrentUserProfile = async () => {
    if (!currentUser && isAuthenticated) {
      setIsLoadingProfile(true);
      try {
        const response = await axios.get('http://localhost:7777/profile', {
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if needed
            // 'Authorization': `Bearer ${authToken}`,
          }
        });

        const userData = response.data;
        console.log('Fetched user profile:', userData);
        
        // Update both local state and Redux store
        setCurrentUser(userData);
        dispatch(setUser(userData));
        
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert(
          "Error",
          "Failed to load profile data. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  // Initialize form with user data
  useEffect(() => {
    console.log('User data changed:', user);
    if (user) {
      setCurrentUser(user);
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        about: user.about || '',
        gender: user.gender || '',
        photoUrl: user.photoUrl || user.avatar || '',
      });
    } else {
      // Try to fetch user profile if not available
      fetchCurrentUserProfile();
    }
  }, [user, isAuthenticated]);

  const handleBackPress = () => {
    if (isEditing) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Stay", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive",
            onPress: () => {
              setIsEditing(false);
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    setEditForm({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      about: currentUser?.about || '',
      gender: currentUser?.gender || '',
      photoUrl: currentUser?.photoUrl || currentUser?.avatar || '',
    });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      // Prepare data to send (only non-empty fields)
      const updateData = {};
      Object.keys(editForm).forEach(key => {
        if (editForm[key] && editForm[key].trim() !== '') {
          updateData[key] = editForm[key].trim();
        }
      });

      console.log('Updating profile with data:', updateData);

      const response = await axios.patch('http://localhost:7777/profile/update', updateData, {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${authToken}`,
        }
      });

      const result = response.data;

      // Update local state immediately for UI
      const updatedUser = {
        ...currentUser,
        ...updateData
      };
      
      setCurrentUser(updatedUser);
      
      // Update Redux store
      dispatch(setUser(updatedUser));

      Alert.alert(
        "Success",
        "Profile updated successfully!",
        [{ text: "OK", onPress: () => setIsEditing(false) }]
      );
      
      console.log('Profile updated successfully:', result);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to update profile. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: performLogout
        }
      ]
    );
  };

  const performLogout = async () => {
    setIsLogoutLoading(true);
    
    try {
      await axios.post('http://localhost:7777/logout', {}, {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${authToken}`,
        }
      });

      // Clear user data from Redux store
      dispatch(clearUser());
      
      // Navigate to login screen or app entry point
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // Adjust route name as needed
      });

      console.log('Logout successful');
      
    } catch (error) {
      console.error('Error during logout:', error);
      
      Alert.alert(
        "Logout Error",
        error.response?.data?.message || error.message || "Failed to logout. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderEditableField = (label, field, placeholder, multiline = false) => (
    <View style={styles.editFieldContainer}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.editInput, multiline && styles.multilineInput]}
        value={editForm[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const renderGenderPicker = () => (
    <View style={styles.editFieldContainer}>
      <Text style={styles.editFieldLabel}>Gender</Text>
      <View style={styles.genderContainer}>
        {['Male', 'Female', 'Other'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.genderOption,
              editForm.gender === option && styles.genderOptionSelected
            ]}
            onPress={() => handleInputChange('gender', option)}
          >
            <Text style={[
              styles.genderOptionText,
              editForm.gender === option && styles.genderOptionTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no user data is available
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>User data not available</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchCurrentUserProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isCurrentUser ? 'My Profile' : 'Profile'}
          </Text>
          
          {/* Edit/Save button */}
          {isCurrentUser && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={isEditing ? handleSaveProfile : handleEditPress}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.headerActionText}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          {!isCurrentUser && <View style={styles.headerRightPlaceholder} />}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: (isEditing ? editForm.photoUrl : currentUser?.photoUrl) || 
                     currentUser?.avatar || 
                     'https://via.placeholder.com/150/F0F0F0/919191?text=👤',
              }}
              style={styles.profileImage}
            />
            {isEditing && (
              <Text style={styles.imageHint}>
                Update Photo URL in the form below
              </Text>
            )}
          </View>

          {/* User Information */}
          {!isEditing && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>
                {(currentUser?.firstName && currentUser?.lastName) 
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : currentUser?.firstName || currentUser?.lastName || 'User Name'}
              </Text>
              
              {currentUser?.email && (
                <Text style={styles.userEmail}>
                  {currentUser.email}
                </Text>
              )}
              
              {currentUser?.about && (
                <Text style={styles.userAbout}>
                  {currentUser.about}
                </Text>
              )}
            </View>
          )}

          {/* Edit Form */}
          {isEditing ? (
            <View style={styles.editFormContainer}>
              {renderEditableField('First Name', 'firstName', 'Enter first name')}
              {renderEditableField('Last Name', 'lastName', 'Enter last name')}
              {renderEditableField('About', 'about', 'Tell us about yourself...', true)}
              {renderGenderPicker()}
              {renderEditableField('Photo URL', 'photoUrl', 'Enter photo URL')}
              
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Profile Details */
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Name</Text>
                <Text style={styles.detailValue}>
                  {currentUser?.firstName || currentUser?.name || currentUser?.username || 'Not provided'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Name</Text>
                <Text style={styles.detailValue}>{currentUser?.lastName || 'Not provided'}</Text>
              </View>
              
              {currentUser?.email && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{currentUser.email}</Text>
                </View>
              )}
              
              {currentUser?.gender && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailValue}>{currentUser.gender}</Text>
                </View>
              )}
              
              {/* {currentUser?.phone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{currentUser.phone}</Text>
                </View>
              )} */}

              {/* Debug information (remove in production) */}
              {/* <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>User ID: {currentUser?._id || 'N/A'}</Text>
                <Text style={styles.debugText}>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
                <Text style={styles.debugText}>Route isCurrentUser: {isCurrentUser ? 'Yes' : 'No'}</Text>
              </View> */}
            </View>
          ) 
          
        }

          {/* Logout Button - Only show for current user and not in edit mode */}
          {isCurrentUser && !isEditing && (
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={isLogoutLoading}
                activeOpacity={0.8}
              >
                {isLogoutLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.logoutButtonText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    borderColor: '#FFFFFF',
    borderWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  imageHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  userAbout: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 2,
    textAlign: 'right',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  editFormContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
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
  editFieldContainer: {
    marginBottom: 20,
  },
  editFieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  genderOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  editButtonsContainer: {
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;