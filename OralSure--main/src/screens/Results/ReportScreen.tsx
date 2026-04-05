import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator, 
    Alert,
    Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabaseClient';
import { saveScanRecord } from '../../services/aiService';

type ReportScreenProps = StackScreenProps<MainStackParamList, 'Report'>;

const { width, height } = Dimensions.get('window');

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const [isSecuring, setIsSecuring] = useState(true);
    
    // Params from previous screen
    const imageUrl = route.params?.imageUrl ?? '';
    const rawDiagnosis = route.params?.diagnosis ?? 'No result found';
    
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [savedScanId, setSavedScanId] = useState<string | null>(null);

    // Normalize diagnosis label
    const diagnosisLabel = typeof rawDiagnosis === 'string' 
        ? rawDiagnosis 
        : (rawDiagnosis.label || "Condition Detected");

    const isHealthy = diagnosisLabel.toLowerCase().includes('healthy');

    useEffect(() => {
        const handleReportFlow = async () => {
            if (!imageUrl) {
                setIsSecuring(false);
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not authenticated");

                // 1. Save record to DB
                const savedData = await saveScanRecord(user.id, imageUrl, diagnosisLabel, "oral_scan");
                
                if (savedData && savedData[0]?.id) {
                    setSavedScanId(savedData[0].id);
                }

                // 2. Generate Signed URL for secure viewing
                const rawPath = savedData[0].image_url.trim();
                const finalPath = rawPath.startsWith('oral-photos/') 
                    ? rawPath.replace('oral-photos/', '') 
                    : rawPath;

                const { data: signedData, error: signedError } = await supabase.storage
                    .from('oral-photos') 
                    .createSignedUrl(finalPath, 3600); 

                if (signedError) throw signedError;

                if (signedData?.signedUrl) {
                    setDisplayUrl(signedData.signedUrl);
                }
            } catch (error: any) {
                console.error("Storage Error:", error.message);
                // Fallback to public URL if signing fails
                if (imageUrl.startsWith('http')) {
                    setDisplayUrl(imageUrl);
                }
            } finally {
                setIsSecuring(false);
            }
        };

        handleReportFlow();
    }, [imageUrl, diagnosisLabel]);

    const handleViewFullReport = async () => {
        if (!savedScanId) {
            Alert.alert("Data Pending", "We are still securing your scan record. Please wait a second.");
            return;
        }


        setIsFinalizing(true);
        const wakingUpAlert = setTimeout(() => {
            Alert.alert("Server Notice", "Compiling your clinical data. This may take a moment...");
        }, 5000);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const response = await fetch('https://oralsure-api.onrender.com/finalize_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    scan_id: savedScanId,
                    scan_data: { 
                        label: diagnosisLabel, 
                        imageUrl: imageUrl 
                    }
                }),
            });

            clearTimeout(wakingUpAlert);
            if (!response.ok) throw new Error("Server rejected request");

            const result = await response.json();
            if (result.status === 'success' && result.report_id) {
                navigation.navigate('FullReport', { reportId: result.report_id });
            }          
        } catch (error: any) {
            clearTimeout(wakingUpAlert);
            Alert.alert("Error", "Unable to generate report. Please try again later.");
        } finally {
            setIsFinalizing(false);
        }   
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <Text style={styles.reportHeader}>Analysis Result</Text>
                    <Text style={styles.scanDate}>
                        Verified: {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </View>

                {/* AI Annotated Image Card */}
                <View style={styles.imageCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>AI Visual Analysis</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isHealthy ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Text style={[styles.statusText, { color: isHealthy ? '#065F46' : '#991B1B' }]}>
                                {isHealthy ? 'Normal' : 'Action Required'}
                            </Text>
                        </View>
                    </View>
                    
                    {displayUrl ? (
                        <Image source={{ uri: displayUrl }} style={styles.analyzedImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.noImagePlaceholder}>
                            <ActivityIndicator size="large" color="#E9574A" />
                            <Text style={styles.loadingText}>Securing Image Data...</Text>
                        </View>
                    )}
                </View>

                {/* Findings Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Primary Observation</Text>
                    <Text style={styles.diagnosisText}>{diagnosisLabel}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.recommendationText}>
                        {isHealthy 
                            ? "Your scan shows no immediate signs of concern. Maintain regular oral hygiene."
                            : "Potential irregularities detected. We recommend a clinical evaluation by a specialist."}
                    </Text>
                </View>   

                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.fullReportButton, isFinalizing && { opacity: 0.7 }]}
                        onPress={handleViewFullReport}
                        disabled={isFinalizing}
                    >   
                        {isFinalizing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.fullReportButtonText}>View Detailed Clinical Report</Text>
                        )}
                    </TouchableOpacity>

                    {!isHealthy && (
                        <TouchableOpacity 
                            style={styles.clinicButton} 
                            onPress={() => navigation.navigate('ClinicLocator')}
                        >
                            <Text style={styles.clinicButtonText}>🏥 Find Nearby Specialists</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={styles.homeButton} 
                        onPress={() => navigation.navigate('Chatbot')}
                    >
                        <Text style={styles.homeButtonText}>Return to Consultation</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContainer: { 
        paddingHorizontal: width * 0.05, 
        paddingVertical: height * 0.03 
    },
    headerContainer: { marginBottom: height * 0.025 },
    reportHeader: { 
        fontSize: width * 0.08, 
        fontWeight: 'bold', 
        color: '#0F172A' 
    },
    scanDate: { 
        fontSize: 13, 
        color: '#64748B', 
        marginTop: 4 
    },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 24, 
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12
    },
    imageCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 12, 
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4
    },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    analyzedImage: { 
        width: '100%', 
        height: height * 0.35, 
        borderRadius: 16, 
        backgroundColor: '#F1F5F9' 
    },
    noImagePlaceholder: { height: height * 0.35, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 12, fontWeight: '500' },
    cardTitle: { 
        fontSize: 11, 
        fontWeight: '800', 
        color: '#94A3B8', 
        textTransform: 'uppercase', 
        letterSpacing: 1.5 
    },
    diagnosisText: { 
        fontSize: width * 0.06, 
        fontWeight: 'bold', 
        color: '#1E293B', 
        marginTop: 10 
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16
    },
    recommendationText: { 
        fontSize: 15, 
        color: '#475569', 
        lineHeight: 24 
    },
    buttonContainer: { marginTop: 12, gap: 12 },
    fullReportButton: { 
        backgroundColor: '#1E293B', 
        paddingVertical: 18, 
        borderRadius: 16, 
        alignItems: 'center',
        elevation: 2
    },
    fullReportButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    clinicButton: { 
        backgroundColor: '#FFFFFF', 
        borderWidth: 2, 
        borderColor: '#1E293B', 
        paddingVertical: 18, 
        borderRadius: 16, 
        alignItems: 'center' 
    },
    clinicButtonText: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
    homeButton: { 
        backgroundColor: '#E9574A', 
        paddingVertical: 18, 
        borderRadius: 16, 
        alignItems: 'center',
        elevation: 2
    },
    homeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});

export default ReportScreen;