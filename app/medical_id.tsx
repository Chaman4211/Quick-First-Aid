import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, SafeAreaView, StatusBar, Image, Switch, Linking, Platform, Modal, FlatList 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const VIVID_RED = "#E60000";

// Predefined Options
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMMON_CONDITIONS = ['None', 'Diabetes', 'Asthma', 'Hypertension', 'Heart Disease', 'Epilepsy'];
const COMMON_ALLERGIES = ['None', 'Peanuts', 'Penicillin', 'Lactose', 'Latex', 'Bee Stings'];

export default function MedicalID() {
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activePicker, setActivePicker] = useState<{ type: string, options: string[] } | null>(null);

  const [data, setData] = useState({
    name: '',
    dob: '',
    bloodType: '',
    weight: '',
    height: '',
    allergies: '',
    conditions: '',
    emergencyContact: '',
    isOrganDonor: false
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('medical_id_data');
      const savedImage = await AsyncStorage.getItem('medical_id_photo');
      if (savedData) setData(JSON.parse(savedData));
      if (savedImage) setImage(savedImage);
    } catch (e) { console.log('Failed to load storage'); }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('medical_id_data', JSON.stringify(data));
      // ✅ Explicitly save image to storage
      if (image) {
        await AsyncStorage.setItem('medical_id_photo', image);
      } else {
        await AsyncStorage.removeItem('medical_id_photo');
      }
      setIsEditing(false);
      Alert.alert("Success", "Medical ID updated.");
    } catch (e) { Alert.alert("Error", "Save failed."); }
  };

  const clearAllData = () => {
    Alert.alert(
      "Clear All Records?",
      "This will permanently delete your Medical ID data.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem('medical_id_data');
            await AsyncStorage.removeItem('medical_id_photo');
            setData({
              name: '', dob: '', bloodType: '', weight: '', height: '',
              allergies: '', conditions: '', emergencyContact: '', isOrganDonor: false
            });
            setImage(null);
            Alert.alert("Cleared", "All data has been reset.");
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    // 📸 Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "We need gallery access to set a photo.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      // ✅ Use assets array for the URI
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString();
      setData({ ...data, dob: formattedDate });
    }
  };

  const SelectionRow = ({ label, value, onPress }: { label: string, value: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.selectBox} onPress={onPress}>
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={styles.selectValueRow}>
        <Text style={styles.selectValueText}>{value || 'Select...'}</Text>
        <Ionicons name="chevron-down" size={18} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={VIVID_RED} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical ID</Text>
        <TouchableOpacity style={styles.editBtnContainer} onPress={() => isEditing ? saveData() : setIsEditing(true)}>
          <Text style={styles.editBtn}>{isEditing ? "Save" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.idCard}>
          <View style={styles.cardTopRow}>
            {/* 📸 FIXED IMAGE WRAPPER */}
            <TouchableOpacity 
              onPress={isEditing ? pickImage : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={30} color="#ccc" />
                  {isEditing && <Text style={styles.addPhotoText}>+ Photo</Text>}
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.cardLabel}>EMERGENCY MEDICAL ID</Text>
              <Text style={styles.nameText}>{data.name || "YOUR NAME"}</Text>
              <Text style={styles.dobText}>DOB: {data.dob || "--/--/----"}</Text>
            </View>
            
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodTitle}>BLOOD</Text>
              <Text style={styles.bloodValue}>{data.bloodType || "?"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>HEIGHT</Text>
              <Text style={styles.statValue}>{data.height || "-"}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>WEIGHT</Text>
              <Text style={styles.statValue}>{data.weight || "-"}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ORGAN DONOR</Text>
              <Text style={[styles.statValue, { color: data.isOrganDonor ? VIVID_RED : '#999' }]}>
                {data.isOrganDonor ? "YES" : "NO"}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>MEDICAL CONDITIONS</Text>
            <Text style={styles.infoValue}>{data.conditions || "None listed"}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>ALLERGIES & REACTIONS</Text>
            <Text style={[styles.infoValue, { color: VIVID_RED }]}>{data.allergies || "None listed"}</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.sectionHeader}>Personal Details</Text>
            <TextInput style={styles.input} value={data.name} onChangeText={(t) => setData({...data, name: t})} placeholder="Full Name" />
            <SelectionRow label="Date of Birth" value={data.dob} onPress={() => setShowDatePicker(true)} />

            <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 5}}>
                <SelectionRow label="Height" value={data.height} onPress={() => {
                    const heights = Array.from({length: 100}, (_, i) => `${140 + i} cm`);
                    setActivePicker({ type: 'height', options: heights });
                }} />
              </View>
              <View style={{flex: 1, marginLeft: 5}}>
                <SelectionRow label="Weight" value={data.weight} onPress={() => {
                    const weights = Array.from({length: 150}, (_, i) => `${40 + i} kg`);
                    setActivePicker({ type: 'weight', options: weights });
                }} />
              </View>
            </View>

            <Text style={styles.sectionHeader}>Medical Info</Text>
            <SelectionRow label="Blood Type" value={data.bloodType} onPress={() => setActivePicker({ type: 'bloodType', options: BLOOD_TYPES })} />
            <SelectionRow label="Conditions" value={data.conditions} onPress={() => setActivePicker({ type: 'conditions', options: COMMON_CONDITIONS })} />
            <SelectionRow label="Allergies" value={data.allergies} onPress={() => setActivePicker({ type: 'allergies', options: COMMON_ALLERGIES })} />

            <Text style={styles.sectionHeader}>Emergency Contact</Text>
            <TextInput style={styles.input} value={data.emergencyContact} onChangeText={(t) => setData({...data, emergencyContact: t})} placeholder="Phone Number" keyboardType="phone-pad" />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Organ Donor?</Text>
              <Switch 
                value={data.isOrganDonor} 
                onValueChange={(val) => setData({...data, isOrganDonor: val})} 
                trackColor={{ false: "#ccc", true: VIVID_RED }}
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAllData}>
            <Ionicons name="trash-outline" size={18} color="#999" />
            <Text style={styles.clearText}>Clear All Records</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker value={new Date()} mode="date" display="default" onChange={onDateChange} />
      )}

      <Modal visible={activePicker !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {activePicker?.type.toUpperCase()}</Text>
            <FlatList
              data={activePicker?.options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionItem} onPress={() => {
                  setData({ ...data, [activePicker!.type]: item });
                  setActivePicker(null);
                }}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActivePicker(null)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { backgroundColor: VIVID_RED, padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  editBtnContainer: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20 },
  editBtn: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  scroll: { padding: 16 },
  
  idCard: { backgroundColor: 'white', borderRadius: 20, padding: 15, elevation: 4, marginBottom: 20 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerInfo: { flex: 1, marginLeft: 10 },
  cardLabel: { fontSize: 8, color: VIVID_RED, fontWeight: 'bold', letterSpacing: 0.5 },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  dobText: { fontSize: 12, color: '#666' },
  profilePhoto: { width: 70, height: 70, borderRadius: 10 },
  photoPlaceholder: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  addPhotoText: { fontSize: 8, color: VIVID_RED, marginTop: 2, fontWeight: 'bold' },

  bloodBadge: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#fff0f1', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: VIVID_RED },
  bloodTitle: { fontSize: 7, color: VIVID_RED, fontWeight: 'bold' },
  bloodValue: { color: VIVID_RED, fontWeight: 'bold', fontSize: 16 },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  infoSection: { marginTop: 10 },
  infoLabel: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  infoValue: { fontSize: 14, color: '#333' },

  form: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 30 },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', marginVertical: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  rowInputs: { flexDirection: 'row' },
  
  selectBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  selectLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  selectValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectValueText: { fontSize: 14, color: '#333' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: 5 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: VIVID_RED },
  optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  optionText: { fontSize: 16, textAlign: 'center' },
  closeBtn: { marginTop: 15, padding: 15, backgroundColor: '#eee', borderRadius: 10, marginBottom: 20 },
  closeBtnText: { textAlign: 'center', fontWeight: 'bold', color: '#666' },

  clearBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, marginBottom: 40 },
  clearText: { color: '#999', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
});