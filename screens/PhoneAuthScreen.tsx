import { Fab } from "../components/ui/fab";
import { StackHeader } from "../components/ui/stack-header";
import { supabase } from "../lib/supabase";
import { useEffect, useMemo, useRef, useState } from "react";
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
  returnTo?: string;
}

export default function PhoneAuthScreen({ navigate, returnTo = 'onboarding-start' }: Props) {
  const [phone, setPhone] = useState("");
  const phoneRef = useRef<TextInput>(null);
  
  const [isPending, setIsPending] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handlePhoneChange = (text: string) => {
    if (errorText) {
      setErrorText("");
    }
    setPhone(text);
  };

  const formattedPhone = `+91${phone}`;

  const isValid = useMemo(() => {
    return /^\+[1-9]\d{1,14}$/.test(formattedPhone);
  }, [formattedPhone]);

  const handleSubmit = async () => {
    setIsPending(true);
    setErrorText("");
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    setIsPending(false);
    
    if (error) {
      setErrorText(error.message);
    } else {
      navigate("otp-auth", { phone: formattedPhone, returnTo });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      phoneRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StackHeader onBack={() => navigate(returnTo)} />
      <StatusBar barStyle={"dark-content"} />
      <View className="flex-1 justify-center p-5 pt-8">
        <View className="flex-1">
          <Text className="text-4xl font-playfair-semibold">
            What's your phone number?
          </Text>
          <View className="h-28" />
          <View className="flex-row items-center border-b h-16 border-neutral-300">
            <Text 
              className="text-4xl font-poppins-semibold mr-2 text-black"
              style={
                Platform.OS === "ios" && {
                  lineHeight: undefined,
                }
              }
            >
              +91
            </Text>
            <TextInput
              className="flex-1 text-4xl font-poppins-semibold h-full text-black"
              style={
                Platform.OS === "ios" && {
                  lineHeight: undefined,
                }
              }
              selectionColor={colors.primary}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoFocus={true}
              value={phone}
              onChangeText={handlePhoneChange}
              maxLength={10}
              ref={phoneRef}
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
