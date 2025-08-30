import useSessionStore from '@/store/sessionStore';
import { AntDesign, Feather, SimpleLineIcons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerNavigationProp } from '@react-navigation/drawer';
import { useUnstableNativeVariable } from 'nativewind';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './nativewindui/Button';
import { TextInput } from './TextInput';

type RootDrawerParamList = {
  index: undefined;
};

type SessionSidebarNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'index'>;

export function SessionSidebar(props: DrawerContentComponentProps) {
  const { sessions, activeSessionId, setActiveSession, createNewSession } = useSessionStore();
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const foreground = `rgb(${useUnstableNativeVariable('--foreground')})`;

  const handleSessionSelect = (sessionId: string) => {
    setActiveSession(sessionId);
    navigation.closeDrawer();
  };

  const handleCreateNewSession = async () => {
    const newSessionId = await createNewSession();
    if (newSessionId) {
      navigation.closeDrawer();
    }
  };

  return (
    <View
      className="flex-1 p-container justify-between"
      style={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 space-y-4 gap-2">
        <View className="flex-row items-center gap-2">
          <TextInput placeholder='Search' variant={"default"} size={"md"} containerClassName='mb-0 flex-1' className='flex-1' showClear={false} />
        </View>
        <Button className='gap-2 justify-start' onPress={handleCreateNewSession} variant="ghost">
          <SimpleLineIcons name="note" size={14} color={foreground} />
          <Text className="text-foreground">New Session</Text>
        </Button>
        <Button className='gap-2 justify-start' onPress={() => { }} variant="ghost">
          <AntDesign name="hearto" size={14} color={foreground} />
          <Text className="text-foreground">Benchmark</Text>
        </Button>
        <View className="flex-1">
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSessionSelect(item.id)}
                className={`p-4 rounded-lg mb-2 ${activeSessionId === item.id ? 'bg-accent' : 'bg-card'
                  }`}
              >
                <Text
                  className={
                    activeSessionId === item.id
                      ? 'text-accent-foreground'
                      : 'text-foreground'
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
      <View className="pt-4">
        <Button  className='gap-2 justify-start' onPress={() => { }} variant="ghost">
          <Feather name="settings" size={14} color={foreground} />
          <Text className='text-foreground'>Settings</Text>
        </Button>
      </View>
    </View>
  );
}
