import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useModelManager } from '@/hooks/useModelManager';
import { useTheme } from '@/hooks/useTheme';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { ModelState } from '@/store/types';
import { router } from "expo-router";
import React, { useCallback, useEffect } from 'react';
import { Button, SectionList, View } from 'react-native';

interface ModelItemProps {
  item: ModelState;
  isActive: boolean;
  onSetActive: (name: string) => void;
}

const ModelItem = React.memo<ModelItemProps>(({ item, isActive, onSetActive }) => {
  const colors = useTheme();
  const { status, progress, downloadModel, deleteModel } = useModelManager(item.model.name);

  console.log('ModelItem: Rendering', { item, isActive, progress, status });

  return (
    <View className="flex-row justify-between items-center p-4 rounded-lg mb-3" style={{ backgroundColor: colors.card }}>
      <View className="flex-1">
        <ThemedText className="text-base font-bold">{item.model.name}</ThemedText>
        <ThemedText className="text-xs capitalize" style={{ color: colors.mutedForeground }}>{status.replace('_', ' ')}</ThemedText>
      </View>
      <View className="ml-4 flex-row items-center">
        {status === 'downloaded' && !isActive && (
          <>
            <Button title="Set Active" color={colors.accent} onPress={() => {
              if (item.status === 'downloaded') {
                console.log(`ModelItem: Set Active pressed for ${item.model.name}`);
                onSetActive(item.model.name);
              } else {
                console.log(`ModelItem: Set Active pressed for ${item.model.name}, but item.status is ${item.status}`);
              }
            }} />
            <Button title="Delete" color={colors.destructive} onPress={() => {
              console.log(`ModelItem: Delete pressed for ${item.model.name}`);
              deleteModel();
            }} />
          </>
        )}
        {status === 'downloaded' && isActive && (
          <>
            <ThemedText className="font-bold" style={{ color: colors.accent }}>Active</ThemedText>
            <Button
              title="Delete"
              color={colors.destructive}
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
            color={colors.accent}
            onPress={() => {
              console.log(`ModelItem: Download pressed for ${item.model.name}`);
              // @ts-ignore
              downloadModel({ name: item.model.name, url: item.model.links, status: 'not_downloaded', progress: 0, localPath: null, extension: item.model.extension });
            }} />
        )}
        {status === 'downloading' && (
          <ThemedText>Downloading... {(progress * 100).toFixed(2)}%</ThemedText>
        )}
      </View>
    </View>
  );
});

export default function ModelManagementScreen() {
  console.log('ModelManagementScreen: Initialized');
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
    <ThemedView className="flex-1 p-4">
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
          return <ThemedText className="text-2xl font-bold mt-4 mb-2">{title}</ThemedText>;
        }}
      />
    </ThemedView>
  );
}