import React, { useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const mockMessages = [
  { id: 1, sender: 'them', text: 'Hi! Thanks for your interest in booking me.', time: '10:30 AM' },
  { id: 2, sender: 'me', text: 'Great! I\'m organizing a summer music festival.', time: '10:32 AM' },
  { id: 3, sender: 'them', text: 'When is the event scheduled?', time: '10:35 AM' },
  { id: 4, sender: 'me', text: 'June 15, 2026. Would you be available?', time: '10:36 AM' },
];

interface Props { navigate: (screen: string) => void; artist?: any; }

export default function Messaging({ navigate, artist }: Props) {
  const [message, setMessage] = useState('');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#030712', '#000']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('organizer-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <View style={styles.headerInfo}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.headerAvatar} />
          <View><Text style={styles.headerName}>{artist?.name || 'Maya Rivers'}</Text><Text style={styles.headerStatus}>Active now</Text></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {mockMessages.map((msg) => (
          <View key={msg.id} style={[styles.msgRow, msg.sender === 'me' && styles.msgRowMe]}>
            <Card style={[styles.msgBubble, msg.sender === 'me' && styles.msgBubbleMe]}>
              <Text style={styles.msgText}>{msg.text}</Text>
            </Card>
            <Text style={[styles.msgTime, msg.sender === 'me' && styles.msgTimeMe]}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <Input value={message} onChangeText={setMessage} placeholder="Type a message..." style={styles.input} />
        <Button size="icon" style={styles.sendBtn} onPress={() => setMessage('')}>
          <Send size={20} color="#fff" />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerName: { color: '#fff', fontWeight: '600' },
  headerStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  messages: { padding: 16, flexGrow: 1 },
  msgRow: { alignItems: 'flex-start', marginBottom: 16 },
  msgRowMe: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '75%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12 },
  msgBubbleMe: { backgroundColor: '#a855f7' },
  msgText: { color: '#fff', fontSize: 14 },
  msgTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  msgTimeMe: { textAlign: 'right' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1 },
  sendBtn: { backgroundColor: '#a855f7' },
});
