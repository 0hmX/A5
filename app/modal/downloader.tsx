import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Button, StyleSheet } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useTheme } from '../../hooks/useTheme';
import { LLMServiceFactory } from '../../services/llm/LLMServiceFactory';
import useAppStore from '../../store/appStore';

export default function DownloaderModal() {
    const color = useTheme(); // Use the new useTheme hook
    const { modelName } = useLocalSearchParams<{ modelName: string }>();
    const { models, setModelStatus, setProgress, progress, setError } = useAppStore();

    const handleNavigation = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    useEffect(() => {
        if (!modelName) {
            setError('Model name not provided.');
            handleNavigation();
            return;
        }

        const modelState = models[modelName];
        if (!modelState) {
            setError(`Model '${modelName}' not found.`);
            handleNavigation();
            return;
        }

        const [llmService, serviceError] = LLMServiceFactory.getService(modelName!);

        if (serviceError) {
            setError(serviceError.message);
            handleNavigation();
            return;
        }

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
            handleNavigation();
        };

        download();
    }, [modelName, models, setModelStatus, setProgress, setError]);

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.statusText}>Downloading {modelName}...</ThemedText>
            <ActivityIndicator size="large" color={color.tint} style={styles.progress} />
            <ThemedText>{progress.toFixed(2)}%</ThemedText>
            <Button title="Cancel" color={color.destructive} onPress={handleNavigation} />
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

