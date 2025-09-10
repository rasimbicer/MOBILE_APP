import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, Switch, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { MedicationGroup } from '@/types/database.types';
import supabase from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { ArrowLeft, Plus, Minus, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

type ScheduleMode = 'times' | 'interval';
type FoodRelation = 'before' | 'after' | 'none';

export default function AddMedicationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
    if (user) {
      fetchGroups();
    }
  }, []);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Hata', 'Gruplar yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
    }
  };

  const addTime = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, '12:00']
    }));
  };

  const removeTime = (index: number) => {
    if (formData.times.length > 1) {
      setFormData(prev => ({
        ...prev,
        times: prev.times.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTime = (index: number, time: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = time;
    setFormData(prev => ({ ...prev, times: newTimes }));
  };

  const toggleDay = (day: number) => {
    const newDays = formData.days_of_week.includes(day)
      ? formData.days_of_week.filter(d => d !== day)
      : [...formData.days_of_week, day].sort();
    
    setFormData(prev => ({ ...prev, days_of_week: newDays }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'İlaç adı zorunludur.');
      return false;
    }

    if (formData.schedule_mode === 'times' && formData.times.length === 0) {
      Alert.alert('Hata', 'En az bir zaman belirtmelisiniz.');
      return false;
    }

    if (formData.schedule_mode === 'interval' && formData.every_hours <= 0) {
      Alert.alert('Hata', 'Saat aralığı geçerli olmalıdır.');
      return false;
    }

    if (formData.days_of_week.length === 0) {
      Alert.alert('Hata', 'En az bir gün seçmelisiniz.');
      return false;
    }

    return true;
  };

  const saveMedication = async () => {
    if (!validateForm()) return;

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
        .insert([{
          created_by: user!.id,
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
        }]);

      if (error) throw error;

      Alert.alert('Başarılı', 'İlaç başarıyla kaydedildi.', [
        { text: 'Tamam', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('Error saving medication:', error);
      Alert.alert('Hata', error.message || 'İlaç kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const doseUnits = [
    { label: 'mg', value: 'mg' },
    { label: 'ml', value: 'ml' },
    { label: 'adet', value: 'adet' },
    { label: 'damla', value: 'damla' },
  ];

  const medicationForms = [
    { label: 'Tablet', value: 'Tablet' },
    { label: 'Kapsül', value: 'Kapsül' },
    { label: 'Şurup', value: 'Şurup' },
    { label: 'Damla', value: 'Damla' },
    { label: 'Krem', value: 'Krem' },
    { label: 'İnjeksiyon', value: 'İnjeksiyon' },
  ];

  const dayNames = ['Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>İlaç Ekle</Text>
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
                    {doseUnits.map(unit => (
                      <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Form</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.form}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, form: value }))}
                  style={styles.picker}
                >
                  {medicationForms.map(form => (
                    <Picker.Item key={form.value} label={form.label} value={form.value} />
                  ))}
                </Picker>
              </View>
              
              <View style={styles.chipContainer}>
                <Chip
                  selected={formData.schedule_mode === 'times'}
                  onPress={() => setFormData(prev => ({ ...prev, schedule_mode: 'times' }))}
                  style={styles.modeChip}
                >
                  Belirli Saatler
                </Chip>
                <Chip
                  selected={formData.schedule_mode === 'interval'}
                  onPress={() => setFormData(prev => ({ ...prev, schedule_mode: 'interval' }))}
                  style={styles.modeChip}
                >
                  Saat Aralığı
                </Chip>
              </View>
            </View>

            {formData.schedule_mode === 'times' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Zamanlar</Text>
                {formData.times.map((time, index) => (
                  <View key={index} style={styles.timeRow}>
                    <TextInput
                      mode="outlined"
                      value={time}
                      onChangeText={(text) => updateTime(index, text)}
                      placeholder="HH:MM"
                      style={[styles.input, { flex: 1 }]}
                      outlineStyle={styles.inputOutline}
                    />
                    {formData.times.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeTime(index)}
                        style={styles.removeTimeButton}
                      >
                        <Minus size={20} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity onPress={addTime} style={styles.addTimeButton}>
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addTimeText}>Zaman Ekle</Text>
                </TouchableOpacity>
              </View>
            )}

            {formData.schedule_mode === 'interval' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Her ... Saatte Bir</Text>
                <TextInput
                  mode="outlined"
                  value={formData.every_hours.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, every_hours: parseInt(text) || 8 }))}
                  placeholder="8"
                  keyboardType="numeric"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Günler</Text>
              <View style={styles.dayChips}>
                {dayNames.map((day, index) => (
                  <Chip
                    key={index}
                    selected={formData.days_of_week.includes(index + 1)}
                    onPress={() => toggleDay(index + 1)}
                    style={styles.dayChip}
                  >
                    {day}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Başlangıç Tarihi</Text>
                <TouchableOpacity onPress={() => setShowStartCalendar(true)}>
                  <TextInput
                    mode="outlined"
                    value={formData.start_date}
                    placeholder="YYYY-AA-GG"
                    editable={false}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    right={<TextInput.Icon icon={() => <Clock size={20} color={colors.onSurfaceVariant} />} />}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Bitiş Tarihi</Text>
                <TouchableOpacity onPress={() => setShowEndCalendar(true)}>
                  <TextInput
                    mode="outlined"
                    value={formData.end_date}
                    placeholder="Seçiniz (isteğe bağlı)"
                    editable={false}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    right={<TextInput.Icon icon={() => <Clock size={20} color={colors.onSurfaceVariant} />} />}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {showStartCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={(day) => {
                    setFormData(prev => ({ ...prev, start_date: day.dateString }));
                    setShowStartCalendar(false);
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
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
                  onPress={() => setShowStartCalendar(false)}
                  style={styles.closeCalendarButton}
                >
                  Kapat
                </Button>
              </View>
            )}

            {showEndCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={(day) => {
                    setFormData(prev => ({ ...prev, end_date: day.dateString }));
                    setShowEndCalendar(false);
                  }}
                  minDate={formData.start_date}
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
                  onPress={() => setShowEndCalendar(false)}
                  style={styles.closeCalendarButton}
                >
                  Kapat
                </Button>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yemek İlişkisi</Text>
              <View style={styles.chipContainer}>
                <Chip
                  selected={formData.with_food === 'none'}
                  onPress={() => setFormData(prev => ({ ...prev, with_food: 'none' }))}
                  style={styles.foodChip}
                >
                  Bağımsız
                </Chip>
                <Chip
                  selected={formData.with_food === 'before'}
                  onPress={() => setFormData(prev => ({ ...prev, with_food: 'before' }))}
                  style={styles.foodChip}
                >
                  Yemek Önce
                </Chip>
                <Chip
                  selected={formData.with_food === 'after'}
                  onPress={() => setFormData(prev => ({ ...prev, with_food: 'after' }))}
                  style={styles.foodChip}
                >
                  Yemek Sonra
                </Chip>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notlar</Text>
              <TextInput
                mode="outlined"
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="İlaçla ilgili özel notlar..."
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.switchLabel}>Gerektiğinde (PRN)</Text>
                <Text style={styles.switchSubtext}>İlaç düzenli değil, gerektiğinde alınır</Text>
              </View>
              <Switch
                value={formData.prn}
                onValueChange={(value) => setFormData(prev => ({ ...prev, prn: value }))}
                color={colors.primary}
              />
            </View>

            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.switchLabel}>Hatırlatma Bildirimleri</Text>
                <Text style={styles.switchSubtext}>İlaç zamanında bildirim al</Text>
              </View>
              <Switch
                value={formData.notification_enabled}
                onValueChange={(value) => setFormData(prev => ({ ...prev, notification_enabled: value }))}
                color={colors.primary}
              />
            </View>
          </View>
        </Surface>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={saveMedication}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonLabel}
        >
          {loading ? 'Kaydediliyor...' : 'İlaç Kaydet'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    backgroundColor: colors.surfaceVariant,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeTimeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    marginTop: 8,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  dayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: colors.surfaceVariant,
    minWidth: 44,
  },
  foodChip: {
    backgroundColor: colors.surfaceVariant,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  switchSubtext: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.surface,
    elevation: 8,
  },
  saveButton: {
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  saveButtonContent: {
    height: 56,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});