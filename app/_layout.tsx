import { Stack } from "expo-router";

// LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return ( 
  <Stack>
    <Stack.Screen 
      name ="(tabs)"
      options={{
        headerShown: false,
      }}
    />
     <Stack.Screen 
        name ="+not-found"
    />
  </Stack>
  );
}
