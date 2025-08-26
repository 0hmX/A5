
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import useSessionStore from '@/store/sessionStore';

export default function SessionManagerScreen() {
  const { sessions, activeSessionId, setActiveSession, createNewSession } = useSessionStore();

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleNewSession = async () => {
    const newSessionId = await createNewSession();
    if (newSessionId) {
      // setActiveSession is already called by createNewSession, so just go back
      if (router.canGoBack()) {
        router.back();
      }
    }
  };

  return (
    <View className="flex-1 bg-background p-container">
      <Button onPress={handleNewSession} variant="primary" className="mb-4">
        <Text>New Chat</Text>
      </Button>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelectSession(item.id)}
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
              variant="caption"
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
