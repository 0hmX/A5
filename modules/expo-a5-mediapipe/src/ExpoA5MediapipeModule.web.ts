import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoA5Mediapipe.types';

type ExpoA5MediapipeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoA5MediapipeModule extends NativeModule<ExpoA5MediapipeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoA5MediapipeModule, 'ExpoA5MediapipeModule');
