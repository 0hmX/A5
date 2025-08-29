import useSessionStore from '@/store/sessionStore';
import { DrawerContentComponentProps, DrawerNavigationProp } from '@react-navigation/drawer';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from './nativewindui/Button';

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
      // setActiveSession is already called by createNewSession, so just go back
      navigation.closeDrawer();
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: 50 }} className="p-container">
      <Button onPress={handleCreateNewSession} variant="primary" className="mb-4">
        <Text>New Chat</Text>
      </Button>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSessionSelect(item.id)}
            className={`p-4 rounded-lg mb-2 ${
              activeSessionId === item.id ? 'bg-primary' : 'bg-card'
            }`}
          >
            <Text
              className={
                activeSessionId === item.id
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }
            >
              {item.name}
            </Text>
            <Text
              className={
                activeSessionId === item.id
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              }
            >
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
