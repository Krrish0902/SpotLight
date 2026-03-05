import { Fab } from "../components/ui/fab";
import { StackHeader } from "../components/ui/stack-header";
import { supabase } from "../lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme";

interface Props {
  navigate: (screen: string, data?: any) => void;
  phone: string;
  returnTo?: string;
}

export default function OtpScreen({ navigate, phone, returnTo = 'onboarding-start' }: Props) {
  const [otp, setOtp] = useState("");
  
  const [isPending, setIsPending] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleOtpChange = (text: string) => {
    if (errorText) {
      setErrorText("");
    }
    setOtp(text);
  };

  const isValid = useMemo(() => {
    return otp.length === 6;
  }, [otp]);

  const handleSubmit = async () => {
    setIsPending(true);
    setErrorText("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    setIsPending(false);

    if (error) {
      setErrorText(error.message);
    } else if (data.session) {
      // The context handles auth state changes implicitly.
      // App.tsx effect hook will naturally trigger and navigate to home or wizard.
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StackHeader onBack={() => navigate("phone-auth")} />
      <StatusBar barStyle={"dark-content"} />
      <View className="flex-1 justify-center p-5 pt-8">
        <View className="flex-1">
          <Text className="text-4xl font-playfair-semibold text-black">
            Enter your validation code
          </Text>
          <View className="h-28" />
          <View className="flex-row gap-2 h-16 relative w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                className="border-b-2 border-neutral-300 flex-1 items-center justify-center pointer-events-none"
              >
                <Text className="text-4xl font-poppins-semibold text-black">
                  {otp[index] || ""}
                </Text>
              </View>
            ))}
            
            <TextInput
              className="absolute top-0 left-0 right-0 bottom-0 text-[1px] text-transparent"
              style={
                Platform.OS === "ios" ? {
                  color: 'transparent'
                } : {
                  color: 'transparent'
                }
              }
              selectionColor="transparent"
              keyboardType="numeric"
              textContentType="oneTimeCode"
              autoFocus={true}
              value={otp}
              onChangeText={handleOtpChange}
              maxLength={6}
            />
          </View>
          {!!errorText && (
            <Text className="text-red-500 text-sm text-center mt-4 bg-red-100 p-2 rounded">
              {errorText}
            </Text>
          )}
        </View>
        <View className="items-end pb-8">
          <Fab
            disabled={!isValid || isPending}
            onPress={handleSubmit}
            loading={isPending}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
