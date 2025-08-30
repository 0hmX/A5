import useSessionStore from '@/store/sessionStore';
import { DrawerContentComponentProps, DrawerNavigationProp } from '@react-navigation/drawer';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from './nativewindui/Button';
import { TextInput } from './TextInput';

type RootDrawerParamList = {
  index: undefined;
};

type SessionSidebarNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'index'>;

export function SessionSidebar(props: DrawerContentComponentProps) {
  const { sessions, activeSessionId, setActiveSession, createNewSession } = useSessionStore();
  const { navigation } = props;

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
    <View className="flex-1 pt-[50px] p-container justify-between">
      <View className="flex-1 space-y-4 gap-2">
        <View className="flex-row items-center gap-2">
          <TextInput placeholder='Search' variant={"default"} size={"md"} containerClassName='mb-0 flex-1' className='flex-1' showClear={false} />
          <Pressable
            onPress={handleCreateNewSession}
            className="bg-primary p-2 rounded-lg items-center justify-center w-10 h-10"
          >
            <Text className="text-primary-foreground text-2xl">+</Text>
          </Pressable>
        </View>
        <Button onPress={() => { }} variant="secondary">
          <Text>Benchmark</Text>
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
                >
                  {item.name}
                </Text>
                <Text
                  className={
                    activeSessionId === item.id
                      ? 'text-accent-foreground/70'
                      : 'text-muted-foreground'
                  }
                >
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
      <View className="pt-4">
        <Button onPress={() => { }} variant="secondary">
          <Text>Settings</Text>
        </Button>
      </View>
    </View>
  );
}
