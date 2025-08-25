import { Link, router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { useTheme } from '@/hooks/useTheme';
import useSessionStore from '@/store/sessionStore';
import React, { useCallback, useMemo } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = React.memo(() => {
  const theme = useTheme();
  console.log('CustomDrawerContent: theme:', theme);
  const { sessions, createNewSession, setActiveSession, activeSessionId } = useSessionStore();

  const handleCreateNewSession = useCallback(() => {
    console.log('CustomDrawerContent: Creating new session');
    createNewSession();
    router.push('/');
  }, [createNewSession]);

  const renderHeader = useMemo(() => {
    console.log('CustomDrawerContent: renderHeader - theme.colors:', theme.colors);
    return (
      <View>
        <Text className="text-2xl font-bold pt-8 pb-4 px-4 text-center" style={{ color: theme.colors.text }}>a5 chat</Text>
        <Button title="New Chat" color={theme.colors.primary} onPress={handleCreateNewSession} />
        <TextInput
          placeholder="Search sessions..."
          placeholderTextColor={theme.colors.text + '60'}
          className="m-4 p-2.5 rounded-md border"
          style={{ 
            borderColor: theme.colors.border, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card
          }}
        />
      </View>
    );
  }, [theme, handleCreateNewSession]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    console.log('CustomDrawerContent: renderItem - activeSessionId:', activeSessionId);
    return (
      <View 
        className="py-3 px-4 border-b"
        style={{ 
          borderBottomColor: theme.colors.border,
          backgroundColor: item.id === activeSessionId ? theme.colors.primary + '20' : 'transparent'
        }}
      >
        <Link href="/" asChild>
          <Text 
            onPress={() => setActiveSession(item.id)}
            style={{ 
              color: item.id === activeSessionId ? theme.colors.primary : theme.colors.text 
            }}
          >
            {item.name}
          </Text>
        </Link>
      </View>
    );
  }, [theme, activeSessionId, setActiveSession]);

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerClassName="pb-5"
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