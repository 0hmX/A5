import { Link, router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import useSessionStore from '@/store/sessionStore';
import React, { useCallback, useMemo } from 'react';
import { Button, FlatList, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = React.memo(() => {
  const themeColors = useTheme();
  console.log('CustomDrawerContent: themeColors:', themeColors);
  const { sessions, createNewSession, setActiveSession, activeSessionId } = useSessionStore();

  const handleCreateNewSession = useCallback(() => {
    console.log('CustomDrawerContent: Creating new session');
    createNewSession();
    router.push('/');
  }, [createNewSession]);

  const renderHeader = useMemo(() => {
    console.log('CustomDrawerContent: renderHeader - themeColors.accent:', themeColors.accent);
    console.log('CustomDrawerContent: renderHeader - themeColors.mutedForeground:', themeColors.mutedForeground);
    console.log('CustomDrawerContent: renderHeader - themeColors.input:', themeColors.input);
    console.log('CustomDrawerContent: renderHeader - themeColors.text:', themeColors.text);
    return (
      <View>
        <ThemedText className="text-2xl font-bold pt-8 pb-4 px-4 text-center">a5 chat</ThemedText>
        <Button title="New Chat" color={themeColors.accent} onPress={handleCreateNewSession} />
        <TextInput
          placeholder="Search sessions..."
          placeholderTextColor={themeColors.mutedForeground}
          className="m-4 p-2.5 rounded-md border"
          style={{ borderColor: themeColors.input, color: themeColors.text }}
        />
      </View>
    );
  }, [themeColors, handleCreateNewSession]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    console.log('CustomDrawerContent: renderItem - themeColors.border:', themeColors.border);
    console.log('CustomDrawerContent: renderItem - themeColors.accent (activeSession):', themeColors.accent);
    return (
      <ThemedView 
        className="py-3 px-4 border-b"
        style={{ 
          borderBottomColor: themeColors.border,
          backgroundColor: item.id === activeSessionId ? themeColors.accent : 'transparent'
        }}
      >
        <Link href="/" asChild>
          <ThemedText onPress={() => setActiveSession(item.id)}>{item.name}</ThemedText>
        </Link>
      </ThemedView>
    );
  }, [themeColors, activeSessionId, setActiveSession]);

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <ThemedView className="flex-1">
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerClassName="pb-5"
        />
      </ThemedView>
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