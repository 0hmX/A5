import { Link, router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import useAppStore from '@/store/appStore';
import { Button, FlatList, StyleSheet, TextInput, View } from 'react-native';

function CustomDrawerContent() {
  const themeColors = useTheme();
  const { sessions, createNewSession, setActiveSession, activeSessionId } = useAppStore();

  const handleCreateNewSession = () => {
    createNewSession();
    router.replace('/'); // Navigate to the chat screen
  };

  const renderHeader = () => (
    <View>
      <ThemedText style={styles.drawerHeader}>a5 chat</ThemedText>
      <Button title="New Chat" color={themeColors.primary} onPress={handleCreateNewSession} />
      <TextInput
        placeholder="Search sessions..."
        placeholderTextColor={themeColors.mutedForeground}
        style={[styles.searchInput, { borderColor: themeColors.input, color: themeColors.text }]}
      />
    </View>
  );

  const renderFooter = () => (
    <Link href="/models" asChild>
      <Button title="Manage Models" color={themeColors.primary} />
    </Link>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={[styles.sessionItem, { borderBottomColor: themeColors.border }, item.id === activeSessionId && { backgroundColor: themeColors.accent }]}>
            <Link href="/" asChild>
              <ThemedText onPress={() => setActiveSession(item.id)}>{item.name}</ThemedText>
            </Link>
          </ThemedView>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.scrollContainer}
      />
    </ThemedView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer drawerContent={() => <CustomDrawerContent />}>
      <Drawer.Screen
        name="index"
        options={{
          title: 'Chat',
          headerRight: () => (
            <Link href="/models" asChild>
              <Button title="Models" />
            </Link>
          ),
        }}
      />
      <Drawer.Screen
        name="models"
        options={{
          title: 'Model Management',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
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
