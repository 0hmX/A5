import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoA5MediapipeViewProps } from './ExpoA5Mediapipe.types';

const NativeView: React.ComponentType<ExpoA5MediapipeViewProps> =
  requireNativeView('ExpoA5Mediapipe');

export default function ExpoA5MediapipeView(props: ExpoA5MediapipeViewProps) {
  return <NativeView {...props} />;
}
