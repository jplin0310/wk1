import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="pet"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="pet"
        options={{ title: '寵物互動' }}
        initialParams={{ id: '1' }}
      />
      <Stack.Screen
        name="index"
        options={{ title: '我的寵物' }}
      />
    </Stack>
  );
}