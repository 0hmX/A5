import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { SectionList, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useModelManager } from '@/hooks/useModelManager';
import useChatStore from '@/store/chatStore';
import useModelStore from '@/store/modelStore';
import useSessionStore from '@/store/sessionStore';
import { ModelState } from '@/store/types';

interface ModelItemProps {
  item: ModelState;
  isActive: boolean;
  onSetActive: (name: string) => void;
}

const ModelItem = React.memo<ModelItemProps>(({ item, isActive, onSetActive }) => {
  const { status, progress, speedMbps, downloadModel, deleteModel } = useModelManager(item.model.name);

  return (
    <View className="bg-card flex-row justify-between items-center p-4 rounded-lg mb-3">
      <View className="flex-1">
        <Text variant="body" className="font-bold text-foreground">{item.model.name}</Text>
        <Text variant="caption" className="capitalize text-muted-foreground">{status.replace('_', ' ')}</Text>
      </View>

      <View className="ml-4 flex-row items-center gap-2">
        {status === 'downloaded' && !isActive && (
          <>
            <Button variant="ghost" size="sm" onPress={() => deleteModel()}>
              Delete
            </Button>
            <Button variant="primary" size="sm" onPress={() => onSetActive(item.model.name)}>
              Set Active
            </Button>
          </>
        )}
        {status === 'downloaded' && isActive && (
          <>
            <Text variant="body" className="font-bold text-primary">Active</Text>
            <Button variant="ghost" size="sm" onPress={() => deleteModel()} className="ml-2">
              Delete
            </Button>
          </>
        )}
        {status === 'not_downloaded' && (
          <Button
            variant="primary"
            size="sm"
            onPress={() => downloadModel({
              name: item.model.name,
              // @ts-ignore
              url: item.model.links,
              status: 'not_downloaded',
              progress: 0,
              localPath: null,
              extension: item.model.extension
            })}
          >
            Download
          </Button>
        )}
        {status === 'downloading' && (
          <Text variant="caption" className="text-muted-foreground">
            Downloading... {(progress * 100).toFixed(0)}%
            {speedMbps !== null ? ` (${speedMbps.toFixed(2)} Mbps)` : ''}
          </Text>
        )}
      </View>
    </View>
  );
});

export default function ModelManagementScreen() {
  const { activeModel, setActiveModel } = useChatStore();
  const { models, initializeModels } = useModelStore();
  const { activeSessionId, createNewSession } = useSessionStore();

  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  const handleSetActive = useCallback(async (name: string) => {
    setActiveModel(name);
    if (!activeSessionId) {
      await createNewSession();
    }
    router.push('/');
  }, [activeSessionId, createNewSession, setActiveModel]);

  const sections = [
    {
      title: 'Active & Downloaded Models',
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
    <View className="flex-1 bg-background p-container">
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
          return <Text variant="subheading" className="mt-4 mb-2">{title}</Text>;
        }}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}