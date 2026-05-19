import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View className="items-center justify-center gap-0.5">
      <Text style={{ fontSize: focused ? 24 : 22 }}>{emoji}</Text>
      <Text
        className={`text-xs ${focused ? 'text-primary font-inter-semibold' : 'text-muted font-inter'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Kokpit',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Kokpit" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Faktury',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧾" label="Faktury" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="costs"
        options={{
          title: 'Koszty',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📸" label="Koszty" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Doradca',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🤖" label="Doradca" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
