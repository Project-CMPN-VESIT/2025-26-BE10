// src/screens/Main/AboutUsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { StackScreenProps } from '@react-navigation/stack';
import HeaderMenu from '../../components/common/HeaderMenu'; 


type AboutUsScreenProps = StackScreenProps<MainStackParamList, 'AboutUs'>;

interface AboutUsProps extends AboutUsScreenProps {
    onSignOut: () => void; // <--- ADDED PROP
}
// Placeholder image for the dentist scene (from Figma)
const DentistImage = require('../../assets/images/dentist.jpeg');
const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;

const AboutUsScreen: React.FC<AboutUsProps> = ({ navigation, onSignOut }) => {
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* <View style={styles.menuContainer}>
                <HeaderMenu navigation={navigation as any} onSignOut={onSignOut} />
            </View> */}
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                
                <HeaderMenu 
                    title={t('about_us_header')}
                    navigation={navigation as any}
                    onSignOut={onSignOut}
                />


                <View style={styles.content}>
                    {/* <Text style={styles.bodyText}>{t('about_us_body_1')}</Text> */}
                    {/* Text Block 1 Container (Aligned Left) */}
                    <View style={styles.textBlockContainer}>
                        <Text style={styles.bodyText}>{t('about_us_body_1')}</Text>
                    </View>

                    <View style={styles.imageContainer}>
                        <Image 
                            // --- FIX 2: Pass the ID directly to the source prop ---
                            source={DentistImage} 
                            style={styles.mainImage}
                        />
                    </View>

                    {/* Text Block 2 Container (Aligned Left) */}
                    <View style={styles.textBlockContainer}>
                        <Text style={styles.bodyText}>{t('about_us_body_2')}</Text>
                    </View>
                </View>

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
        paddingBottom: height * 0.05, // Dynamic bottom padding
    },
    content: {
        paddingHorizontal: width * 0.05, // 5% of screen width
        marginTop: -height * 0.06, // Responsive overlap with the header
        zIndex: 2,
    },
    textBlockContainer: {
        marginBottom: height * 0.025,
        backgroundColor: '#f9f9f9',
        borderRadius: 15, // Slightly more rounded for modern feel
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.025,
        // Responsive shadow/elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    bodyText: {
        fontSize: scale(15), // Scaled font size
        color: '#444', // Slightly softer black for readability
        lineHeight: scale(22), // Balanced line height for large text blocks
        textAlign: 'left',
    },
    imageContainer: {
        alignItems: 'center',
        paddingVertical: height * 0.015,
        marginBottom: height * 0.02,
    },
    mainImage: {
        width: width * 0.9, // 90% of screen width
        height: (width * 0.9) * 0.56, // Maintain 16:9 aspect ratio dynamically
        alignSelf: 'center',
        borderRadius: 12,
        resizeMode: 'cover',
    },
});

export default AboutUsScreen;