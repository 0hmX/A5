import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { Button } from "@/components/nativewindui/Button";
import { Text } from '@/components/nativewindui/Text';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { TextInput } from '@/components/Textinput';
import { useTheme } from '@/hooks/useTheme';
import useSessionStore from '@/store/sessionStore';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = React.memo(() => {
  const theme = useTheme();
  console.log('CustomDrawerContent: theme:', theme);
  const { sessions, createNewSession, setActiveSession, activeSessionId  } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCreateNewSession = useCallback(async () => {
    console.log('CustomDrawerContent: Creating new session');
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
    console.log('CustomDrawerContent: renderHeader - theme.colors:', theme.colors);
    return (
      <View>
        <Text variant="largeTitle" className="pt-8 pb-4 px-4 text-center">
          a5 chat
        </Text>
        <View className="px-4 mb-4">
          <Button 
            onPress={handleCreateNewSession} 
            variant="plain" 
            size="md"
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
        <View className="px-4">
          <TextInput
            placeholder="Search sessions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            variant="filled"
            size="sm"
            containerClassName="mb-0"
            leftIcon={
              searchQuery ? (
                <ProgressIndicator variant="dots" size="sm" indeterminate />
              ) : (
                <Text variant="footnote" color="tertiary">🔍</Text>
              )
            }
          />
        </View>
      </View>
    );
  }, [theme, handleCreateNewSession, searchQuery, isCreatingSession]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    console.log('CustomDrawerContent: renderItem - activeSessionId:', activeSessionId);
    const isActive = item.id === activeSessionId;
    const isGenerating = item.isGenerating || false; // Add this to your session state
    
    return (
      <TouchableOpacity
        onPress={() => {
          setActiveSession(item.id);
          router.push('/');
        }}
        className="py-3 px-4 border-b"
        style={{ 
          borderBottomColor: theme.colors.border,
          backgroundColor: isActive ? theme.colors.primary + '20' : 'transparent'
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text 
              variant="body"
              style={{ 
                color: isActive ? theme.colors.primary : theme.colors.text 
              }}
            >
              {item.name}
            </Text>
            <Text 
              variant="caption1"
              color="tertiary"
              className="mt-1"
            >
              {item.history.length} messages
            </Text>
          </View>
          {isGenerating && (
            <ProgressIndicator 
              variant="dots" 
              size="sm" 
              indeterminate
              className="ml-2"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [theme, activeSessionId, setActiveSession]);

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center px-8 py-8">
      {activeSessionId ? (
        <>
          <ProgressIndicator 
            variant="circular" 
            size="lg" 
            indeterminate
            className="mb-4"
          />
          <Text variant="body" color="tertiary">
            Loading sessions...
          </Text>
        </>
      ) : (
        <>
          <Text variant="body" color="tertiary" className="text-center">
            {searchQuery ? 'No sessions found' : 'No conversations yet'}
          </Text>
          <Text variant="caption1" color="quarternary" className="text-center mt-2">
            {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
          </Text>
        </>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!sessions.length) return null;
    
    const totalMessages = sessions.reduce((acc, session) => acc + session.history.length, 0);
    const storageUsed = 45; // Example: calculate actual storage

    return (
      <View className="px-4 py-4 border-t" style={{ borderTopColor: theme.colors.border }}>
        <Text variant="caption1" color="tertiary" className="mb-2">
          Storage Usage
        </Text>
        <ProgressIndicator 
          variant="linear" 
          size="sm" 
          progress={storageUsed}
          className="mb-1"
        />
        <Text variant="caption2" color="quarternary">
          {totalMessages} messages • {storageUsed}% used
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ 
            paddingBottom: 20,
            flexGrow: 1 
          }}
        />
      </View>
    </SafeAreaView>
  );
});

export default function DrawerLayout() {
  return (
    <Drawer drawerContent={() => <CustomDrawerContent />}>
      <Drawer.Screen
        name="index"
        options={{
          title: 'Chat',
        }}
      />
    </Drawer>
  );
}