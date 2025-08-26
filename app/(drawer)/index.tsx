import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { TextInput } from '@/components/TextInput';
import { useTheme } from '@/hooks/useTheme';
import useAppStatusStore from '@/store/appStatusStore';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
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
  }, [activeSessionId, sessions]);

  useEffect(() => {
    const loadModelAsync = async () => {
      console.log('ChatScreen: loadModel useEffect triggered');
      setIsModelLoaded(false);
      if (!activeModel || !modelState || modelState.status !== 'downloaded') {
        console.log('ChatScreen: loadModel - Pre-conditions not met');
        return;
      }

      setAppStatus('LOADING_MODEL');
      const [success, error] = await loadModel(activeModel);

      if (error) {
        console.error('ChatScreen: loadModel - Load error:', error.message);
        setError(error.message);
        setAppStatus('ERROR');
        return;
      }
      console.log('ChatScreen: Model loaded successfully');
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

    const [response, responseError] = await generate(userMessage.content);

    if (responseError) {
      console.error('ChatScreen: Generate error:', responseError.message);
      setError(responseError.message);
      setAppStatus('ERROR');
      return;
    }

    const generationTimeMs = useModelStore.getState().generationTimeMs;

    const modelMessage = {
      id: uuidv4(),
      role: 'model' as const,
      content: response as string,
      createdAt: new Date().toISOString(),
      modelName: activeModel,
      generationTimeMs: generationTimeMs,
    };

    addMessageToSession(activeSessionId, modelMessage);
    setAppStatus('IDLE');
  };

  if (!activeModel || !modelState) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>Please select a model to start chatting.</Text>
        <Button onPress={() => router.push('/models')}>
          <Text>Select Model</Text>
        </Button>
      </View>
    );
  }

  if (modelState.status === 'not_downloaded') {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>Model not downloaded.</Text>
      </View>
    );
  }

  if (!activeSession) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>Please select a session to start chatting.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            className={`p-3 rounded-lg mb-2 max-w-[80%] ${item.role === 'user' ? 'self-end' : 'self-start'
              }`}
            style={{
              backgroundColor: item.role === 'user' ? theme.colors.primary : theme.colors.card
            }}
          >
            <Text style={{ color: item.role === 'user' ? theme.colors.background : theme.colors.text }}>
              {item.content}
            </Text>
            {item.role === 'model' && item.generationTimeMs && (
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 10, marginTop: 4 }}>
                Generated in {(item.generationTimeMs / 1000).toFixed(2)}s
              </Text>
            )}
          </View>
        )}
        className="flex-1 w-full p-2"
      />
      {(appStatus === 'GENERATING' || appStatus === 'LOADING_MODEL') && (
        <ActivityIndicator size="large" color={theme.colors.primary} className="my-2.5" />
      )}
      {appStatus === 'ERROR' && (
        <View
          className="p-2.5 rounded-md m-2.5 items-center"
          style={{ backgroundColor: theme.colors.notification }}
        >
          <Text style={{ color: theme.colors.background }} className="mb-1.5">
            {errorMessage}
          </Text>
          <Button onPress={clearError}>
            <Text>Clear</Text>
          </Button>
        </View>
      )}
      <View
        className="flex-row gap-2 p-2 border-t items-center w-full"
        style={{
          borderColor: theme.colors.border,
          paddingBottom: insets.bottom + 8
        }}
      >
        <TextInput
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          onClear={() => setInputText('')}
          editable={appStatus === 'IDLE' && isModelLoaded}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          multiline
          variant="default"
          size="md"
          containerClassName="flex-1 mb-0"
          rightIcon={
            appStatus === 'GENERATING' ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : undefined
          }
        />
        <Button
          onPress={handleSend}
          disabled={appStatus !== 'IDLE' || !isModelLoaded || !inputText.trim()}
          size="md"
        >
          <Text>Send</Text>
        </Button>
      </View>
    </View>
  );
}