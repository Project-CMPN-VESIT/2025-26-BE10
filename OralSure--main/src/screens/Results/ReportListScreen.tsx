import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabaseClient';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;

const ReportsListScreen = ({ navigation }: any) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('reports')
        .select('id, created_at, final_severity')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Unique filter to prevent UI duplicates
        const uniqueReports = data.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        setReports(uniqueReports);
      }
    }
    setLoading(false);
  };

  // Refresh list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#E9574A" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clinical History</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => navigation.navigate('FullReport', { reportId: item.id })}
          >
            <View>
              <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.severityText}>Severity: {item.final_severity?.toUpperCase() || 'NORMAL'}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No clinical reports found yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F9FAFB', 
        paddingHorizontal: width * 0.05, // Responsive side padding
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    title: { 
        fontSize: scale(26), 
        fontWeight: 'bold', 
        color: '#E9574A', 
        marginBottom: height * 0.03, 
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    reportCard: { 
        backgroundColor: '#FFF', 
        padding: scale(16), 
        borderRadius: 15, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: height * 0.015,
        // Responsive Shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 5,
            },
            android: {
                elevation: 3,
            },
        }),
        borderWidth: 1,
        borderColor: '#F3F4F6', // Subtle border for definition
    },
    dateText: { 
        fontSize: scale(16), 
        fontWeight: '700', 
        color: '#374151' 
    },
    severityText: { 
        fontSize: scale(13), 
        color: '#6B7280', 
        marginTop: 4,
        textTransform: 'capitalize' // Ensures 'high' becomes 'High'
    },
    arrow: { 
        fontSize: scale(18), 
        color: '#E9574A',
        fontWeight: 'bold' 
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center' 
    },
    empty: { 
        textAlign: 'center', 
        marginTop: height * 0.1, 
        color: '#9CA3AF',
        fontSize: scale(15),
        paddingHorizontal: width * 0.1,
        lineHeight: scale(22)
    }
});

export default ReportsListScreen;