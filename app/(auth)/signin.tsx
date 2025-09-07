import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Giriş Hatası', error.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.subtitle}>
            Hesabınıza giriş yaparak ilaçlarınızı yönetmeye devam edin
          </Text>
        </View>

        <Surface style={styles.formContainer} elevation={1}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta Adresi</Text>
              <TextInput
                mode="outlined"
                value={email}
                onChangeText={setEmail}
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
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                placeholder="Şifrenizi girin"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
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

            <Button
              mode="contained"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              style={styles.signInButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={() => Alert.alert('Yakında', 'Google ile giriş özelliği yakında eklenecek.')}
              icon={() => <Text style={{ fontSize: 18 }}>🇬</Text>}
              style={styles.socialButton}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: colors.onSurface }]}
            >
              Google ile Giriş Yap
            </Button>

            <Button
              mode="outlined"
              onPress={() => Alert.alert('Yakında', 'Apple ile giriş özelliği yakında eklenecek.')}
              icon={() => <Text style={{ fontSize: 18 }}>🍎</Text>}
              style={styles.socialButton}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: colors.onSurface }]}
            >
              Apple ile Giriş Yap
            </Button>
          </View>
        </Surface>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hesabınız yok mu?{' '}
            <Link href="/(auth)/signup" style={styles.footerLink}>
              Hesap oluşturun
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
  signInButton: {
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outline,
    opacity: 0.3,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  socialButton: {
    borderRadius: 12,
    marginBottom: 12,
    borderColor: colors.outline,
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