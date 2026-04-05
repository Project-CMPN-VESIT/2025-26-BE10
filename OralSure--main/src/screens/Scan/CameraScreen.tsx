import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    Platform, Alert, Dimensions, Image 
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker'; // Dedicated library
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';

type CameraScreenProps = StackScreenProps<MainStackParamList, 'Camera'>;
const { width, height } = Dimensions.get('window');

const CameraScreen: React.FC<CameraScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { scanType } = route.params;

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [tempBase64, setTempBase64] = useState<string>('');

    const openCamera = () => {
        ImagePicker.openCamera({
            width: 1000,
            height: 1000,
            cropping: true, // Native Cropping UI
            includeBase64: true,
            mediaType: 'photo',
            cropperToolbarTitle: 'Align Teeth/Oral Area',
            cropperActiveWidgetColor: '#E9574A',
            cropperStatusBarColor: '#1F2937',
            cropperToolbarColor: '#1F2937',
        }).then(image => {
            setPreviewImage(image.path);
            setTempBase64(image.data || '');
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') {
                Alert.alert("Error", "Could not access camera.");
            }
        });
    };

    const openGallery = () => {
        ImagePicker.openPicker({
            width: 1000,
            height: 1000,
            cropping: true,
            includeBase64: true,
            mediaType: 'photo',
        }).then(image => {
            setPreviewImage(image.path);
            setTempBase64(image.data || '');
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') {
                Alert.alert("Error", "Could not access gallery.");
            }
        });
    };

    const confirmPhoto = () => {        
        if (previewImage && tempBase64) {
            navigation.replace('Loading', {
                imageUri: previewImage,
                base64: tempBase64,
                scanType: scanType
            });
        }
    };

    if (previewImage) {
        return (
            <SafeAreaView style={styles.safeAreaPreview}>
                <View style={styles.container}>
                    <Text style={styles.headerPreview}>Verify Detail</Text>
                    
                    <View style={styles.previewCard}>
                        {/* The library path works natively with the Image component */}
                        <Image 
                            source={{ uri: previewImage }} 
                            style={styles.previewFull} 
                        />
                    </View>
                    
                    <Text style={styles.instructionText}>Ensure the image is clear and well-lit before analyzing.</Text>

                    <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
                        <Text style={styles.confirmButtonText}>Confirm & Analyze</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.retakeBtn} 
                        onPress={() => setPreviewImage(null)}
                    >
                        <Text style={styles.retakeText}>Retake Photo</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>
                    {scanType === 'teeth' ? 'Teeth Scan' : 'Oral Cavity Scan'}
                </Text>
                
                <View style={styles.cameraFrame}>
                    <View style={styles.mouthGuide} />
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                </View>

                <TouchableOpacity style={styles.captureButton} onPress={openCamera}>
                    <View style={styles.captureInnerCircle} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
                    <Text style={styles.galleryText}>Upload from Gallery</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1F2937' },
    safeAreaPreview: { flex: 1, backgroundColor: '#F9FAFB' },
    container: { flex: 1, alignItems: 'center', paddingTop: height * 0.04 },
    header: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20 },
    headerPreview: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
    cameraFrame: { 
        width: width * 0.85, 
        height: height * 0.5, 
        backgroundColor: '#000', 
        borderRadius: 30, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#374151'
    },
    mouthGuide: { width: width * 0.65, height: width * 0.35, borderWidth: 2, borderColor: '#E9574A', borderRadius: 100, borderStyle: 'dashed', opacity: 0.6 },
    cornerTL: { position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: 'white' },
    cornerTR: { position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: 'white' },
    cornerBL: { position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: 'white' },
    cornerBR: { position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: 'white' },
    previewCard: {
        width: width * 0.85,
        height: width * 0.85, // Square preview after crop
        backgroundColor: '#E5E7EB',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
    },
    previewFull: { width: '100%', height: '100%', resizeMode: 'cover' },
    instructionText: { color: '#6B7280', textAlign: 'center', paddingHorizontal: 40, marginVertical: 20 },
    captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white', marginBottom: 20 },
    captureInnerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
    confirmButton: { width: width * 0.8, height: 60, backgroundColor: '#E9574A', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    confirmButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    galleryButton: { padding: 10 },
    galleryText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
    retakeBtn: { padding: 10 },
    retakeText: { color: '#E9574A', fontSize: 16, fontWeight: 'bold' }
});

export default CameraScreen;