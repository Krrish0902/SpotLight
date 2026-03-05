import React from "react";
import { Text, View } from "react-native";
import { StackHeader } from "../components/ui/stack-header";

interface Props {
  navigate: (screen: string, params?: any) => void;
}

export default function PreferencesScreen({ navigate }: Props) {
  return (
    <View className="flex-1 bg-white p-5">
      <StackHeader onBack={() => navigate('profile')} />
      <Text className="text-3xl font-playfair-semibold mb-6 text-black mt-4">Discovery Preferences</Text>
      
      <View className="py-5">
        <Text className="text-base font-poppins-regular text-neutral-500">
          Discovery preferences coming soon. Artists will be shown based on your
          location and genre interests.
        </Text>
      </View>
    </View>
  );
}
