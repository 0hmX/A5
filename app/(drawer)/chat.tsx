import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button, FlatList, StyleSheet, TextInput, View } from 'react-native';

export default function ChatScreen() {
  const tint = useThemeColor({},'tint');
  const messages = [{ id: '1', text: 'Hello! How can I help you today?', sender: 'assistant' }];

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.bubble}>
            <ThemedText>{item.text}</ThemedText>
          </ThemedView>
        )}
        style={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          placeholderTextColor="#999"
          style={styles.textInput}
        />
        <Button title="Send" color={tint} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
    padding: 8,
  },
  bubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
    color: '#fff',
  },
});