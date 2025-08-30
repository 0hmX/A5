import { Ionicons } from '@expo/vector-icons';
import { useUnstableNativeVariable } from 'nativewind';
import React, { useCallback, useEffect } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import { InfiniteProgressBar } from '@/components/InfiniteProgressBar';
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

  const formattedSize = item.model.size < 1024 ? `${item.model.size} MB` : `${(item.model.size / 1024).toFixed(2)} GB`;
  const destructive = useUnstableNativeVariable('--destructive');
  const primary = useUnstableNativeVariable('--primary');


  return (
    <View className="bg-card flex-row justify-between items-center p-4 rounded-lg mb-3">
      <View className="flex-1">
        <Text className="text-body font-bold text-foreground">{item.model.name}</Text>
        <View className="flex-row flex-wrap gap-x-2 mt-1">
          {item.model.tags.map((tag) => (
            <Text key={tag} className="text-caption text-muted-foreground">
              #{tag}
            </Text>
          ))}
          <Text className="text-caption text-muted-foreground">
            Backend: {item.model.backend}
          </Text>
          <Text className="text-caption text-muted-foreground">
            Size: {formattedSize}
          </Text>
        </View>
      </View>

      <View className="ml-4 flex-row items-center gap-2">
        {status === 'downloaded' && !isActive && (
          <>
            <Pressable onPress={() => deleteModel()} className="p-2 rounded-full text-destructive">
              <Ionicons color={destructive} name="trash" size={18} />
            </Pressable>
            <Pressable onPress={() => onSetActive(item.model.name)} className="p-2 rounded-full bg-primary/10 text-primary">
              <Ionicons color={primary} name="checkmark" size={18} />
            </Pressable>
          </>
        )}
        {status === 'downloaded' && isActive && (
          <>
            <Text className="text-body font-bold text-primary">Active</Text>
            <Pressable onPress={() => deleteModel()} className="p-2 rounded-full ml-2 text-destructive">
              <Ionicons color={destructive} name="trash" size={18} />
            </Pressable>
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
          <View className="flex-col items-end gap-1 w-24">
            {progress < 0.01 ? (
              <InfiniteProgressBar />
            ) : (
              <View className="w-full h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
            )}
            <Text className="text-caption text-muted-foreground">
              {(progress * 100).toFixed(0)}%
            </Text>
            {speedMbps !== null && (
              <Text className="text-caption text-muted-foreground">
                {speedMbps.toFixed(1)} Mbps
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

export default function ModelManagement() {
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
    <View className="flex-1 bg-background p-4">
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
          return <Text className="text-subheading mt-4 mb-2 text-foreground">{title}</Text>;
        }}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}
