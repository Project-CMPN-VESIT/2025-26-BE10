import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import HeaderMenu from '../../components/common/HeaderMenu';

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'>;

interface Props {
    navigation: HomeScreenNavigationProp;
    onSignOut: () => void;
}

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard iPhone 11/13 screen
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
// const TeethIcon = () => (<Text style={styles.icon}>🦷</Text>);
const LipsIcon = () => (<Text style={styles.icon}>👄</Text>);
const ChatIcon = () => (<Text style={styles.chatIconText}>💬</Text>); // New Chat Icon component

const HomeScreen: React.FC<Props> = ({ navigation, onSignOut }) => {
    const { t } = useTranslation();

    // const handleCheckTeeth = () => {
    //     navigation.navigate('ScanSetup', { scanType: 'teeth' }); 
    // };

    const handleCheckOralCavity = () => {
    // Make sure 'Camera' is the name defined in your AppNavigator.tsx
        navigation.navigate('Camera', { scanType: 'oral_cavity' }); 
    };

    // NEW: Function to navigate to Chatbot
    const handleOpenChatbot = () => {
        navigation.navigate('Chatbot');
    };

    

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={{ flex: 1 }}> 
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <HeaderMenu 
                        title={t('check_dental_health_title')}
                        navigation={navigation as any}
                        onSignOut={onSignOut}
                    />
                    <View style={styles.contentArea}>
                        <Text style={styles.subtitle}>{t('quick_self_check_subtitle')}</Text>

                        {/* <TouchableOpacity style={styles.card} onPress={handleCheckTeeth}>
                            <TeethIcon />
                            <Text style={styles.cardTitle}>{t('check_my_teeth')}</Text>
                            <Text style={styles.cardDescription}>{t('check_teeth_description')}</Text>
                        </TouchableOpacity> */}

                        <TouchableOpacity style={styles.card} onPress={handleCheckOralCavity}>
                            <LipsIcon />
                            <Text style={styles.cardTitle}>{t('check_oral_cavity')}</Text>
                            <Text style={styles.cardDescription}>{t('check_oral_cavity_description')}</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.emptyUtilityLinks} />

                        
                    </View>
                </ScrollView>

                {/* --- CHATBOT FLOATING BUTTON --- */}
                <TouchableOpacity 
                    style={styles.chatButton} 
                    onPress={handleOpenChatbot}
                    activeOpacity={0.8}
                >
                    <ChatIcon />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        // Using theme color for top/bottom notches on iOS
        backgroundColor: '#E9574A', 
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingBottom: height * 0.1, // Extra space for floating button
    },
    contentArea: {
        paddingHorizontal: width * 0.06,
        marginTop: height * 0.03,
        zIndex: 2,
    },
    subtitle: {
        fontSize: scale(18),
        fontWeight: '500',
        color: '#333',
        marginBottom: height * 0.03,
        textAlign: 'center', // Center aligned for better visual balance
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: scale(25),
        marginBottom: height * 0.025,
        alignItems: 'center',
        // Responsive shadow/elevation
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
        borderWidth: Platform.OS === 'android' ? 0 : 1,
        borderColor: '#f0f0f0',
    },
    icon: {
        fontSize: scale(50),
        marginBottom: 10,
        color: '#E9574A',
    },
    cardTitle: {
        fontSize: scale(20),
        fontWeight: '700',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: scale(14),
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: scale(10),
        lineHeight: scale(20),
    },
    emptyUtilityLinks: {
        height: height * 0.06, 
    },
    // DYNAMIC CHATBOT FLOATING BUTTON
    chatButton: {
        position: 'absolute',
        bottom: height * 0.04, // Relative to screen height
        right: width * 0.06,  // Relative to screen width
        backgroundColor: '#E9574A',
        width: scale(65),
        height: scale(65),
        borderRadius: scale(32.5),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    chatIconText: {
        fontSize: scale(32),
        color: '#fff',
    },
});

export default HomeScreen;