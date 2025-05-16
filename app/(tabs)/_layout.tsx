import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return ( 
  <Tabs
  screenOptions={{
    tabBarActiveTintColor: "black",
  }}
  >
    <Tabs.Screen 
      name ="index"
      options={{
        headerTitle:"Flowlyfe",
        tabBarIcon: ({focused, color}) => 
            <Ionicons 
                name={focused ? "home-sharp" : "home-outline" } 
                size={30}
            />,
      }}
    />
    <Tabs.Screen 
        name ="about"
        options={{
          headerTitle:"About Flowlyfe",
          tabBarIcon: ({focused, color}) => 
          <Ionicons
                name={focused ? "help-sharp" : "help-outline" } 
                size={30}
          />,
        }}
    />
     <Tabs.Screen 
        name ="+not-found"
    />
  </Tabs>
  );
}
