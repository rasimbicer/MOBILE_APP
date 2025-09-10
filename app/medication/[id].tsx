import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, Switch, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { Medication, MedicationGroup } from '@/types/database.types';
import supabase from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { ArrowLeft, Plus, Minus, Clock } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

type ScheduleMode = 'times' | 'interval';
type FoodRelation = 'before' | 'after' | 'none';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [groups, setGroups] = useState<MedicationGroup[]>([]);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dose_value: '',
    dose_unit: 'mg',
    form: 'Tablet',
    group_id: '',
    schedule_mode: 'times' as ScheduleMode,
    times: ['08:00'],
    every_hours: 8,
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    with_food: 'none' as FoodRelation,
    notes: '',
    prn: false,
    notification_enabled: true,
  });

  useEffect(() => {
    if (user && id) {
      fetchMedication();
      fetchGroups();
    }
  }, [user, id]);

  const fetchMedication = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setMedication(data);
        setFormData({
          name: data.name,
          dose_value: data.dose_value?.toString() || '',
          dose_unit: data.dose_unit || 'mg',
          form: data.form || 'Tablet',
          group_id: data.group_id || '',
          schedule_mode: data.schedule.mode,
          times: data.schedule.times || ['08:00'],
          every_hours: data.schedule.everyHours || 8,
          days_of_week: data.schedule.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
          start_date: data.schedule.startDate,
          end_date: data.schedule.endDate || '',
          with_food: data.with_food,
          notes: data.notes || '',
          prn: data.prn,
          notification_enabled: data.notification_enabled,
        });
      }
    } catch (error) {
      console.error('Error fetching medication:', error);
      Alert.alert('Hata', 'İlaç bilgileri yüklenirken bir hata oluştu.');
      router.back();
    }
  };

  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const updateMedication = async () => {
    if (!medication || !user) return;

    setLoading(true);
    try {
      const schedule = {
        mode: formData.schedule_mode,
        ...(formData.schedule_mode === 'times' 
          ? { times: formData.times.sort() }
          : { everyHours: formData.every_hours }
        ),
        daysOfWeek: formData.days_of_week,
        startDate: formData.start_date,
        ...(formData.end_date ? { endDate: formData.end_date } : {}),
        timezone: 'local'
      };

      const { error } = await supabase
        .from('medications')
        .update({
          name: formData.name.trim(),
          dose_value: formData.dose_value ? parseFloat(formData.dose_value) : null,
          dose_unit: formData.dose_unit,
          form: formData.form,
          group_id: formData.group_id || null,
          schedule,
          with_food: formData.with_food,
          notes: formData.notes.trim() || null,
          prn: formData.prn,
          notification_enabled: formData.notification_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', medication.id)
        .eq('created_by', user.id);

      if (error) throw error;

      Alert.alert('Başarılı', 'İlaç başarıyla güncellendi.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating medication:', error);
      Alert.alert('Hata', error.message || 'İlaç güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>İlaç bilgileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>İlaç Düzenle</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.formContainer} elevation={1}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>İlaç Adı *</Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="İlaç adını girin"
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 2 }]}>
                <Text style={styles.label}>Doz</Text>
                <TextInput
                  mode="outlined"
                  value={formData.dose_value}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, dose_value: text }))}
                  placeholder="250"
                  keyboardType="numeric"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Birim</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.dose_unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dose_unit: value }))}
                    style={styles.picker}
                  >
                    <Picker.Item label="mg" value="mg" />
                    <Picker.Item label="ml" value="ml" />
                    <Picker.Item label="adet" value="adet" />
                    <Picker.Item label="damla" value="damla" />
                  </Picker>
                </View>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={updateMedication}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              labelStyle={styles.saveButtonLabel}
            >
              {loading ? 'Güncelleniyor...' : 'İlaç Güncelle'}
            </Button>
          </View>
        </Surface>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  formContainer: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
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
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  picker: {
    height: 56,
    color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  saveButton: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: 20,
  },
  saveButtonContent: {
    height: 56,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});