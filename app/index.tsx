
import { TypingIndicator } from '@/components/TypingIndicator';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { TextInput } from '@/components/TextInput';
import { useTheme } from '@/hooks/useTheme';
import useAppStatusStore from '@/store/appStatusStore';
import useChatStore from '@/store/chatStore';
import useDbStore from '@/store/dbStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

export default function ChatScreen() {
  const { activeModel, setActiveModel } = useChatStore();
  const { models, isInitialized, loadedModelName, loadModel, generate } = useModelStore();
  const { sessions, activeSessionId, addMessageToSession, initializeSessions } = useSessionStore();
  const { appStatus, setAppStatus, errorMessage, setError, clearError } = useAppStatusStore();

  console.log('ChatScreen: Rendering with activeSessionId:', activeSessionId);

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelState = activeModel ? models[activeModel] : null;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('ChatScreen: Initializing sessions');
    initializeSessions();
  }, [initializeSessions]);

  useEffect(() => {
    console.log('ChatScreen: activeSessionId changed to', activeSessionId);
  }, [activeSessionId, sessions]);

  useEffect(() => {
    const loadModelAsync = async () => {
      if (activeModel === loadedModelName) {
        console.log('ChatScreen: loadModel - Model already loaded.');
        setIsModelLoaded(true);
        return;
      }

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

  useEffect(() => {
    const autoLoadModel = async () => {
      if (activeModel || !isInitialized) {
        return;
      }

      const downloadedModels = Object.values(models).filter(m => m.status === 'downloaded');
      if (downloadedModels.length === 0) {
        return;
      }

      const [lastUsedModelName, error] = await useDbStore.getState().getMostRecentlyUsedModel();

      if (error) {
        console.error("Failed to get most recently used model:", error);
      }

      const lastUsedModel = lastUsedModelName ? downloadedModels.find(m => m.model.name === lastUsedModelName) : undefined;

      if (lastUsedModel) {
        console.log('Auto-loading last used model:', lastUsedModel.model.name);
        setActiveModel(lastUsedModel.model.name);
      } else {
        const randomIndex = Math.floor(Math.random() * downloadedModels.length);
        const randomModel = downloadedModels[randomIndex];
        console.log('Auto-loading random model:', randomModel.model.name);
        setActiveModel(randomModel.model.name);
      }
    };

    autoLoadModel();
  }, [isInitialized, models, activeModel, setActiveModel]);

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

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

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

  


  if (!modelState || modelState.status === 'not_downloaded') {
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
        ref={flatListRef}
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
              <Text variant="caption" className="text-muted-foreground mt-1">
                Generated in {(item.generationTimeMs / 1000).toFixed(2)}s
              </Text>
            )}
          </View>
        )}
        className="flex-1 w-full p-2"
        ListFooterComponent={appStatus === 'GENERATING' ? <TypingIndicator /> : null}
      />
      {appStatus === 'LOADING_MODEL' && (
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
        className="flex-col gap-2 p-2 border-t"
        style={{
          borderColor: theme.colors.border,
          paddingBottom: insets.bottom + 8
        }}
      >
                <Pressable onPress={() => router.push('/models')} className="self-start mb-1 p-1">
          <Text variant="caption" className="text-muted-foreground">
            {activeModel ? `Model: ${activeModel}` : 'No model selected. Tap to choose.'}
          </Text>
        </Pressable>
        <View className="flex-row gap-2 items-center w-full">
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
    </View>
  );
}