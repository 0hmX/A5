import { useTheme } from '@/hooks/useTheme';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';

interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(({ children, snapPoints = ['50%', '90%'] }, ref) => {
  const theme = useTheme();
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={memoizedSnapPoints}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      backgroundStyle={{ backgroundColor: theme.colors.card }}
      onChange={(index) => console.log('CustomBottomSheet: onChange', index)}
    >
      <BottomSheetView style={{ flex: 1, height: '100%' }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
