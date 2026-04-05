// App.tsx
import 'react-native-gesture-handler'; // Must be imported at the top for navigation
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';

import i18n from './src/config/i18n'; // Import your i18n configuration
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    // Wrap the entire application in the I18nextProvider to enable translations everywhere
    <I18nextProvider i18n={i18n}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* NavigationContainer manages the routing state */}
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </View>
    </I18nextProvider>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});

export default App;