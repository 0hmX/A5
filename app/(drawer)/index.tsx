import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import useAppStatusStore from '@/store/appStatusStore';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, TextInput, View } from 'react-native';
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

  const [inputText, setInputText] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
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
      setIsModelLoaded(false);
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
      setIsModelLoaded(true);
    };
    loadModelAsync();
  }, [activeModel, modelState, setAppStatus, setError, loadModel]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.history : [];

  const handleSend = async () => {
    console.log('ChatScreen: handleSend started');
    if (inputText.trim().length === 0 || !activeModel || !activeSessionId || !isModelLoaded || appStatus === 'LOADING_MODEL') {
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
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>Please select a model to start chatting.</ThemedText>
        <Button title="Select Model" onPress={() => router.push('/models')} />
      </ThemedView>
    );
  }

  if (modelState.status === 'not_downloaded') {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>Model not downloaded.</ThemedText>
      </ThemedView>
    );
  }

  if (!activeSession) {
    return (
        <ThemedView className="flex-1 justify-center items-center">
            <ThemedText>Please select a session to start chatting.</ThemedText>
        </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 justify-center items-center">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View 
            className={`p-3 rounded-lg mb-2 max-w-[80%] ${
              item.role === 'user' ? 'self-end' : 'self-start'
            }`}
            style={{ 
              backgroundColor: item.role === 'user' ? theme.accent : theme.card 
            }}
          >
            <ThemedText>{item.content}</ThemedText>
          </View>
        )}
        className="flex-1 w-full p-2"
      />
      {(appStatus === 'GENERATING' || appStatus === 'LOADING_MODEL') && (
        <ActivityIndicator size="large" color={theme.accent} className="my-2.5" />
      )}
      {appStatus === 'ERROR' && (
        <View 
          className="p-2.5 rounded-md m-2.5 items-center"
          style={{ backgroundColor: theme.destructive }}
        >
          <ThemedText style={{ color: theme.primaryForeground }} className="mb-1.5">
            {errorMessage}
          </ThemedText>
          <Button title="Clear" onPress={clearError} />
        </View>
      )}
      <View 
        className="flex-row p-2 border-t items-center w-full"
        style={{ 
          borderColor: theme.card,
          paddingBottom: insets.bottom 
        }}
      >
        <TextInput
          placeholder="Type your message..."
          placeholderTextColor={theme.mutedForeground}
          className="flex-1 mr-2 p-2.5 rounded-md border"
          style={{ 
            borderColor: theme.input, 
            color: theme.text 
          }}
          value={inputText}
          onChangeText={setInputText}
          editable={appStatus === 'IDLE' && isModelLoaded}
        />
        <Button 
          title="Send" 
          color={theme.accent} 
          onPress={handleSend} 
          disabled={appStatus !== 'IDLE' || !isModelLoaded} 
        />
      </View>
    </ThemedView>
  );
}