import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="login" />
        <Stack.Screen
          name="change-password"
          options={{ animation: 'slide_from_right', gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}