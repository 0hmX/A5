import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Link } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button, StyleSheet } from 'react-native';

function CustomDrawerContent() {
  const tint = useThemeColor({},'tint');

  return (
    <ThemedView style={{ flex: 1 }}>
      <DrawerContentScrollView>
        <ThemedText style={styles.drawerHeader}>Sessions</ThemedText>
        <Button title="Start New Chat" color={tint} onPress={() => {}} />
        <ThemedText style={styles.sessionItem}>Session 1</ThemedText>
        <ThemedText style={styles.sessionItem}>Session 2</ThemedText>
      </DrawerContentScrollView>
      <Link href="/models" asChild>
        <Button title="Manage Models" color={tint} />
      </Link>
    </ThemedView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer drawerContent={() => <CustomDrawerContent />}>
      <Drawer.Screen
        name="chat"
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
    padding: 16,
  },
  sessionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
});