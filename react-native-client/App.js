import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createNativeStackNavigator();

// Socket Config
// Must match API URL
const SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
});

export default function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      // Initialize Socket on Login
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      newSocket.emit('join', user.id);

      return () => newSocket.disconnect();
    }
  }, [user]);

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLogin={setUser} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {props => <RegisterScreen {...props} onLogin={setUser} />}
            </Stack.Screen>
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Home" initialParams={{ user, socket }}>
              {props => <HomeScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, headerBackTitle: 'Back' }}
            />
            {/* Add SearchScreen here if implemented */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
