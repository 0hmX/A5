import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from "@/components/nativewindui/Button";
import { Text } from '@/components/nativewindui/Text';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { TextInput } from '@/components/TextInput';
import { cn } from '@/lib/cn';
import useSessionStore from '@/store/sessionStore';

const CustomDrawerContent = React.memo(() => {
  const { sessions, createNewSession, setActiveSession, activeSessionId } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCreateNewSession = useCallback(async () => {
    setIsCreatingSession(true);
    await createNewSession();
    setIsCreatingSession(false);
    router.push('/');
  }, [createNewSession]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    return sessions.filter(session =>
      session.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  const renderHeader = useMemo(() => {
    return (
      <View className="p-container">
        <Text variant="display" className="pt-4 pb-4 text-center">
          Model Playground
        </Text>
        <View className="mb-4">
          <Button
            onPress={handleCreateNewSession}
            variant="ghost"
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <View className="flex-row items-center gap-2">
                <ProgressIndicator variant="spinner" size="sm" />
                <Text>Creating...</Text>
              </View>
            ) : (
              <Text>New Chat</Text>
            )}
          </Button>
        </View>
        <TextInput
          placeholder="Search sessions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  }, [handleCreateNewSession, searchQuery, isCreatingSession]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isActive = item.id === activeSessionId;
    const isGenerating = item.isGenerating || false;

    return (
      <TouchableOpacity
        onPress={() => {
          setActiveSession(item.id);
          router.push('/');
        }}
        className={cn(
          'py-3 px-container border-b border-border',
          isActive && 'bg-primary/10' // Conditional active state background
        )}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              variant="body"
              className={cn(isActive ? 'text-primary' : 'text-foreground')}
            >
              {item.name}
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground mt-1"
            >
              {item.history.length} messages
            </Text>
          </View>
          {isGenerating && (
            <ProgressIndicator variant="dots" size="sm" indeterminate className="ml-2" />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [activeSessionId, setActiveSession]);

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center p-8">
      <Text variant="body" className="text-muted-foreground text-center">
        {searchQuery ? 'No sessions found' : 'No conversations yet'}
      </Text>
      <Text variant="caption" className="text-muted-foreground text-center mt-2">
        {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
});

export default function DrawerLayout() {
  return (
    <Drawer drawerContent={() => <CustomDrawerContent />}>
      <Drawer.Screen name="index" options={{ title: 'Chat' }} />
    </Drawer>
  );
}