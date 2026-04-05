// src/components/common/HeaderMenu.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';
import Svg, { Path } from 'react-native-svg'; 

// This utility type filters MainStackParamList keys, keeping only those 
// screens that expect 'undefined' (no required parameters).

const { width } = Dimensions.get('window');
const WAVE_COLOR = '#FA8072'; 
const HEADER_HEIGHT = 200;
const TEXT_START_Y = 60; // Y position for the Title
const MENU_START_Y = 25;
const scale = (size: number) => (width / 375) * size;

type MenuScreens = {
    [K in keyof MainStackParamList]: MainStackParamList[K] extends undefined | object ? K : never
}[keyof MainStackParamList];

type MainScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface HeaderMenuProps {
    navigation: MainScreenNavigationProp;
    onSignOut: () => void;
    title: string;
}

// const { width } = Dimensions.get('window');

const HeaderMenu: React.FC<HeaderMenuProps> = ({ navigation, onSignOut, title }) => {
    const { t } = useTranslation();
    const [menuVisible, setMenuVisible] = useState(false);

    // UPDATED menuItems: Includes all 5 utility pages + Home
    const menuItems: { label: string; screen: MenuScreens }[] = [
        { label: t('check_dental_health_title'), screen: 'Home' },
        { label: t('Reports'), screen: 'ReportsList' },
        { label: t('Reminder'), screen: 'Reminder' },
        { label: t('dental_care_header'), screen: 'DentalCare' },
        { label: t('Remedies'), screen: 'Remedies' },           
        { label: t('Dental Clinic Nearby'), screen: 'ClinicLocator' }, 
        { label: t('about_us_header'), screen: 'AboutUs' },
        
    ];

    const handleNavigation = (screenName: MenuScreens) => {
        setMenuVisible(false);
        // Use navigate to jump directly between main sections
        navigation.navigate(screenName as any); 
    };

    const handleSignOutPress = () => {
        setMenuVisible(false);
        onSignOut();
    };

    return (
        <View style={styles.headerContainer}>

            <View style={styles.waveBackground}>
                <Svg
                    height={HEADER_HEIGHT + 50}
                    width={width}             
                    viewBox={`0 0 ${width} ${HEADER_HEIGHT + 50}`}
                >
                    <Path
                        d={`M0 0 H${width} V${HEADER_HEIGHT - 50} C${width * 0.75} ${HEADER_HEIGHT + 30}, ${width * 0.25} ${HEADER_HEIGHT - 50}, 0 ${HEADER_HEIGHT} Z`} 
                        fill={WAVE_COLOR}
                        strokeWidth="0"
                    />

                    <Path
                        d={`M0 0 H${width} V${HEADER_HEIGHT - 50} C${width * 0.75} ${HEADER_HEIGHT + 30}, ${width * 0.25} ${HEADER_HEIGHT - 50}, 0 ${HEADER_HEIGHT} Z`} 
                        fill={'#FA8072'} // A lighter shade of salmon/coral pink to suggest texture
                        opacity={Platform.OS === 'ios' ? 0.3 : 0.15} // Lighter on Android for better visibility
                        strokeWidth="0"
                    />
                </Svg>
            </View>

            <Text style={[styles.headerTitle, { top: TEXT_START_Y}]}>{title}</Text>

            {/* Menu Icon/Button */}
            <View style={[styles.menuIconContainer, { top: MENU_START_Y}]}>
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)} // Close when tapping outside
                >
                    <View style={styles.dropdown}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => handleNavigation(item.screen)}
                            >
                                <Text style={styles.menuText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* Sign Out Button */}
                        <TouchableOpacity
                            style={[styles.menuItem, styles.signOutItem]}
                            onPress={handleSignOutPress}
                        >
                            <Text style={styles.signOutText}>{t('sign_out')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        height: HEADER_HEIGHT,
        backgroundColor: 'white',
        position: 'relative',
    },
    waveBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerTitle: {
        fontSize: scale(26), // Dynamic font
        fontWeight: 'bold',
        color: 'white', 
        position: 'absolute', 
        left: 20,
        zIndex: 10,
        width: width * 0.7, // Prevent title from hitting the menu button
    },
    menuIconContainer: {
        position: 'absolute',
        right: 20,
        zIndex: 100, 
    },
    menuButton: {
        width: scale(40),
        height: scale(40),
        backgroundColor: 'white',
        borderRadius: scale(20),
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    menuIcon: {
        fontSize: scale(20),
        fontWeight: 'bold',
        color: '#FA8072',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Slightly darker for better focus
    },
    dropdown: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 90 : 70, // Adjusts based on platform status bar
        right: 20,
        width: width * 0.65, 
        backgroundColor: 'white',
        borderRadius: 15, // Smoother corners
        paddingVertical: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    menuItem: {
        paddingVertical: scale(14),
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuText: {
        fontSize: scale(15),
        color: '#333',
        fontWeight: '500',
    },
    signOutItem: {
        borderBottomWidth: 0,
        backgroundColor: '#FFF5F5', // Very light red
        marginTop: 5,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    signOutText: {
        fontSize: scale(15),
        fontWeight: 'bold',
        color: '#FA8072',
    }
});
export default HeaderMenu;