import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    Alert, 
    ActivityIndicator, 
    Dimensions, 
    Platform 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/common/LanguageToggle';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';

// 1. IMPORT SUPABASE CLIENT
import { supabase } from '../../services/supabaseClient';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
    onSignIn: () => void; 
}

const LoginScreen: React.FC<Props> = ({ navigation, onSignIn }) => {
    const { t } = useTranslation();
    
    // Auth and Loading States
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Visual/Placeholder States
    const [rememberMe, setRememberMe] = useState(false);

    /**
     * UPDATED LOGIN LOGIC FOR SUPABASE
     */
    const handleLogin = async () => {
        if (!email || !password) {
             Alert.alert(t('error'), 'Please enter your Email and Password.');
             return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                Alert.alert('Login Failed', error.message);
            } else if (data.session) {
                onSignIn(); 
            }
        } catch (err) {
            Alert.alert(t('error'), 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <LanguageToggle isSmall />

                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.headerTitle}>{t('login_header')}</Text>
                        <View style={styles.headerLine} />
                    </View>
                    <Text style={styles.headerTitleSecondary}>{t('select_language')}</Text>
                </View>

                

                {/* Email Input */}
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('email_placeholder')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={setEmail}
                    value={email}
                />

                {/* Password Input */}
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('password_placeholder')}
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                />

                <View style={styles.optionsRow}>
                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
                        <View style={[styles.checkbox, rememberMe && styles.checkboxActive]} />
                        <Text style={styles.optionsText}>{t('remember_me')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => console.log('Forgot Password Pressed')}>
                        <Text style={styles.forgotPasswordLink}>{t('forgot_password')}</Text>
                    </TouchableOpacity>
                </View>

                {/* LOGIN BUTTON */}
                <TouchableOpacity 
                    style={[styles.loginButton, loading && { opacity: 0.7 }]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.loginButtonText}>{t('login_tab')}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('dont_have_account')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.footerLink}>{t('signup_link')}</Text>
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
        marginBottom: height * 0.04, 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        justifyContent: 'space-between' 
    },
    headerTitle: { 
        fontSize: scale(30), 
        fontWeight: 'bold', 
        color: '#333' 
    },
    headerTitleSecondary: { 
        fontSize: scale(14), 
        color: '#666', 
        fontWeight: '500' 
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
        marginTop: height * 0.02, 
        marginBottom: 5, 
        fontWeight: '500' 
    },
    input: { 
        height: Math.min(height * 0.07, 55), // Scales with height but caps at 55
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        fontSize: scale(16), 
        color: '#333',
        backgroundColor: '#fff'
    },
    optionsRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: height * 0.02, 
        marginBottom: height * 0.04 
    },
    checkboxContainer: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    checkbox: { 
        width: scale(18), 
        height: scale(18), 
        borderWidth: 1, 
        borderColor: '#FA8072', 
        borderRadius: 4, 
        marginRight: 8 
    },
    checkboxActive: { 
        backgroundColor: '#FA8072' 
    },
    optionsText: { 
        fontSize: scale(13), 
        color: '#666' 
    },
    forgotPasswordLink: { 
        fontSize: scale(13), 
        color: '#FA8072', 
        fontWeight: '600' 
    },
    loginButton: { 
        height: Math.min(height * 0.07, 60), 
        backgroundColor: '#FA8072', 
        borderRadius: 30, // Large radius for a pill shape
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 10, 
        marginBottom: 20, 
        // Shadow for iOS
        shadowColor: '#FA8072',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        // Elevation for Android
        elevation: 6, 
    },
    loginButtonText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: scale(18) 
    },
    footer: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: height * 0.02 
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

export default LoginScreen;