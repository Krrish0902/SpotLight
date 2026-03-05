import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { StackHeader } from "../components/ui/stack-header";
import { useAuth } from "../lib/auth-context";

interface Props {
  navigate: (screen: string, params?: any) => void;
}

export default function SettingsScreen({ navigate }: Props) {
  const { signOut } = useAuth();

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeader onBack={() => navigate('profile')} />
      <Text className="text-3xl font-playfair-semibold mb-6 text-black mt-4">Settings</Text>
      
      <TouchableOpacity
        className="p-4 border-y border-neutral-300 active:bg-neutral-100"
        onPress={async () => {
          await signOut();
          navigate('onboarding-start');
        }}
      >
        <Text className="text-lg text-center font-poppins-medium text-red-500">
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
