import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  onBack?: () => void;
  showBack?: boolean;
}

export const StackHeader: FC<Props> = ({ onBack, showBack = true }) => {
  const insets = useSafeAreaInsets();
  return (
    <View 
      className="flex-row items-center justify-end px-4 pb-2 z-10 w-full" 
      style={{ paddingTop: insets.top + 10 }}
    >
      {showBack && onBack && (
        <Pressable onPress={onBack}>
          <Ionicons name="close" className="text-2xl text-black" suppressHighlighting />
        </Pressable>
      )}
    </View>
  );
};
