import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabaseClient'; 
import { decode } from 'base64-arraybuffer';

type LoadingScreenProps = StackScreenProps<MainStackParamList, 'Loading'>;

const { width, height } = Dimensions.get('window');

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { base64, scanType } = route.params;

    // API URLs
    const GRADIO_URL = 'https://juhi-birare-oral-sure-model.hf.space/gradio_api/call/predict_oral_health';
    const BACKEND_FINALIZE_URL = 'https://oralsure-api.onrender.com/finalize_report';

    useEffect(() => {
        let isMounted = true;

        const processImage = async () => {
            try {
                // 1. Authenticate User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !base64) throw new Error('Auth or image data missing.');

                // 2. Upload Raw Image to Supabase Storage (For medical records)
                const filePath = `${user.id}/${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('oral-photos')
                    .upload(filePath, decode(base64), { 
                        contentType: 'image/jpeg',
                        upsert: true 
                    });

                if (uploadError) console.warn("Storage upload failed, continuing to AI...");

                // 3. Prepare AI Call
                const base64Image = `data:image/jpeg;base64,${base64}`;
                const response = await fetch(GRADIO_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: [base64Image] }),
                });

                const resJson = await response.json();
                const event_id = resJson.event_id;
                if (!event_id) throw new Error("Failed to start AI job.");

                // 4. Polling for AI Result
                let resultData = null;
                let attempts = 0;
                while (!resultData && attempts < 50 && isMounted) {
                    const statusRes = await fetch(`${GRADIO_URL}/${event_id}`);
                    const text = await statusRes.text();
            
                    if (text.includes('event: complete')) {
                        const lines = text.split('\n');
                        const dataLine = lines.find(l => l.startsWith('data: '));
                        if(dataLine) {
                            resultData = JSON.parse(dataLine.replace('data: ', ''));
                        }
                    } else if (text.includes('event: error')) {
                        throw new Error("AI Processing failed.");
                    }

                    if (!resultData) {
                        attempts++;
                        await new Promise(resolve => setTimeout(() => resolve(null), 1000));
                    }
                }

                if (!resultData && isMounted) throw new Error("Analysis timed out.");

                // 5. Extract Results
                const diagnosisLabel = resultData[0];
                const markedImageUrl = resultData[1]?.url || resultData[1];

                // --- ALIGNMENT STEP: Finalize Report in Backend ---
                // This updates the 'reports' table and links it to the 'profile'
                if (isMounted) {
                    try {
                        await fetch(BACKEND_FINALIZE_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                user_id: user.id,
                                scan_data: {
                                    diagnosis: diagnosisLabel,
                                    scan_type: scanType,
                                    ai_image_url: markedImageUrl
                                }
                            }),
                        });
                    } catch (e) {
                        console.error("Backend finalization failed, but showing report anyway.");
                    }

                    // 6. Navigate to Report
                    navigation.replace('Report', { 
                        imageUrl: markedImageUrl,
                        diagnosis: diagnosisLabel
                    });
                }

            } catch (error: any) {
                if (isMounted) {
                    Alert.alert("Analysis Failed", error.message);
                    navigation.goBack();
                }
            }
        };

        processImage();
        
        const globalTimeout = setTimeout(() => {
            if (isMounted) {
                Alert.alert("Timeout", "Server busy. Please try again later.");
                navigation.goBack();
            }
        }, 60000);

        return () => {
            isMounted = false;
            clearTimeout(globalTimeout);
        };
    }, [navigation, base64]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.loaderWrapper}>
                    <ActivityIndicator size="large" color="#E9574A" />
                    <View style={styles.pulseRing} />
                </View>
                <Text style={styles.header}>{t('Analyzing Scan...')}</Text>
                <Text style={styles.subtitle}>
                    Our AI is identifying signs of infection or inflammation. This usually takes 10-15 seconds.
                </Text>
                <View style={styles.tipCard}>
                    <Text style={styles.tipText}>💡 Tip: High-quality lighting results in 40% better accuracy.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#FFFFFF' 
    },
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: width * 0.1 
    },
    loaderWrapper: {
        marginBottom: height * 0.05,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pulseRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#E9574A',
        opacity: 0.2
    },
    header: { 
        fontSize: width * 0.065, 
        fontWeight: 'bold', 
        color: '#1F2937', 
        marginBottom: 15,
        textAlign: 'center'
    },
    subtitle: { 
        fontSize: width * 0.04, 
        color: '#6B7280', 
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: height * 0.04
    },
    tipCard: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: '100%'
    },
    tipText: {
        fontSize: 13,
        color: '#4B5563',
        textAlign: 'center',
        fontStyle: 'italic'
    }
});

export default LoadingScreen;