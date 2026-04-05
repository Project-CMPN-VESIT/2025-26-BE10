import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { supabase } from '../../services/supabaseClient';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotScreenProps {
  onSignOut: () => void;
  navigation: any;
}

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ onSignOut, navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showVisitButtons, setShowVisitButtons] = useState(false);
  const [showReturningButtons, setShowReturningButtons] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const SERVER_URL = 'https://oralsure-api.onrender.com/chat';

  useEffect(() => {
    const initializeChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const uid = session.user.id;
        setUserId(uid);
        triggerHandshake(uid);
      } else {
        Alert.alert("Session Expired", "Please log in again.");
        onSignOut();
      }
    };

    initializeChat();
  }, []);

  const triggerHandshake = async (uid: string) => {
    setIsTyping(true);
    const slowServerTimer = setTimeout(() => {
      Alert.alert("Server Status", "OralSure AI is waking up. Thank you for your patience...");
    }, 6000);
    
    try {
      const response = await fetch(SERVER_URL, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: uid, 
            message: "INITIALIZE_WELCOME" 
        }),
      });

      clearTimeout(slowServerTimer);
      const data = await response.json();
      if (data.reply) {
        addBotMessage(data.reply);
        // Handle logic for returning users based on backend action
        if (data.action === "ASK_VISIT_CONFIRMATION") {
            setShowVisitButtons(true);
        } else if (data.reply.includes("Better, Same or Worse")) {
          setShowReturningButtons(true);
        }
      }
    } catch (error) {
      clearTimeout(slowServerTimer);
      console.error("Handshake Error:", error);
      Alert.alert("Connection Error", "AI server is currently unreachable.");
    } finally {
      setIsTyping(false);
    }
  };

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      text: text,
      sender: 'bot',
      timestamp: new Date(),
    }]);
  };

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (textToSend.trim() === '' || !userId) return;
    
    setInputText('');
    setShowVisitButtons(false);
    setShowReturningButtons(false);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    }]);

    setIsTyping(true);
    try {
      const response = await fetch(SERVER_URL, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: userId, 
            message: textToSend 
        }),
      });

      const data = await response.json();
      addBotMessage(data.reply);

      // --- ACTION HANDLERS ---
      
      if (data.action === 'TRIGGER_CAMERA') {
        Alert.alert(
          "Visual Scan Recommended",
          "Your symptoms suggest we should perform a visual analysis.",
          [
            { text: "Later", style: "cancel" },
            { text: "Open Camera", onPress: () => navigation.navigate('Camera', { scanType: 'oral_cavity' }) }
          ]
        );
      } 
      else if (data.action === "NAVIGATE_REMEDIES") {
         Alert.alert("Care Options", "View relief options?", [{ text: "View", onPress: () => navigation.navigate('Remedies') }]);
      } 
      else if (data.action === "NAVIGATE_PRESCRIPTION_UPLOAD") {
          // Pass userId to the upload screen for faster processing
          Alert.alert(
            "Upload Prescription", 
            "I can digitize your dentist's prescription and update your record. Ready?", 
            [{ text: "Upload Now", onPress: () => navigation.navigate('PrescriptionUpload') }]
          );
      } 
      else if (data.action === "SET_CLINIC_REMINDER") {
          setShowReturningButtons(true);
          Alert.alert("Clinic Reminder", "Would you like me to set a reminder for your dental appointment?", [
                  { text: "Yes, Set Reminder", onPress: () => navigation.navigate('Reminder')},
                  { text: "No, Thanks", style: "cancel"}
              ]
          );
      } 
      else if (data.action === "ASK") {
        if (data.reply.includes("Better, Same or Worse")) {
          setShowReturningButtons(true);
        }
      }

    } catch (error) {
      console.error("Chat Error:", error);
      Alert.alert("Error", "Message could not be sent.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
              <Text style={item.sender === 'user' ? styles.userText : styles.botText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#E9574A" />
            <Text style={styles.typingText}>OralSure AI is thinking...</Text>
          </View>
        )}

        {/* Quick Replies for returning users */}
        {showVisitButtons && (
            <View style={styles.quickReplyContainer}>
                <TouchableOpacity style={styles.quickButton} onPress={() => sendMessage("Yes, I saw the doctor")}>
                    <Text style={styles.quickButtonText}>✅ Yes, I visited</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickButton, {backgroundColor: '#6B7280'}]} onPress={() => sendMessage("No, not yet")}>
                    <Text style={styles.quickButtonText}>❌ Not yet</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* Symptom Status Buttons */}
        {showReturningButtons && (
          <View style={styles.quickReplyContainer}>
            <TouchableOpacity style={[styles.quickButton, {backgroundColor: '#10B981'}]} onPress={() => sendMessage("Better")}>
              <Text style={styles.quickButtonText}>Better</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickButton, {backgroundColor: '#F59E0B'}]} onPress={() => sendMessage("Same")}>
              <Text style={styles.quickButtonText}>Same</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickButton, {backgroundColor: '#EF4444'}]} onPress={() => sendMessage("Worse")}>
              <Text style={styles.quickButtonText}>Worse</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your symptoms..."
            placeholderTextColor="#94A3B8"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!userId || isTyping) && { opacity: 0.5 }]} 
            onPress={() => sendMessage()}
            disabled={!userId || isTyping}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { 
    paddingHorizontal: width * 0.04, 
    paddingTop: 15,
    paddingBottom: 25 
  },
  bubble: { 
    maxWidth: '80%', 
    padding: 14, 
    borderRadius: 20, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  userBubble: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#E9574A',
    borderBottomRightRadius: 4,
  },
  botBubble: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  userText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  botText: { color: '#1E293B', fontSize: 16, lineHeight: 22 },
  typingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 10 
  },
  typingText: { 
    marginLeft: 10, 
    color: '#64748B', 
    fontStyle: 'italic',
    fontSize: 14 
  },
  inputContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'flex-end'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 25, 
    paddingHorizontal: 18, 
    paddingTop: 12, 
    paddingBottom: 12,
    fontSize: 16, 
    maxHeight: 120,
    minHeight: 48,
    color: '#1E293B'
  },
  sendButton: { 
    backgroundColor: '#E9574A', 
    width: 50,
    height: 50,
    borderRadius: 25, 
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },
  sendButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 14 
  },
  quickReplyContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    paddingHorizontal: 10,
    marginBottom: 15,
    flexWrap: 'wrap'
  },
  quickButton: { 
    backgroundColor: '#1E293B', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 30, 
    margin: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quickButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600',
    fontSize: 14 
  }
});

export default ChatbotScreen;