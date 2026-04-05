// src/components/common/LanguageToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

// Languages supported for display in the modal
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
];

interface LanguageToggleProps {
    isSmall?: boolean; // Used to adjust styling for placement on small screens
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ isSmall = false }) => {
    const { t, i18n } = useTranslation();
    const [modalVisible, setModalVisible] = React.useState(false);

    // Function to handle the actual language switch
    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setModalVisible(false);
    };

    const currentLangLabel = LANGUAGES.find(lang => lang.code === i18n.language)?.label || LANGUAGES[0].label;

    return (
        <View style={isSmall ? styles.smallContainer : {}}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.toggleButton}>
                <Text style={styles.toggleText}>{t('select_language')}: {currentLangLabel}</Text>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('select_language')}</Text>
                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.langItem} 
                                    onPress={() => changeLanguage(item.code)}
                                >
                                    <Text style={[
                                        styles.langText, 
                                        i18n.language === item.code && styles.selectedLang
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    smallContainer: {
        position: 'absolute',
        top: 20, 
        right: 20,
        zIndex: 10,
    },
    toggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: '#E9574A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    toggleText: {
        fontSize: 12,
        color: '#E9574A',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        maxHeight: Dimensions.get('window').height * 0.4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#333',
    },
    langItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    langText: {
        fontSize: 16,
        color: '#555',
    },
    selectedLang: {
        fontWeight: 'bold',
        color: '#E9574A',
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#E9574A',
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default LanguageToggle;