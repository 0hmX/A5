import { Link, router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import useAppStore from '@/store/appStore';
import React, { useCallback, useMemo } from 'react';
import { Button, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = React.memo(() => {
  const themeColors = useTheme();
  console.log('CustomDrawerContent: themeColors:', themeColors);
  const { sessions, createNewSession, setActiveSession, activeSessionId } = useAppStore();

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
        <ThemedText style={styles.drawerHeader}>a5 chat</ThemedText>
        <Button title="New Chat" color={themeColors.accent} onPress={handleCreateNewSession} />
        <TextInput
          placeholder="Search sessions..."
          placeholderTextColor={themeColors.mutedForeground}
          style={[styles.searchInput, { borderColor: themeColors.input, color: themeColors.text }]}
        />
      </View>
    );
  }, [themeColors, handleCreateNewSession]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    console.log('CustomDrawerContent: renderItem - themeColors.border:', themeColors.border);
    console.log('CustomDrawerContent: renderItem - themeColors.accent (activeSession):', themeColors.accent);
    return (
      <ThemedView style={[styles.sessionItem, { borderBottomColor: themeColors.border }, item.id === activeSessionId && { backgroundColor: themeColors.accent }]}>
        <Link href="/" asChild>
          <ThemedText onPress={() => setActiveSession(item.id)}>{item.name}</ThemedText>
        </Link>
      </ThemedView>
    );
  }, [themeColors, activeSessionId, setActiveSession]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ThemedView style={{ flex: 1 }}>
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.scrollContainer}
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

const styles = StyleSheet.create({
  drawerHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  searchInput: {
    margin: 16,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  sessionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
});
