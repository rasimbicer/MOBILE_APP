import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, Checkbox } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail, Lock, User, Phone, Calendar, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Calendar as CalendarPicker } from 'react-native-calendars';

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı ve soyadınızı girin.');
      return false;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
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

    if (formData.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return false;
    }

    if (!consentAccepted) {
      Alert.alert('Hata', 'KVKK onayını kabul etmelisiniz.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        formData.dob
      );
    } catch (error: any) {
      Alert.alert('Kayıt Hatası', error.message || 'Kayıt olurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day: any) => {
    setFormData(prev => ({ ...prev, dob: day.dateString }));
    setShowCalendar(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>
            İlaçlarınızı hatırlamak için hesabınızı oluşturun
          </Text>
        </View>

        <Surface style={styles.formContainer} elevation={1}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ad Soyad *</Text>
              <TextInput
                mode="outlined"
                value={formData.fullName}
                onChangeText={(text) => updateFormData('fullName', text)}
                placeholder="Adınız ve soyadınız"
                autoCapitalize="words"
                left={<TextInput.Icon icon={() => <User size={20} color={colors.onSurfaceVariant} />} />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta Adresi *</Text>
              <TextInput
                mode="outlined"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon={() => <Mail size={20} color={colors.onSurfaceVariant} />} />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefon *</Text>
              <TextInput
                mode="outlined"
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre *</Text>
              <TextInput
                mode="outlined"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                placeholder="En az 6 karakter"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon={() => <Lock size={20} color={colors.onSurfaceVariant} />} />}
                right={
                  <TextInput.Icon
                    icon={() => showPassword ? <EyeOff size={20} color={colors.onSurfaceVariant} /> : <Eye size={20} color={colors.onSurfaceVariant} />}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre Tekrar *</Text>
              <TextInput
                mode="outlined"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                placeholder="Şifrenizi tekrar girin"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon={() => <Lock size={20} color={colors.onSurfaceVariant} />} />}
                right={
                  <TextInput.Icon
                    icon={() => showConfirmPassword ? <EyeOff size={20} color={colors.onSurfaceVariant} /> : <Eye size={20} color={colors.onSurfaceVariant} />}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

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
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              style={styles.signUpButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
            </Button>
          </View>
        </Surface>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Zaten hesabınız var mı?{' '}
            <Link href="/(auth)/signin" style={styles.footerLink}>
              Giriş yapın
            </Link>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
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
  signUpButton: {
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
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});