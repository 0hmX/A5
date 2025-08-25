import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import useAppStatusStore from '@/store/appStatusStore';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

export default function ChatScreen() {
  const { activeModel } = useChatStore();
  const { models, loadModel, generate } = useModelStore();
  const { sessions, activeSessionId, addMessageToSession, initializeSessions } = useSessionStore();
  const { appStatus, setAppStatus, errorMessage, setError, clearError } = useAppStatusStore();

  console.log('ChatScreen: Rendering with activeSessionId:', activeSessionId);

  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
    paddingBottom: insets.bottom,
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.input,
    color: theme.text,
  },
  loading: {
    marginVertical: 10,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: theme.destructive,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  errorText: {
    color: theme.primaryForeground,
    marginBottom: 5,
  },
}), [theme, insets]);

  const [inputText, setInputText] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false); // New state to track model loading
  const modelState = activeModel ? models[activeModel] : null;

  useEffect(() => {
    console.log('ChatScreen: Initializing sessions');
    initializeSessions();
  }, [initializeSessions]);

  useEffect(() => {
    console.log('ChatScreen: activeSessionId changed to', activeSessionId);
    console.log('ChatScreen: sessions', sessions);
  }, [activeSessionId, sessions]);

  useEffect(() => {
    const loadModelAsync = async () => {
      console.log('ChatScreen: loadModel useEffect triggered');
      setIsModelLoaded(false); // Reset model loaded status
      if (!activeModel || !modelState || modelState.status !== 'downloaded') {
        console.log('ChatScreen: loadModel - Pre-conditions not met (activeModel, modelState, or status)');
        return;
      }

      console.log('ChatScreen: loadModel - Setting appStatus to LOADING_MODEL');
      setAppStatus('LOADING_MODEL');
      const [success, error] = await loadModel(activeModel);

      if (error) {
        console.error('ChatScreen: loadModel - Load error:', error.message);
        setError(error.message);
        setAppStatus('ERROR');
        return;
      }
      console.log('ChatScreen: loadModel - Model loaded successfully, setting appStatus to IDLE');
      setAppStatus('IDLE');
      setIsModelLoaded(true); // Set model loaded status to true
    };
    loadModelAsync();
  }, [activeModel, modelState, setAppStatus, setError, loadModel]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.history : [];

  const handleSend = async () => {
    console.log('ChatScreen: handleSend started');
    if (inputText.trim().length === 0 || !activeModel || !activeSessionId || !isModelLoaded || appStatus === 'LOADING_MODEL') { // Added !isModelLoaded
      console.log('ChatScreen: handleSend - Pre-conditions not met (empty input, no model/session, or loading)');
      return;
    }

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    console.log('ChatScreen: handleSend - Adding user message to session');
    addMessageToSession(activeSessionId, userMessage);
    setInputText('');
    console.log('ChatScreen: handleSend - Setting appStatus to GENERATING');
    setAppStatus('GENERATING');

    const [response, responseError] = await generate(userMessage.content);

    if (responseError) {
      console.error('ChatScreen: handleSend - Generate error:', responseError.message);
      setError(responseError.message);
      setAppStatus('ERROR');
      return;
    }

    const modelMessage = {
      id: uuidv4(),
      role: 'model' as const,
      content: response as string,
      createdAt: new Date().toISOString(),
    };

    console.log('ChatScreen: handleSend - Adding model message to session');
    addMessageToSession(activeSessionId, modelMessage);
    console.log('ChatScreen: handleSend - Setting appStatus to IDLE');
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
    <ThemedView style={styles.container} className='flex bg-red-100'>
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
      {(appStatus === 'GENERATING' || appStatus === 'LOADING_MODEL') && <ActivityIndicator size="large" color={theme.accent} style={styles.loading} />}
      {appStatus === 'ERROR' && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <Button title="Clear" onPress={clearError} />
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          placeholderTextColor={theme.mutedForeground}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          editable={appStatus === 'IDLE' && isModelLoaded}
        />
        <Button title="Send" color={theme.accent} onPress={handleSend} disabled={appStatus !== 'IDLE' || !isModelLoaded} />
      </View>
    </ThemedView>
  );
}