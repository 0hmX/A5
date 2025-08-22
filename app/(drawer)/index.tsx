import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { LLMServiceFactory } from '@/services/llm/LLMServiceFactory';
import useAppStore from '@/store/appStore';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets
import { v4 as uuidv4 } from 'uuid';

export default function ChatScreen() {
  const {
    activeModel,
    models,
    sessions,
    activeSessionId,
    addMessageToSession,
    appStatus,
    setAppStatus,
    errorMessage,
    setError,
    clearError,
    initializeSessions,
    isDbInitialized, // Added
  } = useAppStore();

  console.log('ChatScreen: Rendering with activeSessionId:', activeSessionId);

  const theme = useTheme();
  const insets = useSafeAreaInsets(); // Get safe area insets

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
    width: '100%',
    padding: 8,
  },
  bubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.accent,
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.card,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: theme.card,
    alignItems: 'center',
    width: '100%',
    paddingBottom: insets.bottom, // Apply bottom inset
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.input, // Use themed input border
    color: theme.text, // Use themed text color
  },
  loading: {
    marginVertical: 10,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: theme.destructive, // Use themed destructive color
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  errorText: {
    color: theme.primaryForeground, // Use themed foreground color
    marginBottom: 5,
  },
}), [theme, insets]); // Add insets to dependency array

  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (isDbInitialized) { // Only initialize if DB is ready
      console.log('ChatScreen: Initializing sessions');
      initializeSessions();
    }
  }, [initializeSessions, isDbInitialized]); // Add isDbInitialized to dependency array

  useEffect(() => {
    console.log('ChatScreen: activeSessionId changed to', activeSessionId);
    console.log('ChatScreen: sessions', sessions);
  }, [activeSessionId, sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.history : [];
  const modelState = activeModel ? models[activeModel] : null;

  const handleSend = async () => {
    if (inputText.trim().length === 0 || !activeModel || !activeSessionId) {
      return;
    }

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    addMessageToSession(activeSessionId, userMessage);
    setInputText('');
    setAppStatus('GENERATING');

    const [llmService, serviceError] = LLMServiceFactory.getService(activeModel);

    if (serviceError) {
      setError(serviceError.message);
      return;
    }

    const [response, responseError] = await llmService.generate(userMessage.content);

    if (responseError) {
      setError(responseError.message);
      return;
    }

    const modelMessage = {
      id: uuidv4(),
      role: 'model' as const,
      content: response,
      createdAt: new Date().toISOString(),
    };

    addMessageToSession(activeSessionId, modelMessage);
    setAppStatus('IDLE');
  };

  if (!activeModel || !modelState) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please select a model to start chatting.</ThemedText>
        <Button title="Select Model" onPress={() => router.push('/models')} />
      </ThemedView>
    );
  }

  if (modelState.status === 'not_downloaded') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Model not downloaded.</ThemedText>
      </ThemedView>
    );
  }

  if (!activeSession) {
    return (
        <ThemedView style={styles.container}>
            <ThemedText>Please select a session to start chatting.</ThemedText>
        </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.modelBubble]}>
            <ThemedText>{item.content}</ThemedText>
          </View>
        )}
        style={styles.messageList}
      />
      {appStatus === 'GENERATING' && <ActivityIndicator size="large" color={theme.accent} style={styles.loading} />}
      {appStatus === 'ERROR' && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <Button title="Clear" onPress={clearError} />
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          placeholderTextColor={theme.mutedForeground} // Use themed muted foreground
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          editable={appStatus === 'IDLE'}
        />
        <Button title="Send" color={theme.accent} onPress={handleSend} disabled={appStatus !== 'IDLE'} />
      </View>
    </ThemedView>
  );
}

