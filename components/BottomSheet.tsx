import { BottomSheetBackgroundProps, BottomSheetHandleProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

const CustomBackground = ({ style }: BottomSheetBackgroundProps) => {
  return (
    <Animated.View
      style={style}
      className="bg-card flex-1"
    />
  );
};

const CustomHandle = ({ animatedIndex, animatedPosition }: BottomSheetHandleProps) => {
  return (
    <View className="p-4 items-center justify-center">
      <View className="w-8 h-1 rounded-full bg-border" />
    </View>
  );
};


interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(({ children, snapPoints = ['50%', '90%'] }, ref) => {
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={memoizedSnapPoints}
      backgroundComponent={CustomBackground}
      handleComponent={CustomHandle}
    >
      <BottomSheetView className="flex-1 h-full">
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});