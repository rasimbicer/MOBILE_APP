import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { Text, Button, Surface, MD3Colors } from 'react-native-paper';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Pill } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const { connectionStatus, retryConnection } = useAuth();

  if (connectionStatus === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Bağlantı Hatası</Text>
          <Text style={styles.errorText}>
            Supabase veritabanına bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.
          </Text>
          <Button
            mode="contained"
            onPress={retryConnection}
            style={styles.retryButton}
          >
            Tekrar Dene
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (connectionStatus === 'connecting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Bağlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg' }}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.8)', 'rgba(5, 150, 105, 0.8)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Surface style={styles.logoBackground} elevation={3}>
                <Pill size={48} color={colors.primary} />
              </Surface>
              <Text style={styles.title}>İlaç Hatırlatıcı</Text>
              <Text style={styles.subtitle}>
                İlaçlarınızı zamanında almayı unutmayın
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Link href="/(auth)/signup" asChild>
                <Button
                  mode="contained"
                  style={styles.primaryButton}
                  labelStyle={styles.buttonLabel}
                  contentStyle={styles.buttonContent}
                >
                  Hesap Oluştur
                </Button>
              </Link>

              <Link href="/(auth)/signin" asChild>
                <Button
                  mode="outlined"
                  style={styles.secondaryButton}
                  labelStyle={[styles.buttonLabel, { color: '#FFFFFF' }]}
                  contentStyle={styles.buttonContent}
                >
                  Giriş Yap
                </Button>
              </Link>

              <Text style={styles.termsText}>
                Hesap oluşturarak{' '}
                <Text style={styles.linkText}>Kullanım Koşulları</Text> ve{' '}
                <Text style={styles.linkText}>Gizlilik Politikası</Text>'nı kabul etmiş olursunuz.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: width,
    height: height,
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  secondaryButton: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
    marginTop: 8,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});