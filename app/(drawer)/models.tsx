import { useModelManager } from '@/hooks/useModelManager';
import { useTheme } from '@/hooks/useTheme';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { ModelState } from '@/store/types';
import { router } from "expo-router";
import React, { useCallback, useEffect } from 'react';
import { Button, SectionList, Text, View } from 'react-native';

interface ModelItemProps {
  item: ModelState;
  isActive: boolean;
  onSetActive: (name: string) => void;
}

const ModelItem = React.memo<ModelItemProps>(({ item, isActive, onSetActive }) => {
  const theme = useTheme();
  const { status, progress, downloadModel, deleteModel } = useModelManager(item.model.name);

  console.log('ModelItem: Rendering', { item, isActive, progress, status });

  return (
    <View className="flex-row justify-between items-center p-4 rounded-lg mb-3" style={{ backgroundColor: theme.colors.card }}>
      <View className="flex-1">
        <Text className="text-base font-bold" style={{ color: theme.colors.text }}>{item.model.name}</Text>
        <Text className="text-xs capitalize opacity-60" style={{ color: theme.colors.text }}>{status.replace('_', ' ')}</Text>
      </View>
      <View className="ml-4 flex-row items-center">
        {status === 'downloaded' && !isActive && (
          <>
            <Button title="Set Active" color={theme.colors.primary} onPress={() => {
              if (item.status === 'downloaded') {
                console.log(`ModelItem: Set Active pressed for ${item.model.name}`);
                onSetActive(item.model.name);
              } else {
                console.log(`ModelItem: Set Active pressed for ${item.model.name}, but item.status is ${item.status}`);
              }
            }} />
            <Button title="Delete" color={theme.colors.notification} onPress={() => {
              console.log(`ModelItem: Delete pressed for ${item.model.name}`);
              deleteModel();
            }} />
          </>
        )}
        {status === 'downloaded' && isActive && (
          <>
            <Text className="font-bold" style={{ color: theme.colors.primary }}>Active</Text>
            <Button
              title="Delete"
              color={theme.colors.notification}
              onPress={() => {
                console.log(`ModelItem: Delete pressed for active model ${item.model.name}`);
                deleteModel();
              }}
            />
          </>
        )}
        {status === 'not_downloaded' && (
          <Button
            title="Download"
            color={theme.colors.primary}
            onPress={() => {
              console.log(`ModelItem: Download pressed for ${item.model.name}`);
              // @ts-ignore
              downloadModel({ name: item.model.name, url: item.model.links, status: 'not_downloaded', progress: 0, localPath: null, extension: item.model.extension });
            }} />
        )}
        {status === 'downloading' && (
          <Text style={{ color: theme.colors.text }}>Downloading... {(progress * 100).toFixed(2)}%</Text>
        )}
      </View>
    </View>
  );
});

export default function ModelManagementScreen() {
  console.log('ModelManagementScreen: Initialized');
  const theme = useTheme();
  const { activeModel, setActiveModel } = useChatStore();
  const { models, initializeModels } = useModelStore();
  const { activeSessionId, createNewSession } = useSessionStore();

  useEffect(() => {
    console.log('ModelManagementScreen: Initializing models');
    initializeModels();
  }, [initializeModels]);

  const handleSetActive = useCallback(async (name: string) => {
    console.log(`ModelManagementScreen: Setting active model to ${name}`);
    setActiveModel(name);
    let sessionId = activeSessionId;
    if (!sessionId) {
      console.log('ModelManagementScreen: No active session, creating a new one');
      sessionId = await createNewSession();
      console.log('ModelManagementScreen: createNewSession() has completed with id:', sessionId);
    }
    if (sessionId) {
      console.log('ModelManagementScreen: Navigating to / with sessionId:', sessionId);
      router.push('/');
    }
  }, [activeSessionId, createNewSession, setActiveModel]);

  const sections = [
    {
      title: 'Downloaded Models',
      data: Object.values(models).filter((m) => m.status === 'downloaded'),
    },
    {
      title: 'Available for Download',
      data: Object.values(models).filter((m) => m.status === 'not_downloaded'),
    },
    {
      title: 'Downloading',
      data: Object.values(models).filter((m) => m.status === 'downloading'),
    },
  ];

  return (
    <View className="flex-1 p-4" style={{ backgroundColor: theme.colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.model.name}
        renderItem={({ item }) => (
          <ModelItem
            item={item}
            isActive={activeModel === item.model.name}
            onSetActive={handleSetActive}
          />
        )}
        renderSectionHeader={({ section: { title, data } }) => {
          if (data.length === 0) {
            return null;
          }
          return <Text className="text-2xl font-bold mt-4 mb-2" style={{ color: theme.colors.text }}>{title}</Text>;
        }}
      />
    </View>
  );
}