import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '@/components/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIVID_RED = "#E60000"; 

export default function UserProfile() {
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setPhone(data.phoneNumber || '');
        setEmail(user.email || '');
        setProfileImage(data.profilePic || null);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  // ✅ FIXED: Image Picker with Base64 support for Firestore
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Enable gallery access in settings.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Balance between quality and Firestore 1MB limit
      base64: true,
    });

    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(base64Img);
      
      // If NOT editing text, save image immediately
      if (!isEditing) {
        updateProfileInFirebase(base64Img);
      }
    }
  };

  const updateProfileInFirebase = async (passedImg?: string) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No user logged in");

      // Security Check for Email/Password changes
      if (email !== user.email || newPassword.length > 0) {
        if (!currentPassword) throw new Error("Current password required for security changes.");
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      if (newPassword.length > 0) {
        if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
        await updatePassword(user, newPassword);
      }

      if (email !== user.email) {
        await updateEmail(user, email.trim());
      }

      // Update Database
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        firstName,
        lastName,
        phoneNumber: phone,
        profilePic: passedImg || profileImage || ""
      };
      
      await updateDoc(userRef, updateData);
      
      setUserData({ ...userData, ...updateData });
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      Alert.alert("Success", "Profile updated!");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Confirm Logout?", [
      { text: "Cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
          await signOut(auth);
          await AsyncStorage.clear();
      }}
    ]);
  };

  if (initialLoading) return <View style={styles.center}><ActivityIndicator size="large" color={VIVID_RED} /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* ✅ FIXED: Image selection triggers pickImage */}
        <TouchableOpacity style={styles.imageWrapper} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, styles.placeholder]}>
              <Ionicons name="person" size={50} color="#fff" />
            </View>
          )}
          <View style={styles.cameraBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editForm}>
            {/* Input fields as before... */}
            <Text style={styles.label}>Personal Info</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone" />

            <Text style={styles.label}>Security Changes</Text>
            <View style={styles.passInputWrapper}>
              <TextInput style={styles.passInput} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current Password" secureTextEntry={!showCurrent} />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}><Ionicons name={showCurrent ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity>
            </View>

            <View style={styles.passInputWrapper}>
              <TextInput style={styles.passInput} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" secureTextEntry={!showNew} />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}><Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity>
            </View>

            <View style={styles.passInputWrapper}>
              <TextInput style={styles.passInput} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" secureTextEntry={!showConfirm} />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.btn, styles.updateBtn]} onPress={() => updateProfileInFirebase()}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Profile</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsEditing(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.userName}>{userData?.firstName} {userData?.lastName}</Text>
            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {!isEditing && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.row}>
              <Ionicons name="log-out-outline" size={24} color={VIVID_RED} />
              <Text style={[styles.settingText, { color: VIVID_RED }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 8 },
  editForm: { width: '85%', marginTop: 10 },
  label: { fontSize: 13, color: VIVID_RED, marginBottom: 8, fontWeight: 'bold', marginTop: 10 },
  input: { backgroundColor: '#f4f6f8', padding: 14, borderRadius: 12, marginBottom: 10, fontSize: 15 },
  passInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f8', borderRadius: 12, paddingHorizontal: 14, marginBottom: 10, height: 50 },
  passInput: { flex: 1, height: '100%', fontSize: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', elevation: 2 },
  updateBtn: { backgroundColor: VIVID_RED, flex: 0.65 },
  cancelBtn: { backgroundColor: '#999', flex: 0.3 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  imageWrapper: { position: 'relative', marginBottom: 15 },
  profilePic: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#f4f6f8' },
  placeholder: { backgroundColor: VIVID_RED, justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#333', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#777' },
  editProfileBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 25, borderWidth: 1.5, borderColor: VIVID_RED },
  editBtnText: { color: VIVID_RED, fontWeight: 'bold' },
  section: { padding: 25 },
  settingRow: { backgroundColor: '#fff', padding: 18, borderRadius: 18, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 16, marginLeft: 15, fontWeight: '600' }
});