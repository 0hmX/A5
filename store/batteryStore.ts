
import * as Battery from 'expo-battery';
import { create } from 'zustand';
import { BatteryState } from './types';

const mapBatteryState = (state: Battery.BatteryState): BatteryState => {
  switch (state) {
    case Battery.BatteryState.UNPLUGGED:
      return 'unplugged';
    case Battery.BatteryState.CHARGING:
      return 'charging';
    case Battery.BatteryState.FULL:
      return 'full';
    default:
      return 'unknown';
  }
};

interface BatteryStoreState {
  batteryLevel: number | null;
  batteryState: BatteryState | null;
  lowPowerMode: boolean | null;
  isInitialized: boolean;
  initializeBatteryMonitor: () => Promise<void>;
  updateBatteryInfo: () => Promise<void>;
}

const useBatteryStore = create<BatteryStoreState>((set, get) => ({
  batteryLevel: null,
  batteryState: null,
  lowPowerMode: null,
  isInitialized: false,
  initializeBatteryMonitor: async () => {
    if (get().isInitialized) {
      return;
    }

    console.log('BatteryStore: Initializing battery monitor...');
    await get().updateBatteryInfo(); // Get initial state

    // Add listeners for future changes
    Battery.addBatteryLevelListener(({ batteryLevel }) => {
      console.log('BatteryStore: Battery level changed:', batteryLevel);
      set({ batteryLevel });
    });

    Battery.addBatteryStateListener(({ batteryState }) => {
      console.log('BatteryStore: Battery state changed:', batteryState);
      set({ batteryState: mapBatteryState(batteryState) });
    });

    Battery.addLowPowerModeListener(({ lowPowerMode }) => {
      console.log('BatteryStore: Low power mode changed:', lowPowerMode);
      set({ lowPowerMode });
    });

    set({ isInitialized: true });
    console.log('BatteryStore: Battery monitor initialized.');
  },
  updateBatteryInfo: async () => {
    console.log('BatteryStore: Fetching battery info...');
    const [level, state, lowPower] = await Promise.all([
      Battery.getBatteryLevelAsync(),
      Battery.getBatteryStateAsync(),
      Battery.isLowPowerModeEnabledAsync(),
    ]);
    console.log(`BatteryStore: Fetched - Level: ${level}, State: ${state}, Low Power: ${lowPower}`);

    set({
      batteryLevel: level,
      batteryState: mapBatteryState(state),
      lowPowerMode: lowPower,
    });
  },
}));

export default useBatteryStore;
