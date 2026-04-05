import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Dimensions, Image, Platform
} from 'react-native';

import ImagePicker from 'react-native-image-crop-picker';
import MlkitOcr from 'react-native-mlkit-ocr';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../services/supabaseClient';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

type PrescriptionUploadProps = StackScreenProps<MainStackParamList, 'PrescriptionUpload'>;

const PrescriptionUploadScreen: React.FC<PrescriptionUploadProps> = ({ navigation }) => {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [meds, setMeds] = useState<Medication[]>([]);

  const handlePickAndCrop = () => {
    ImagePicker.openPicker({
      width: 1500, // Slightly higher for handwriting
      height: 2000,
      cropping: true,
      includeBase64: true,
      freeStyleCropEnabled: true,
      cropperToolbarTitle: 'Zoom into Handwritten Text',
      cropperActiveWidgetColor: '#E9574A',
      mediaType: 'photo',
    }).then(image => {
      setPreviewUri(image.path);
      setBase64Data(image.data || '');
      setMeds([]); 
    }).catch(e => {
      if (e.code !== 'E_PICKER_CANCELLED') {
        Alert.alert("Error", "Could not access gallery.");
      }
    });
  };

  const uploadAndProcess = async () => {
    if (!base64Data || !previewUri) return;

    setLoading(true);
    setProcessStatus('Securing image...');

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error("Please log in again.");

      const fileName = `${user.id}/presc_${Date.now()}.jpg`;
      await supabase.storage
        .from('prescription-uploads')
        .upload(fileName, decode(base64Data), { contentType: 'image/jpeg', upsert: true });

      const { data: urlData } = supabase.storage.from('prescription-uploads').getPublicUrl(fileName);

      // --- PRIMARY: BACKEND AI (Best for Handwriting) ---
      setProcessStatus('AI Analysis starting...');
      try {
        const response = await fetch('https://oralsure-api.onrender.com/process_prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, image_url: urlData.publicUrl }),
        });

        const result = await response.json();
        if (response.ok && result.status === 'success' && result.extracted_meds?.length > 0) {
          setMeds(result.extracted_meds);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log("Backend AI could not decode handwriting, trying local...");
      }

      // --- SECONDARY: LOCAL SCAN ---
      setProcessStatus('Cloud busy. Scanning lines...');
      const localResult = await MlkitOcr.detectFromUri(previewUri);
      
      if (localResult && localResult.length > 0) {
        const blacklist = ['patient', 'name', 'gender', 'age', 'details', 'field', 'male', 'female', 'date'];
        
        // Map all blocks and try to find anything that isn't a header
        const extracted: Medication[] = localResult
          .map(block => block.text.replace(/\n/g, ' ').trim())
          .filter(text => {
            const lower = text.toLowerCase();
            return text.length > 3 && !blacklist.some(word => lower.includes(word));
          })
          .slice(0, 5) // Take top 5 readable lines
          .map(line => ({
            name: line,
            dosage: "Extracted from Image",
            frequency: "See Scan",
            duration: "Checked"
          }));

        if (extracted.length > 0) {
          setMeds(extracted);
        } else {
          throw new Error("Handwriting too faint. Please retake photo with more light.");
        }
      } else {
        throw new Error("No text detected. Ensure the image is sharp.");
      }

    } catch (error: any) {
      Alert.alert("Scan Error", error.message);
    } finally {
      setLoading(false);
      setProcessStatus('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Prescription Scan</Text>
          <Text style={styles.subtitle}>Our AI will digitize your medications</Text>
        </View>

        <View style={styles.imageCard}>
          {previewUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: previewUri }} style={styles.fullImage} resizeMode="contain" />
              {!loading && (
                <TouchableOpacity style={styles.changeBadge} onPress={handlePickAndCrop}>
                  <Text style={styles.changeText}>Edit Crop</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.placeholder} onPress={handlePickAndCrop}>
              <Text style={styles.icon}>📄</Text>
              <Text style={styles.infoText}>Select & Crop Prescription</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E9574A" />
            <Text style={styles.statusText}>{processStatus}</Text>
          </View>
        ) : (
          <View>
            {meds.length > 0 ? (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultLabel}>DETECTED ITEMS:</Text>
                {meds.map((med, idx) => (
                  <View key={idx} style={styles.medCard}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDetails}>{med.dosage}</Text>
                    <View style={styles.badgeRow}>
                        <Text style={styles.smallBadge}>{med.frequency}</Text>
                        <Text style={styles.smallBadge}>{med.duration}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.backBtnText}>Save & Return</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, !previewUri && styles.disabled]} 
                onPress={uploadAndProcess}
                disabled={!previewUri}
              >
                <Text style={styles.btnText}>Start AI Analysis</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  imageCard: { width: '100%', height: height * 0.38, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', overflow: 'hidden', marginBottom: 20, elevation: 2 },
  imageWrapper: { flex: 1 },
  fullImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  icon: { fontSize: 40, marginBottom: 10 },
  infoText: { color: '#9CA3AF', fontWeight: '600' },
  changeBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  changeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  loadingContainer: { alignItems: 'center', marginTop: 10 },
  statusText: { marginTop: 15, color: '#E9574A', fontWeight: '600', fontStyle: 'italic' },
  resultsContainer: { marginTop: 5 },
  resultLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', marginBottom: 10, letterSpacing: 1 },
  medCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#E9574A', elevation: 3 },
  medName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  medDetails: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  smallBadge: { fontSize: 10, color: '#E9574A', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#E9574A', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 4 },
  disabled: { backgroundColor: '#D1D5DB' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  backBtn: { backgroundColor: '#111827', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' }
});

export default PrescriptionUploadScreen;