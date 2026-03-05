import { cn } from "../../lib/utils";
import { Ionicons } from "@expo/vector-icons";
import React, { FC } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

interface Props {
  disabled?: boolean;
  onPress?: () => void;
  loading?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  className?: string;
  iconClassName?: string;
  loaderClassName?: string;
}

export const Fab: FC<Props> = ({
  disabled = false,
  onPress,
  loading = false,
  iconName = "chevron-forward",
  className,
  iconClassName,
  loaderClassName,
}) => {
  return (
    // @ts-ignore
    <Pressable
      className={cn(
        "h-16 aspect-square rounded-full justify-center items-center bg-fuchsia-900",
        {
          "bg-neutral-200": disabled && !loading,
          "opacity-50": disabled,
        },
        className
      )}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        // @ts-ignore
        <ActivityIndicator className={cn(" text-white", loaderClassName)} />
      ) : (
        // @ts-ignore
        <View
          className={cn(
            "text-white",
            { "text-neutral-400": disabled },
            iconClassName
          )}
        >
          {/* @ts-ignore */}
          <Ionicons
            name={iconName}
            className={cn(
              "text-2xl text-white",
              { "text-neutral-400": disabled },
              iconClassName
            )}
          />
        </View>
      )}
    </Pressable>
  );
};
