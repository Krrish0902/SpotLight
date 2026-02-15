import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CreditCard, Shield } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';

interface Props { navigate: (screen: string) => void; }

export default function PaymentScreen({ navigate }: Props) {
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      navigate('artist-dashboard');
    }, 2000);
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('purchase-boost')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Pro Boost (14 Days)</Text><Text style={styles.summaryVal}>$49.00</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Processing Fee</Text><Text style={styles.summaryVal}>$2.00</Text></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>$51.00</Text></View>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Payment Method</Text>
          <View style={styles.methodRow}><CreditCard size={20} color="#fff" /><Text style={styles.methodText}>Credit / Debit Card</Text></View>
          <View style={styles.field}><Label>Card Number</Label><Input placeholder="1234 5678 9012 3456" /></View>
          <View style={styles.row}><View style={styles.halfField}><Label>Expiry</Label><Input placeholder="MM/YY" /></View><View style={styles.halfField}><Label>CVV</Label><Input placeholder="123" secureTextEntry /></View></View>
          <View style={styles.field}><Label>Cardholder Name</Label><Input placeholder="John Doe" /></View>
        </Card>

        <View style={styles.securityRow}>
          <Shield size={20} color="#4ade80" />
          <View><Text style={styles.securityTitle}>Secure Payment</Text><Text style={styles.securityText}>Your payment information is encrypted and secure.</Text></View>
        </View>

        <Button onPress={handlePayment} disabled={processing} style={styles.payBtn}>
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payText}>Pay $51.00</Text>}
        </Button>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 24 },
  summaryCard: { backgroundColor: 'rgba(147,51,234,0.2)', borderColor: 'rgba(168,85,247,0.3)', padding: 24, marginBottom: 24 },
  summaryTitle: { color: '#fff', fontWeight: '600', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)' },
  summaryVal: { color: 'rgba(255,255,255,0.8)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  totalLabel: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  totalVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 24 },
  formTitle: { color: '#fff', fontWeight: '600', marginBottom: 16 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  methodText: { color: '#fff' },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  halfField: { flex: 1 },
  securityRow: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 24 },
  securityTitle: { color: '#fff', fontWeight: '500', marginBottom: 4 },
  securityText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  payBtn: { backgroundColor: '#a855f7', paddingVertical: 16 },
  payText: { color: '#fff', fontSize: 18 },
});
