// src/navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { StackScreenProps } from '@react-navigation/stack';
// Import Phase 1 Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import SplashScreen from '../screens/Auth/SplashScreen'; // <--- NEW IMPORT

// --- Import Phase 2/3 Screens ---
import HomeScreen from '../screens/Main/HomeScreen'; 
import ScanSetupScreen from '../screens/Scan/ScanSetupScreen';
import CameraScreen from '../screens/Scan/CameraScreen';
import LoadingScreen from '../screens/Scan/LoadingScreen';
import ReportScreen from '../screens/Results/ReportScreen';
import HomeRemediesScreen from '../screens/Results/RemediesScreen';
import ClinicLocatorScreen from '../screens/Results/ClinicLocatorScreen';
import DentalCareScreen from '../screens/Main/DentalCareScreen';
import AboutUsScreen from '../screens/Main/AboutUsScreen';
import ChatbotScreen from '../screens/Main/ChatbotScreen';
import FullReportScreen from '../screens/Results/FullReportScreen';
import ReportsListScreen from '../screens/Results/ReportListScreen';
import PrescriptionUploadScreen from '../screens/Main/PrescriptionUploadScreen';
import ReminderScreen from '../screens/Main/ReminderScreen';
// --- Type Definitions ---
export type AuthStackParamList = {
    Splash: undefined; 
    Signup: undefined;
    Login: undefined;
};

export type MainStackParamList = {
    Home: undefined;
    ScanSetup: { scanType: 'teeth' | 'cavity' };
    Camera: { scanType: 'teeth' | 'cavity' };    
    Loading: {
        imageUri?: string;
        base64?: string;
        scanType: 'teeth' | 'cavity';
    };                           
    Report: {
        imageUrl?: string;
        diagnosis?: any;
    };   
    FullReport: { reportId: string };    
    ReportsList: undefined;                    
    Remedies: { symptom?: string } | undefined;                         
    ClinicLocator: undefined;                    
    DentalCare: undefined;                       
    AboutUs: undefined;   
    Chatbot: undefined;
    PrescriptionUpload: undefined;
    Reminder: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();


// --- Root App Component (The State Manager and Header Injector) ---

const RootApp = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleSignOut = () => {
        console.log("User successfully signed out (SIMULATED)");
        // FUTURE: In production, clear token here (e.g., from secure storage)
        setIsLoggedIn(false); 
    };
    
    const handleSignIn = () => {
        console.log("User successfully signed in (SIMULATED)");
        // FUTURE: In production, save received token here
        setIsLoggedIn(true); 
    };

    // Conditional rendering based on login state
    if (isLoggedIn) {
        // Logged in: Render Main Stack
        return (
            <MainStack.Navigator
                initialRouteName="Home"
                screenOptions={{ headerShown: false }}
            >
                {/* Home screen must be custom-rendered to inject the onSignOut prop */}
                <MainStack.Screen name="Home">
                    {props => <HomeScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>
                
                {/* Utility screens that don't take required params (Remedies, DentalCare, etc.) 
                  are rendered using the custom screen component to inject the onSignOut prop 
                  for the HeaderMenu component.
                */}
                <MainStack.Screen name="ScanSetup" component={ScanSetupScreen} />
                <MainStack.Screen name="Camera" component={CameraScreen} />
                <MainStack.Screen name="Loading" component={LoadingScreen} />
                <MainStack.Screen name="Report" component={ReportScreen} />

                {/* Inject onSignOut for HeaderMenu on Utility Screens */}
                <MainStack.Screen name="Remedies">
                    {props => <HomeRemediesScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>
                <MainStack.Screen name="ClinicLocator">
                    {props => <ClinicLocatorScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>
                <MainStack.Screen name="DentalCare">
                    {props => <DentalCareScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>
                <MainStack.Screen name="AboutUs">
                    {props => <AboutUsScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>

                {/* Inside RootApp -> if (isLoggedIn) -> MainStack.Navigator */}
                <MainStack.Screen name="Chatbot">
                    {props => <ChatbotScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>

                <MainStack.Screen name="FullReport">
                    {props => <FullReportScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>

                <MainStack.Screen name="ReportsList">
                    {props => <ReportsListScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>

                <MainStack.Screen name="PrescriptionUpload">
                    {props => <PrescriptionUploadScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>

                <MainStack.Screen name="Reminder">
                    {props => <ReminderScreen {...props} onSignOut={handleSignOut} />}
                </MainStack.Screen>
            </MainStack.Navigator>
        );
    } else {
        // Not logged in: Render Auth Stack
        return (
            <AuthStack.Navigator
                initialRouteName="Signup"
                screenOptions={{ headerShown: false }}
            >
                <AuthStack.Screen name="Splash" component={SplashScreen} />
                <AuthStack.Screen name="Signup" component={SignupScreen} />
                
                {/* Custom rendering to inject the onSignIn handler for the Login screen */}
                <AuthStack.Screen name="Login">
                    {props => <LoginScreen {...props} onSignIn={handleSignIn} />}
                </AuthStack.Screen>
            </AuthStack.Navigator>
        );
    }
};

export default RootApp;