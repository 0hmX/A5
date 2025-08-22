import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LLMServiceFactory } from '@/services/llm/LLMServiceFactory';
import useAppStore from '@/store/appStore';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, TextInput, View, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

export default function ChatScreen() {
  const tint = useThemeColor({}, 'tint');
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
  } = useAppStore();

  const [inputText, setInputText] = useState('');

  useEffect(() => {
    initializeSessions();
  }, [initializeSessions]);

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
        <Button title="Download Model" onPress={() => router.push(`/modal/downloader?modelName=${activeModel}`)} />
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
      {appStatus === 'GENERATING' && <ActivityIndicator size="large" color={tint} style={styles.loading} />}
      {appStatus === 'ERROR' && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <Button title="Clear" onPress={clearError} />
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          placeholderTextColor="#999"
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          editable={appStatus === 'IDLE'}
        />
        <Button title="Send" color={tint} onPress={handleSend} disabled={appStatus !== 'IDLE'} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#007AFF',
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    width: '100%',
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
  loading: {
    marginVertical: 10,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ff4d4d',
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    marginBottom: 5,
  },
});
