import React, { useEffect, useState } from 'react';
import { 
    View, Text, ScrollView, StyleSheet, ActivityIndicator, 
    Image, Alert, SafeAreaView, Dimensions, Platform, TouchableOpacity 
} from 'react-native';
import { supabase } from '../../services/supabaseClient';
// import RNHTMLtoPDF from 'react-native-html-to-pdf';
// import Share from 'react-native-share';
import RNPrint from 'react-native-print';
const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

const FullReportScreen = ({ route }: any) => {
    const { reportId } = route.params;
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                // 1. Fetch data using the explicit 'profiles' relationship
                const { data: reportData, error: reportError } = await supabase
                    .from('reports')
                    .select(`*`)
                    .eq('id', reportId)
                    .single();

                if (reportError) throw reportError;

                // console.log("DATABASE RESPONSE:", JSON.stringify(data, null, 2));

                const { data: scanData } = await supabase
                    .from('scans')
                    .select('image_url, diagnosis_result')
                    .eq('id', reportData.scan_id)
                    .single();

                let finalImageUrl = scanData?.image_url;
     
                if (finalImageUrl && !finalImageUrl.startsWith('http')) {
                    const cleanPath = finalImageUrl.replace('oral-photos/', '').trim();
                    const { data: signedData } = await supabase.storage
                        .from('oral-photos')
                        .createSignedUrl(cleanPath, 3600);
                    if (signedData?.signedUrl) finalImageUrl = signedData.signedUrl;
                }   
                
                
                setReport({
                    ...reportData,
                    displayName: reportData.full_name || "User",
                    displayAge: reportData.age?.toString() || "Not provided",
                    displayGender: reportData.gender || "Not provided",
                    annotatedImage: finalImageUrl,
                    diagnosis: scanData?.diagnosis_result || "No conditions identified"
                });

            } catch (err: any) {
                console.error("Clinical Record Fetch Error:", err.message);
                Alert.alert("Error", "Could not retrieve the historical clinical record.");
            } finally {
                setLoading(false);
            }
        };

        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    const downloadPDF = async () => {
    try {
        const htmlContent = `
        <html>
            <body style="font-family: Helvetica; padding: 20px;">
                <h1 style="color: #E9574A; text-align: center;">Clinical Dental Report</h1>
                <hr/>
                <div style="margin-bottom: 20px; border: 1px solid #EEE; padding: 15px; border-radius: 10px;">
                    <h2 style="color: #374151;">Patient Information</h2>
                    <p><strong>Name:</strong> ${report.displayName}</p>
                    <p><strong>Age:</strong> ${report.displayAge}</p>
                    <p><strong>Gender:</strong> ${report.displayGender}</p>
                </div>
                <div style="margin-bottom: 20px; border: 1px solid #EEE; padding: 15px; border-radius: 10px;">
                    <h2 style="color: #374151;">AI Visual Analysis</h2>
                    <p><strong>Detection Result:</strong> ${report.diagnosis || 'No conditions identified'}</p>
                    <p><strong>Severity Status:</strong> ${report.final_severity?.toUpperCase() || 'NORMAL'}</p>
                </div>
                <div style="margin-bottom: 20px; border: 1px solid #EEE; padding: 15px; border-radius: 10px;">
                    <h2 style="color: #374151;">Care Recommendations</h2>
                    <p>${report.home_care_advice || "Maintain regular oral hygiene and consult a dentist if symptoms persist."}</p>
                </div>
                <footer style="margin-top: 50px; font-size: 10px; text-align: center; color: #9CA3AF;">
                    Report ID: ${report.id} | Generated on ${new Date().toLocaleDateString()}
                </footer>
            </body>
        </html>
        `;

        // ✅ RNPrint handles the save/share dialog natively — no 'file' needed
        await RNPrint.print({ html: htmlContent });

    } catch (error) {
        console.error("PDF Error:", error);
        Alert.alert("Error", "Failed to generate PDF report.");
    }
};

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E9574A" />
                <Text style={styles.loadingText}>Synthesizing Clinical Data...</Text>
            </View>
        );
    }

    if (!report) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.header}>Clinical Dental Report</Text>
                
                {/* Section 1: Patient Demographics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Patient Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.bodyText}>Name: <Text style={styles.boldText}>{report.displayName}</Text></Text>
                        <Text style={styles.bodyText}>Age: <Text style={styles.boldText}>{report.displayAge}</Text></Text>
                    </View>
                    <Text style={styles.bodyText}>Gender: <Text style={styles.boldText}>{report.displayGender}</Text></Text>
                </View>

                {/* Section 2: AI Visual Scan Retrieval */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Visual Analysis</Text>
                    {report.annotatedImage ? (
                        <Image 
                            source={{ uri: report.annotatedImage }}
                            style={styles.reportImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>Scan image not found in 'scans' table</Text>
                        </View>
                    )}
                    <Text style={styles.diagnosisLabel}>Detection Result:</Text>
                    <Text style={styles.boldLabel}>
                        {report.diagnosis}
                    </Text>
                </View>

                {/* Section 3: Severity Synthesis */}
                <View style={styles.whiteResultBox}>
                    <View style={styles.resultLine}>
                        <Text style={styles.resultValueBack}>Severity Status: </Text>
                        <Text style={[
                            styles.resultLabel, 
                            { color: report.final_severity?.toLowerCase() === 'high' ? '#E9574A' : '#10B981' }
                        ]}>
                            {report.final_severity?.toUpperCase() || 'NORMAL'}
                        </Text>
                    </View>                   
                </View>

                {/* Section 4: Care Recommendations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Care Recommendations</Text>
                    <Text style={styles.bodyText}>
                        {report.home_care_advice || "Maintain regular oral hygiene and consult a dentist if symptoms persist."}
                    </Text>
                </View>

                {/* Metadata */}
                <Text style={styles.timestamp}>
                    Report ID: {report.id?.split('-')[0].toUpperCase()} • {new Date(report.created_at).toLocaleDateString()}
                </Text>

                {/* Download Button */}
                <TouchableOpacity style={styles.downloadBtn} onPress={downloadPDF}>
                    <Text style={styles.downloadBtnText}>Download PDF Report</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: width * 0.05, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    loadingText: { marginTop: 15, color: '#6B7280', fontStyle: 'italic', fontSize: scale(14) },
    header: { fontSize: scale(22), fontWeight: 'bold', textAlign: 'center', color: '#E9574A', marginBottom: 25 },
    section: { 
        backgroundColor: '#FFF', padding: 18, borderRadius: 15, marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 }
        })
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#374151', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
    bodyText: { fontSize: 15, color: '#4B5563', marginBottom: 6 },
    boldText: { fontWeight: '600', color: '#111' },
    boldLabel: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginTop: 5 },
    diagnosisLabel: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginTop: 15, textTransform: 'uppercase' },
    reportImage: { width: '100%', height: height * 0.3, borderRadius: 12, marginVertical: 10, backgroundColor: '#F1F5F9' },
    imagePlaceholder: { width: '100%', height: 150, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
    placeholderText: { color: '#94A3B8', fontSize: 13 },
    whiteResultBox: { backgroundColor: '#FFF', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15 },
    resultLine: { flexDirection: 'row', alignItems: 'center' },
    resultValueBack: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    resultLabel: { fontSize: 16, fontWeight: '800' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    timestamp: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 10 },
    downloadBtn: {
        backgroundColor: '#E9574A',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
        marginBottom: 10
    },
    downloadBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
});

export default FullReportScreen;
