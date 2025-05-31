import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';
import { useDispatch } from 'react-redux';
import { setUser } from '../utils/userSlice';

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [email, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true); 

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/login`,
        { email, password },
        { withCredentials: true }
      );

      const userData = res.data.user;

      // Set user in Redux
      dispatch(setUser({
        _id: userData._id,
        fullName: userData.firstName + ' ' + userData.lastName,
        photoUrl: userData.photoUrl || '',
        email: userData.email,
      }));

      navigation.replace('Home');
    } catch (err) {
      console.error('Login error:', err.message, err.response?.data);
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/signup`,
        { email, password, firstName, lastName },
        { withCredentials: true }
      );
      navigation.replace('Home');
    } catch (err) {
      console.error('Register error:', err, err.response);
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {!isLoginMode && (
              <>
                <TextInput
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  autoCapitalize="words"
                />
                <TextInput
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </>
            )}

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmailId}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />

            {loading ? (
              <ActivityIndicator size="large" color="#4a90e2" style={styles.loadingIndicator} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={isLoginMode ? handleLogin : handleRegister}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {isLoginMode ? 'Login' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsLoginMode(!isLoginMode);
                    setError(null);
                  }}
                  style={{ marginTop: 15 }}
                >
                  <Text style={{ color: '#4a90e2', textAlign: 'center' }}>
                    {isLoginMode
                      ? "Don't have an account? Sign Up"
                      : 'Already have an account? Login'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fefefe',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 10,
  },
});
