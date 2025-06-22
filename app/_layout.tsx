import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DataProvider } from "@/context/DataContext";

export default function RootLayout() {
  return ( 
    <DataProvider>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen 
          name ="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="list-categories"
          options={{
            title: "Your Lists"
          }}
        />
        <Stack.Screen
          name ="todo"
        />
        <Stack.Screen
          name ="groceries"
        />
        <Stack.Screen
          name ="expenses"
        />
        <Stack.Screen
          name ="calender"
        />
        <Stack.Screen 
            name ="+not-found"
        />
      </Stack>
    </DataProvider>
  );
}
