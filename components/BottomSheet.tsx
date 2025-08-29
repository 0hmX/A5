import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';

interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(({ children, snapPoints = ['50%', '90%'] }, ref) => {
  console.log('CustomBottomSheet: Rendering');
  const memoizedSnapPoints = useMemo(() => {
    console.log('CustomBottomSheet: Recalculating snap points', snapPoints);
    return snapPoints;
  }, [snapPoints]);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={memoizedSnapPoints}
      handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      onChange={(index) => console.log('CustomBottomSheet: onChange', index)}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
