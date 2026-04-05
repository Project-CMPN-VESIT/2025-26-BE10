import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    ScrollView, 
    Dimensions 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { StackScreenProps } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

type ScanSetupProps = StackScreenProps<MainStackParamList, 'ScanSetup'>;

const ScanSetupScreen: React.FC<ScanSetupProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { scanType } = route.params;

    // Standardized instructions with visual markers
    const instructionItems = [
        { id: 1, text: t('scan_setup_instruction_1'), icon: '💡' },
        { id: 2, text: t('scan_setup_instruction_2'), icon: '📸' },
        { id: 3, text: t('scan_setup_instruction_3'), icon: '✨' },
    ];

    const handleStartScan = () => {
        navigation.navigate('Camera', { scanType });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>{t('scan_setup_header')}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {scanType === 'teeth' ? t('Teeth Scan') : t('Oral Cavity')}
                        </Text>
                    </View>
                </View>

                {/* Illustration Placeholder - You can add a Lottie or Image here later */}
                <View style={styles.illustrationContainer}>
                    <Text style={{fontSize: 50}}>📱</Text>
                </View>

                {/* Instruction Card */}
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionTitle}>
                        {t('How to get best results')}
                    </Text>
                    {instructionItems.map((item) => (
                        <View key={item.id} style={styles.instructionItem}>
                            <Text style={styles.iconStyle}>{item.icon}</Text>
                            <Text style={styles.instructionText}>{item.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.startButton} 
                        onPress={handleStartScan}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.startButtonText}>{t('start_scan')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>{t('Go Back')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: width * 0.06, // 6% of screen width
        paddingVertical: height * 0.03,
        alignItems: 'center',
    },
    headerContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: height * 0.03,
    },
    headerTitle: {
        fontSize: width * 0.07,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
    },
    badge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
    },
    badgeText: {
        color: '#E9574A',
        fontWeight: '600',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    illustrationContainer: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#F9FAFB',
        borderRadius: width * 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: height * 0.04,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    instructionBox: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: width * 0.05,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 3,
        marginBottom: height * 0.05,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 20,
        textAlign: 'left',
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconStyle: {
        fontSize: 20,
        marginRight: 15,
    },
    instructionText: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    startButton: {
        width: '100%',
        height: 60,
        backgroundColor: '#E9574A',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#E9574A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    startButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
    }
});

export default ScanSetupScreen;