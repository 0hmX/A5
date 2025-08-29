import React, { useMemo, forwardRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(({ children, snapPoints = ['50%', '90%'] }, ref) => {
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={memoizedSnapPoints}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      >
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
});
