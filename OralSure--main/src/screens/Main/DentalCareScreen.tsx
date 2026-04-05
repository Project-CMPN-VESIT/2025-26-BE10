// src/screens/Main/DentalCareScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { StackScreenProps } from '@react-navigation/stack';
import HeaderMenu from '../../components/common/HeaderMenu'; 

type DentalCareScreenProps = StackScreenProps<MainStackParamList, 'DentalCare'>;

interface DentalCareProps extends DentalCareScreenProps {
    onSignOut: () => void; // <--- ADDED PROP
}

// Define placeholder image sources
const IconPlaceholder = "https://placehold.co/60x60/E9574A/fff?text=i";
const BrushIconPlaceholder = require('../../assets/images/tooth-brush.png');
const DietIconPlaceholder = require('../../assets/images/healthy-food.png');
const VisitIconPlaceholder = require('../../assets/images/dental-clinic.png');

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;

const DentalCareScreen: React.FC<DentalCareProps> = ({ navigation, onSignOut }) => {
    const { t } = useTranslation();

    const carePoints = [
        {
            title: t('brushing_flossing_title'),
            details: [
                "Brush twice a day with fluoride toothpaste.",
                "Replace toothbrush every 3 months.",
                "Daily flossing removes plaque between teeth.",
            ],
            image: BrushIconPlaceholder,
        },
        {
            title: t('healthy_diet_title'),
            details: [
                "Limit sugar, eat calcium-rich foods.",
                "Drinking water helps wash away bacteria.",
            ],
            image: DietIconPlaceholder,
        },
        {
            title: t('regular_visits_title'),
            details: [
                "Visit your dentist every 6 months.",
                "Early check up prevents major dental issues.",
            ],
            image: VisitIconPlaceholder,
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* <View style={styles.menuContainer}>
                <HeaderMenu navigation={navigation as any} onSignOut={onSignOut} />
            </View> */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                
                <HeaderMenu 
                    title={t('dental_care_header')}
                    navigation={navigation as any}
                    onSignOut={onSignOut}
                />

                {/* Header matching Figma style */}
                {/* <View style={headerStyles.container}>
                    <View style={headerStyles.waveShape} />
                    <Text style={headerStyles.title}>{t('dental_care_header')}</Text>
                </View> */}

                <View style={styles.content}>
                    <Text style={styles.mainSubtitle}>{t('why_dental_care')}</Text>
                    <Text style={styles.quote}>{t('dental_care_quote')}</Text>

                    {carePoints.map((point, index) => (
                        <View key={index} style={styles.carePointCard}>
                            <Image 
                                source={point.image} 
                                style={styles.image}
                                onError={() => console.log('Image failed to load')}
                            />
                            <View style={styles.textContainer}>
                                <Text style={styles.pointTitle}>{point.title}</Text>
                                {point.details.map((detail, detailIndex) => (
                                    <Text key={detailIndex} style={styles.pointDetail}>
                                        • {detail}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    ))}
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
        paddingBottom: height * 0.05,
    },
    content: {
        paddingHorizontal: width * 0.05,
        marginTop: height * 0.02, 
        zIndex: 2,
    },
    mainSubtitle: {
        fontSize: scale(22),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    quote: {
        fontSize: scale(15),
        fontStyle: 'italic',
        color: '#666',
        marginBottom: height * 0.04,
        paddingHorizontal: width * 0.05,
        textAlign: 'center',
        lineHeight: scale(20),
    },
    carePointCard: {
        flexDirection: 'row',
        alignItems: 'center', // Centers icon vertically relative to text block
        marginBottom: height * 0.025,
        backgroundColor: '#fff',
        padding: scale(15),
        borderRadius: 15,
        // Responsive shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    image: {
        width: scale(70), // Scales icon based on screen width
        height: scale(70),
        marginRight: width * 0.04,
        borderRadius: 12,
        resizeMode: 'contain',
    },
    textContainer: {
        flex: 1,
    },
    pointTitle: {
        fontSize: scale(17),
        fontWeight: '700',
        color: '#E9574A', // Using your theme color for titles
        marginBottom: 4,
    },
    pointDetail: {
        fontSize: scale(14),
        color: '#555',
        lineHeight: scale(19),
        marginVertical: 1,
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40, 
        right: width * 0.05,
        zIndex: 100, 
    },
});

export default DentalCareScreen;