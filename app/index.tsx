import { CustomBottomSheet } from '@/components/BottomSheet';
import ModelManagement from '@/components/ModelManagement';
import { useAnimation } from '@/context/AnimationContext';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from 'expo-router';
import { useCallback } from 'react';

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
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

type RootDrawerParamList = {
  index: undefined;
  sessionManager: undefined;
  models: undefined;
};

type ChatScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'index'>;

export default function ChatScreen() {
  const { activeModel, setActiveModel } = useChatStore();
  const { models, isInitialized, loadedModelName, loadModel, generate } = useModelStore();
  const { sessions, activeSessionId, addMessageToSession, initializeSessions } = useSessionStore();
  const { appStatus, setAppStatus, errorMessage, setError, clearError } = useAppStatusStore();
  const { drawerProgress } = useAnimation();

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelState = activeModel ? models[activeModel] : null;
  const flatListRef = useRef<FlatList>(null);

  const navigation = useNavigation<ChatScreenNavigationProp>();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = drawerProgress.value * 250;
    return {
      transform: [{ translateX }],
    };
  });

  const handlePresentModalPress = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  useEffect(() => {
    initializeSessions();
  }, [initializeSessions]);

  useEffect(() => {
    const loadModelAsync = async () => {
      if (activeModel === loadedModelName) {
        setIsModelLoaded(true);
        return;
      }

      setIsModelLoaded(false);
      if (!activeModel || !modelState || modelState.status !== 'downloaded') {
        return;
      }

      setAppStatus('LOADING_MODEL');
      const [success, error] = await loadModel(activeModel);

      if (error) {
        setError(error.message);
        setAppStatus('ERROR');
        return;
      }
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
        setActiveModel(lastUsedModel.model.name);
      } else {
        const randomIndex = Math.floor(Math.random() * downloadedModels.length);
        const randomModel = downloadedModels[randomIndex];
        setActiveModel(randomModel.model.name);
      }
    };

    autoLoadModel();
  }, [isInitialized, models, activeModel, setActiveModel]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.history : [];

  const handleSend = async () => {
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

  const renderContent = () => {
    console.log('renderContent: modelState', modelState);
    if (!modelState || modelState.status === 'not_downloaded') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text className='text-white'>Model not downloaded.</Text>
        </View>
      );
    }

    if (!activeSession) {
      return (
        <View className="flex-1 justify-center items-center">
          <Text>Please select a session to start chatting.</Text>
        </View>
      );
    }

    return (
      <>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => Clipboard.setStringAsync(item.content)}
              className={`p-3 rounded-lg mb-2 max-w-[80%] ${item.role === 'user' ? 'self-end' : 'self-start'
                }`}
              style={{
                backgroundColor: item.role === 'user' ? theme.colors.primary : theme.colors.card
              }}
            >
              <Text style={{ color: item.role === 'user' ? theme.colors.background : theme.colors.text }}>
                {item.content}
              </Text>
              {item.role === 'model' && (
                <View className="mt-2">
                  {item.modelName && (
                    <Text variant="caption" className="text-muted-foreground">
                      Model: {item.modelName}
                    </Text>
                  )}
                  {item.generationTimeMs && (
                    <Text variant="caption" className="text-muted-foreground">
                      Generated in {(item.generationTimeMs / 1000).toFixed(2)}s
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          )}
          className="flex-1 w-full p-2"
          contentContainerStyle={{ paddingBottom: 16 }}
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
              autoFocus={true}
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
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={40}
    >
      <Animated.View style={[{ flex: 1, overflow: 'hidden', backgroundColor: theme.colors.background }, animatedStyle]}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="ghost" onPress={() => navigation.openDrawer()}>
            <Feather name="menu" size={24} color={theme.colors.text} />
          </Button>
          <Text variant="heading">Chat</Text>
          <Button variant="ghost" onPress={handlePresentModalPress}>
            <Feather name="box" size={24} color={theme.colors.text} />
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      </Animated.View>
      <CustomBottomSheet ref={bottomSheetRef}>
        <ModelManagement />
      </CustomBottomSheet>
    </KeyboardAvoidingView>
  );
}
