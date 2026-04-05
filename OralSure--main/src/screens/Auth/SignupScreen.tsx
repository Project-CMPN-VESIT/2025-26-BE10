import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/common/LanguageToggle';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';

// 1. IMPORT SUPABASE CLIENT
import { supabase } from '../../services/supabaseClient';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface Props {
    navigation: SignupScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
  
    // 2. UPDATED CREATE ACCOUNT LOGIC (STEP 4)
    const handleCreateAccount = async () => {
        if (password !== confirmPassword) {
            Alert.alert(t('error'), 'Passwords do not match.');
            return;
        }

        // if (!email || !password) {
        //     Alert.alert(t('error'), 'Email and Password are required.');
        //     return;
        // }

        setLoading(true);

        // Call Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        setLoading(true);

        if (error) {
            Alert.alert('Signup Failed', error.message);
        } else {
            Alert.alert(
                t('success'), 
                'Account created! Please check your email for a verification link.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <LanguageToggle isSmall />
                
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>{t('sign_up_header')}</Text>
                    <View style={styles.headerLine} />
                </View>

                {/* Full Name Field */}
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    onChangeText={setFullName}
                    value={fullName}
                />


                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('email_placeholder')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={setEmail}
                    value={email}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('password_placeholder')}
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('confirm_password_placeholder')}
                    secureTextEntry
                    onChangeText={setConfirmPassword}
                    value={confirmPassword}
                />

                <TouchableOpacity 
                    style={[styles.createButton, loading && { opacity: 0.7 }]} 
                    onPress={handleCreateAccount}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>{t('create_account')}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('already_have_account')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>{t('login_link')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    scrollContainer: { 
        flexGrow: 1, 
        paddingHorizontal: width * 0.06, // 6% of screen width
        paddingBottom: height * 0.05,    // 5% of screen height
    },
    headerContainer: { 
        paddingTop: height * 0.05, 
        marginBottom: height * 0.03, 
    },
    headerTitle: { 
        fontSize: scale(30), 
        fontWeight: 'bold', 
        color: '#333' 
    },
    headerLine: { 
        width: width * 0.15, 
        height: 4, 
        backgroundColor: '#FA8072', 
        borderRadius: 2, 
        marginTop: 5 
    },
    label: { 
        fontSize: scale(14), 
        color: '#666', 
        marginTop: height * 0.015, 
        marginBottom: 5, 
        fontWeight: '500' 
    },
    input: { 
        height: Math.min(height * 0.065, 55), // Scales with height but caps at 55
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        fontSize: scale(16), 
        color: '#333',
        backgroundColor: '#fff'
    },
    // Keep these for consistency even if not currently used in your JSX
    aadhaarGroup: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: 5,
        marginBottom: 10 
    },
    aadhaarInput: { 
        flex: 1, 
        height: Math.min(height * 0.065, 55), 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        fontSize: scale(16), 
        marginRight: 10, 
        color: '#333' 
    },
    otpButton: { 
        height: Math.min(height * 0.065, 55), 
        width: width * 0.28, 
        backgroundColor: '#FA8072', 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    otpButtonText: { 
        color: 'white',
        fontWeight: 'bold',   
        fontSize: scale(13) 
    },
    createButton: { 
        height: Math.min(height * 0.07, 60), 
        backgroundColor: '#FA8072', 
        borderRadius: 30, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: height * 0.04, 
        marginBottom: 20, 
        // Shadow for iOS
        shadowColor: '#FA8072',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        // Elevation for Android
        elevation: 8, 
    },
    createButtonText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: scale(18) 
    },
    footer: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingBottom: 20
    },
    footerText: { 
        fontSize: scale(14), 
        color: '#666', 
        marginRight: 5 
    },
    footerLink: { 
        fontSize: scale(14), 
        color: '#FA8072', 
        fontWeight: 'bold' 
    },
});


export default SignupScreen;