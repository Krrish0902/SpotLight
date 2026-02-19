import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, ChevronDown } from 'lucide-react-native';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const POPULAR_GENRES = [
  'Jazz', 'Rock', 'Pop', 'Electronic', 'Classical', 'Hip-Hop', 'R&B',
  'Country', 'Folk', 'Metal', 'Reggae', 'Blues', 'Indie', 'Latin', 'Soul', 'Other',
];

export const POPULAR_INSTRUMENTS = [
  'Guitar', 'Piano', 'Drums', 'Bass', 'Vocals', 'Violin', 'Saxophone',
  'Trumpet', 'Flute', 'Cello', 'Keyboard', 'Synthesizer', 'DJ/Electronic',
  'Percussion', 'Ukulele', 'Other',
];

interface MultiSelectWithCustomProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
}

export function MultiSelectWithCustom({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select or add...',
  leftIcon,
}: MultiSelectWithCustomProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput('');
    setShowCustomInput(false);
  };

  const removeItem = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  const handleClose = () => {
    setModalVisible(false);
    setShowCustomInput(false);
    setCustomInput('');
  };

  const isOtherInOptions = options.includes('Other');
  const popularOpts = options.filter((o) => o !== 'Other');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {value.length > 0 && (
        <View style={styles.chips}>
          {value.map((v) => (
            <View key={v} style={styles.chip}>
              <Text style={styles.chipText}>{v}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => removeItem(v)}
                style={styles.chipRemove}
              >
                <X size={14} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <Pressable
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
      >
        {leftIcon && <View style={styles.triggerIcon}>{leftIcon}</View>}
        <Text style={[styles.triggerText, value.length === 0 && styles.placeholder]}>
          {value.length > 0 ? 'Add more…' : placeholder}
        </Text>
        <ChevronDown size={20} color="rgba(255,255,255,0.4)" style={styles.chevron} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleClose} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label.toLowerCase()}</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>
            <ScrollView style={styles.optionsScroll} keyboardShouldPersistTaps="handled">
              {popularOpts.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.option, value.includes(opt) && styles.optionSelected]}
                  onPress={() => toggleOption(opt)}
                >
                  <Text style={[styles.optionText, value.includes(opt) && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
              {isOtherInOptions && (
                <>
                  <Pressable
                    style={[
                      styles.option,
                      showCustomInput && styles.optionSelected,
                      value.some((v) => !options.includes(v)) && styles.optionSelected,
                    ]}
                    onPress={() => setShowCustomInput((v) => !v)}
                  >
                    <Text style={styles.optionText}>Other (add custom)</Text>
                  </Pressable>
                  {showCustomInput && (
                    <View style={styles.customRow}>
                      <Input
                        placeholder="Enter custom value"
                        value={customInput}
                        onChangeText={setCustomInput}
                        containerStyle={styles.customInput}
                        onSubmitEditing={addCustom}
                        returnKeyType="done"
                      />
                      <Button size="sm" onPress={addCustom} disabled={!customInput.trim()}>
                        <View style={styles.addBtnContent}>
                          <Plus size={16} color="#fff" />
                          <Text style={styles.addBtnText}>Add</Text>
                        </View>
                      </Button>
                    </View>
                  )}
                  {value.filter((v) => !options.includes(v)).map((v) => (
                    <View key={v} style={styles.customChip}>
                      <Text style={styles.customChipText}>{v}</Text>
                      <Pressable hitSlop={8} onPress={() => removeItem(v)}>
                        <X size={14} color="#94a3b8" />
                      </Pressable>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { color: '#cbd5e1', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  triggerIcon: { marginRight: 8 },
  triggerText: { flex: 1, color: '#e2e8f0', fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(168,85,247,0.25)',
    gap: 4,
  },
  chipText: { color: '#e2e8f0', fontSize: 14 },
  chipRemove: { padding: 2 },
  placeholder: { color: 'rgba(255,255,255,0.4)' },
  chevron: { marginLeft: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  modalTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '600' },
  optionsScroll: { padding: 16, maxHeight: 320 },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionSelected: {
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderColor: 'rgba(168,85,247,0.5)',
  },
  optionText: { color: '#e2e8f0', fontSize: 16 },
  optionTextSelected: { color: '#c084fc', fontWeight: '500' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
  customInput: { flex: 1 },
  addBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(100,116,139,0.2)',
    marginBottom: 8,
  },
  customChipText: { color: '#94a3b8' },
});
