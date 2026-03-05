import { VideoBackground } from "../components/ui/video-background";
import { Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function OnboardingStart({ navigate }: Props) {
  return (
    <View className="flex-1">
      <StatusBar barStyle={"light-content"} />
      <VideoBackground source={require("../assets/images/background.mp4")}>
        <SafeAreaView className="flex-1 p-10">
          <View className="items-center pt-14">
            <Text className="text-white text-5xl font-playfair-semibold text-center mt-8 mb-2">
              Spotlight
            </Text>
            <Text className="text-white text-xl font-poppins-regular text-center">
              Discover. Book. Perform.
            </Text>
          </View>

          <View className="flex-1 justify-end pb-12 gap-5">
            <Pressable
              onPress={() => navigate('auth-options', { mode: 'signup' })}
              className="bg-white h-14 items-center justify-center rounded-full"
            >
              <Text className="text-black text-lg font-poppins-bold">
                Create Account
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigate('auth-options', { mode: 'signin' })}
              className="bg-transparent h-14 items-center justify-center rounded-full border-2 border-white"
            >
              <Text className="text-white text-lg font-poppins-bold">
                Sign In
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </VideoBackground>
    </View>
  );
}
