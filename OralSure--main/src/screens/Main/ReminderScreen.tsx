import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Platform, Alert, Dimensions, ActivityIndicator, ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../services/supabaseClient';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance } from '@notifee/react-native';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;

const ReminderScreen = ({ navigation }: any) => {
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeReminder, setActiveReminder] = useState<any>(null);

  useEffect(() => {
    fetchExistingReminder();
  }, []);

  const fetchExistingReminder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setActiveReminder(data);
        setDate(new Date(data.appointment_time));
      }
    } catch (err) {
      console.log("Initial fetch: No reminder found.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);

    if (Platform.OS === 'android' && mode === 'date') {
      setMode('time');
      setShow(true);
    }
  };

  // --- NEW: DELETE FUNCTION ---
  const handleDeleteReminder = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('reminders').delete().eq('user_id', user.id);
      await notifee.cancelAllNotifications();
      
      setActiveReminder(null);
      Alert.alert("Deleted", "Your dental reminder has been removed.");
    } catch (error) {
      Alert.alert("Error", "Could not delete reminder.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReminder = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in again.");

      // UPSERT: Create or Update based on user_id
      const { error } = await supabase
        .from('reminders')
        .upsert({ 
          user_id: user.id, 
          appointment_time: date.toISOString(),
          description: 'Clinic Visit'
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // NOTIFICATIONS
      await notifee.requestPermission();
      const channelId = await notifee.createChannel({
        id: 'oral_reminders',
        name: 'OralSure Reminders',
        importance: AndroidImportance.HIGH,
      });

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(), 
      };

      await notifee.createTriggerNotification(
        {
          id: 'reminder_id', // Static ID so new one overwrites old one
          title: '🦷 Dental Checkup!',
          body: `Time for your visit: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          android: { channelId, pressAction: { id: 'default' } },
        },
        trigger,
      );

      Alert.alert("Success", "Reminder scheduled!", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert("Save Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#E9574A" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {activeReminder && (
            <View style={styles.activeBanner}>
              <Text style={styles.activeText}>
                Upcoming: {new Date(activeReminder.appointment_time).toLocaleDateString()} at {new Date(activeReminder.appointment_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </Text>
            </View>
          )}

          <View style={styles.iconCircle}><Text style={styles.emoji}>📅</Text></View>
          <Text style={styles.title}>Dental Visit</Text>
          <Text style={styles.desc}>Set your next clinic visit to track your progress.</Text>

          <View style={styles.selectionContainer}>
            <TouchableOpacity style={styles.selectorTile} onPress={() => { setMode('date'); setShow(true); }}>
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.valueText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.selectorTile} onPress={() => { setMode('time'); setShow(true); }}>
              <Text style={styles.label}>TIME</Text>
              <Text style={styles.valueText}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {show && (
            <DateTimePicker 
                value={date} 
                mode={mode} 
                onChange={onDateChange} 
                minimumDate={new Date()} 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            />
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder}>
            <Text style={styles.saveBtnText}>{activeReminder ? 'Update Visit' : 'Confirm Visit'}</Text>
          </TouchableOpacity>

          {activeReminder && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteReminder}>
              <Text style={styles.deleteBtnText}>Remove Reminder</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: width * 0.05, paddingVertical: height * 0.05 },
  card: { backgroundColor: '#FFF', borderRadius: scale(30), padding: width * 0.07, alignItems: 'center', elevation: 10 },
  activeBanner: { backgroundColor: '#FEF2F2', padding: scale(8), borderRadius: scale(12), marginBottom: height * 0.02, width: '100%' },
  activeText: { color: '#E9574A', fontSize: scale(11), fontWeight: 'bold', textAlign: 'center' },
  iconCircle: { width: scale(70), height: scale(70), backgroundColor: '#FFF5F4', borderRadius: scale(35), justifyContent: 'center', alignItems: 'center', marginBottom: height * 0.02 },
  emoji: { fontSize: scale(30) },
  title: { fontSize: scale(24), fontWeight: '800', color: '#111827' },
  desc: { textAlign: 'center', color: '#6B7280', marginTop: scale(10), fontSize: scale(14), marginBottom: height * 0.03 },
  selectionContainer: { width: '100%', backgroundColor: '#F9FAFB', borderRadius: scale(20), borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row' },
  selectorTile: { flex: 1, paddingVertical: height * 0.02, alignItems: 'center' },
  divider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: scale(10) },
  label: { fontSize: scale(10), fontWeight: '700', color: '#9CA3AF' },
  valueText: { fontSize: scale(16), fontWeight: 'bold', color: '#E9574A' },
  saveBtn: { backgroundColor: '#E9574A', width: '100%', paddingVertical: scale(18), borderRadius: scale(15), marginTop: height * 0.04, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: scale(16) },
  deleteBtn: { marginTop: 15, padding: 10 },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: scale(13) },
  cancelBtn: { marginTop: 10, padding: 10 },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: scale(14) }
});

export default ReminderScreen;