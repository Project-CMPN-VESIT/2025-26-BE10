import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';

// Define navigation type for this screen
type SplashScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Splash'>;

interface Props {
    navigation: SplashScreenNavigationProp;
}

// FIX 1: Correctly load the local logo image using require()
// NOTE: You must ensure your logo file is saved here: src/assets/images/app-logo.png
const AppLogo = require('../../assets/images/app-logo.jpg'); 
const SPLASH_DURATION = 2000; // 2 seconds

const SplashScreen: React.FC<Props> = ({ navigation }) => {
    
    useEffect(() => {
        // After the splash duration, navigate to the Auth flow.
        const timer = setTimeout(() => {
            // Use replace to prevent the user from navigating back to the splash screen.
            navigation.replace('Signup'); 
        }, SPLASH_DURATION);

        return () => clearTimeout(timer); // Cleanup the timer
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image source={AppLogo} style={styles.logo} />
                <Text style={styles.tagline}>AI-Powered Dental Checkup</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', // Light background matching your logo design
    },
    logo: {
        width: 250, // Adjust size as needed
        height: 250,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    tagline: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FA8072', // Using your primary accent color
    },
});

export default SplashScreen;