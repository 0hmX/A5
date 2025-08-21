import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaPipeLLMService } from '@/services/llm/MediaPipeLLMService';
import useAppStore from '@/store/appStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Button, StyleSheet } from 'react-native';

export default function DownloaderModal() {
    const tint = useThemeColor({}, 'tint');
    const { modelName } = useLocalSearchParams<{ modelName: string }>();
    const { setModelStatus, setProgress, progress, setError } = useAppStore();

    useEffect(() => {
        if (!modelName) {
            setError('Model name not provided.');
            router.back();
            return;
        }

        const llmService = new MediaPipeLLMService();

        const download = async () => {
            setModelStatus(modelName, 'downloading');
            const [_, error] = await llmService.downloadModel(modelName, (p) => {
                setProgress(p * 100);
            });

            if (error) {
                setError(error.message);
                setModelStatus(modelName, 'not_downloaded');
            } else {
                setModelStatus(modelName, 'downloaded');
            }
            router.back();
        };

        download();
    }, [modelName, setModelStatus, setProgress, setError]);

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.statusText}>Downloading {modelName}...</ThemedText>
            <ActivityIndicator size="large" color={tint} style={styles.progress} />
            <ThemedText>{progress.toFixed(2)}%</ThemedText>
            <Button title="Cancel" color="red" onPress={() => router.back()} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 20,
        marginBottom: 20,
    },
    progress: {
        marginVertical: 20,
    },
});
