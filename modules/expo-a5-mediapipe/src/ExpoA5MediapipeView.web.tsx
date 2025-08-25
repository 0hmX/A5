import * as React from 'react';

import { ExpoA5MediapipeViewProps } from './ExpoA5Mediapipe.types';

export default function ExpoA5MediapipeView(props: ExpoA5MediapipeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
