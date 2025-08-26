
import * as Device from 'expo-device';
import { create } from 'zustand';

export type DeviceType = 'UNKNOWN' | 'PHONE' | 'TABLET' | 'TV' | 'DESKTOP';

const mapDeviceType = (deviceType: Device.DeviceType): DeviceType => {
  switch (deviceType) {
    case Device.DeviceType.PHONE:
      return 'PHONE';
    case Device.DeviceType.TABLET:
      return 'TABLET';
    case Device.DeviceType.TV:
      return 'TV';
    case Device.DeviceType.DESKTOP:
      return 'DESKTOP';
    default:
      return 'UNKNOWN';
  }
};

interface DeviceStoreState {
  totalMemory: number | null;
  deviceType: DeviceType | null;
  isInitialized: boolean;
  initializeDeviceStore: () => Promise<void>;
}

const useDeviceStore = create<DeviceStoreState>((set, get) => ({
  totalMemory: null,
  deviceType: null,
  isInitialized: false,
  initializeDeviceStore: async () => {
    if (get().isInitialized) {
      return;
    }

    console.log('DeviceStore: Initializing...');

    const deviceTypeResult = await Device.getDeviceTypeAsync();
    const totalMemory = Device.totalMemory;

    console.log(`DeviceStore: Fetched - Type: ${deviceTypeResult}, Memory: ${totalMemory}`);

    set({
      deviceType: mapDeviceType(deviceTypeResult),
      totalMemory: totalMemory,
      isInitialized: true,
    });

    console.log('DeviceStore: Initialized.');
  },
}));

export default useDeviceStore;
