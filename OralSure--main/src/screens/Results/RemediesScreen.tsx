// src/screens/Results/RemediesScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';
import HeaderMenu from '../../components/common/HeaderMenu';

// type RemediesScreenProps = StackScreenProps<MainStackParamList, 'Remedies'>;

interface RemediesProps extends StackScreenProps<MainStackParamList, 'Remedies'> {
    onSignOut: () => void; // <--- ADDED PROP
}
const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard iPhone 11/13 screen
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;


const HomeRemediesScreen: React.FC<RemediesProps> = ({ navigation, onSignOut }) => {
    const { t } = useTranslation();

    // Data structure mirroring the Figma content
    const remedies = [
        { title: t('remedy_saltwater_rinse'), description: "Mix 1 teaspoon salt in a glass of warm water, rinse 2-3 times daily." },
        { title: t('remedy_baking_soda'), description: "Neutralizes acids and reduces irritation (½ teaspoon baking soda in warm water)." },
        { title: t('remedy_honey'), description: "Dab a little honey directly on the ulcer, it has antibacterial + soothing properties." },
        { title: t('remedy_coconut_oil'), description: "Apply gently; helps reduce pain and prevents infection." },
        { title: t('remedy_aloe_vera'), description: "Natural healing and soothing agent." },
        { title: t('remedy_avoid_spicy'), description: "Helps prevent irritation and promotes healing." },
        { title: t('remedy_stay_hydrated'), description: "Drink enough water to avoid dryness which can worsen ulcers." },
        { title: t('remedy_cold_compress'), description: "Ice chips or cold water can numb pain temporarily." },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* <View style={styles.menuContainer}>
                <HeaderMenu navigation={navigation as any} onSignOut={onSignOut} />
            </View> */}

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                <HeaderMenu 
                    title={t('remedies_header')}
                    navigation={navigation as any}
                    onSignOut={onSignOut}
                />
                {/* Header matching Figma style */}
                {/* <View style={headerStyles.container}>
                    <View style={headerStyles.waveShape} />
                    <Text style={headerStyles.title}>{t('remedies_header')}</Text>
                </View> */}

                <View style={styles.content}>
                    {remedies.map((remedy, index) => (
                        <View key={index} style={styles.remedyItem}>
                            <Text style={styles.remedyTitle}>{remedy.title}: </Text>
                            <Text style={styles.remedyDescription}>{remedy.description}</Text>
                        </View>
                    ))}
                </View>

                {/* Back Button matching Figma style */}
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Back to Chatbot</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: height * 0.05,
    },
    content: {
        paddingHorizontal: width * 0.06, // 6% padding for better readability
        marginTop: height * 0.02, 
        zIndex: 2,
    },
    remedyItem: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: height * 0.025,
        alignItems: 'flex-start',
        backgroundColor: '#fafafa', // Light contrast background
        padding: scale(12),
        borderRadius: 12,
    },
    remedyTitle: {
        fontSize: scale(16),
        fontWeight: 'bold',
        color: '#333',
        marginRight: 5,
        lineHeight: scale(22),
    },
    remedyDescription: {
        flexShrink: 1,
        fontSize: scale(15),
        color: '#555',
        lineHeight: scale(22),
    },
    backButton: {
        height: Math.min(height * 0.065, 55), // Caps the height on very large screens
        backgroundColor: '#FA8072',
        borderRadius: 30, // More pill-shaped
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: width * 0.1, // Center the button more with wider margins
        marginTop: height * 0.04,
        // Responsive shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: scale(17),
    },
});
export default HomeRemediesScreen;