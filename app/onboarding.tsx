import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, Checkbox } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { User, Phone, Calendar, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Calendar as CalendarPicker } from 'react-native-calendars';

export default function OnboardingScreen() {
  const { user, updateProfile, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dob: '',
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı ve soyadınızı girin.');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı girin.');
      return false;
    }

    if (!formData.dob) {
      Alert.alert('Hata', 'Lütfen doğum tarihinizi seçin.');
      return false;
    }

    if (!consentAccepted) {
      Alert.alert('Hata', 'KVKK onayını kabul etmelisiniz.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        birth_date: formData.dob,
      });

    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDayPress = (day: any) => {
    setFormData(prev => ({ ...prev, dob: day.dateString }));
    setShowCalendar(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profilinizi Tamamlayın</Text>
          <Text style={styles.subtitle}>
            İlaç hatırlatıcı özelliklerini kullanmadan önce profilinizi tamamlamalısınız
          </Text>
        </View>

        <Surface style={styles.formContainer} elevation={1}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ad Soyad *</Text>
              <TextInput
                mode="outlined"
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                placeholder="Adınız ve soyadınız"
                autoCapitalize="words"
                left={<TextInput.Icon icon={() => <User size={20} color={colors.onSurfaceVariant} />} />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefon *</Text>
              <TextInput
                mode="outlined"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="0555 123 45 67"
                keyboardType="phone-pad"
                left={<TextInput.Icon icon={() => <Phone size={20} color={colors.onSurfaceVariant} />} />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Doğum Tarihi *</Text>
              <TouchableOpacity onPress={() => setShowCalendar(true)}>
                <TextInput
                  mode="outlined"
                  value={formData.dob}
                  placeholder="YYYY-AA-GG"
                  editable={false}
                  left={<TextInput.Icon icon={() => <Calendar size={20} color={colors.onSurfaceVariant} />} />}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
              </TouchableOpacity>
            </View>

            {showCalendar && (
              <View style={styles.calendarContainer}>
                <CalendarPicker
                  onDayPress={onDayPress}
                  maxDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    backgroundColor: colors.surface,
                    calendarBackground: colors.surface,
                    textSectionTitleColor: colors.primary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.onSurface,
                    textDisabledColor: colors.onSurfaceVariant,
                    arrowColor: colors.primary,
                    disabledArrowColor: colors.onSurfaceVariant,
                    monthTextColor: colors.primary,
                    indicatorColor: colors.primary,
                  }}
                />
                <Button
                  mode="text"
                  onPress={() => setShowCalendar(false)}
                  style={styles.closeCalendarButton}
                >
                  Kapat
                </Button>
              </View>
            )}

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={consentAccepted ? 'checked' : 'unchecked'}
                onPress={() => setConsentAccepted(!consentAccepted)}
                color={colors.primary}
              />
              <Text style={styles.checkboxText}>
                KVKK kapsamında kişisel verilerimin işlenmesini kabul ediyorum *
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {submitting ? 'Tamamlanıyor...' : 'Profili Tamamla'}
            </Button>
          </View>
        </Surface>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bu bilgiler sadece size özel hatırlatmalar oluşturmak için kullanılacaktır.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: 12,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  closeCalendarButton: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 20,
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
  },
});