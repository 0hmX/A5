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

    console.log(`DownloaderModal: Initialized for model ${modelName}`);

    const handleNavigation = () => {
        if (router.canGoBack()) {
            console.log('DownloaderModal: Navigating back');
            router.back();
        } else {
            console.log('DownloaderModal: Replacing with home route');
            router.replace('/');
        }
    };

    useEffect(() => {
        if (!modelName) {
            console.log('DownloaderModal: Model name not provided');
            setError('Model name not provided.');
            handleNavigation();
            return;
        }

        const modelState = models[modelName];
        if (!modelState) {
            console.log(`DownloaderModal: Model '${modelName}' not found`);
            setError(`Model '${modelName}' not found.`);
            handleNavigation();
            return;
        }

        if (modelState.status === 'downloading' || modelState.status === 'downloaded') {
            console.log(`DownloaderModal: Model already downloaded or downloading`);
            handleNavigation();
            return;
        }

        const [llmService, serviceError] = LLMServiceFactory.getService(modelName!);

        if (serviceError) {
            console.log(`DownloaderModal: Service error: ${serviceError.message}`);
            setError(serviceError.message);
            handleNavigation();
            return;
        }

        const download = async () => {
            console.log(`DownloaderModal: Starting download for ${modelName}`);
            setModelStatus(modelName, 'downloading');
            const [_, error] = await llmService.downloadModel(modelName, (p) => {
                console.log(`DownloaderModal: Download progress: ${p * 100}`);
                setProgress(p * 100);
            });

            if (error) {
                console.log(`DownloaderModal: Download error: ${error.message}`);
                setError(error.message);
                setModelStatus(modelName, 'not_downloaded');
            } else {
                console.log(`DownloaderModal: Download successful for ${modelName}`);
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

