import { StyleSheet, Text, View, Image, ScrollView, Alert, Platform, TouchableOpacity, TextInput } from 'react-native'
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { Ionicons } from '@expo/vector-icons' 
import { Link, useRouter } from 'expo-router';
import { auth, db } from '@/components/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore'
import { Spinner } from '@/components/ui/spinner'

// 🖼️ Logo Asset
const appLogo = require('../../assets/icon.png');

// 🎨 BRAND COLOR: VIVID MEDIUM RED
const VIVID_RED = "#E60000"; 

export default function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Form States
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 🛡️ Logic for Validation
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password !== '';
  const isEmailOk = email.includes('@');
  const isNameOk = firstName.trim().length > 0 && lastName.trim().length > 0;
  
  const canRegister = isPasswordValid && passwordsMatch && isEmailOk && isNameOk;

  const handleCreateAccount = async () => {
    if (!canRegister) {
      Alert.alert('Form Error', 'Please check that names are filled, email is valid, and passwords match (min 8 chars).');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email.toLowerCase().trim(),
        firstName, 
        lastName,
        createdAt: new Date().toISOString()
      });
      await AsyncStorage.setItem('userEmail', email);
      router.replace('/'); 
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <Spinner size="large" color={VIVID_RED} />
        <Text style={styles.loadingText}>Creating Account...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.wrapper}>
        <Card style={styles.card}>
          
          <View style={styles.logoSection}>
            <Image source={appLogo} style={styles.logo} />
            <Text style={styles.title}>QuickFirstAid</Text>
            <Text style={styles.subtitle}>Create Your Profile</Text>
          </View>

          <FormControl>
            {/* FIRST NAME */}
            <FormControlLabel><FormControlLabelText style={styles.labelText}>First Name</FormControlLabelText></FormControlLabel>
            <View style={styles.inputWrapper}>
               <TextInput style={styles.textInput} placeholder='John' value={firstName} onChangeText={setFirstName} placeholderTextColor="#999" />
            </View>

            {/* LAST NAME */}
            <FormControlLabel style={styles.mt}><FormControlLabelText style={styles.labelText}>Last Name</FormControlLabelText></FormControlLabel>
            <View style={styles.inputWrapper}>
               <TextInput style={styles.textInput} placeholder='Doe' value={lastName} onChangeText={setLastName} placeholderTextColor="#999" />
            </View>

            {/* EMAIL */}
            <FormControlLabel style={styles.mt}><FormControlLabelText style={styles.labelText}>Email Address</FormControlLabelText></FormControlLabel>
            <View style={styles.inputWrapper}>
               <TextInput 
                  style={styles.textInput} 
                  placeholder='email@example.com' 
                  autoCapitalize='none' 
                  keyboardType="email-address" 
                  value={email} 
                  onChangeText={setEmail} 
                  placeholderTextColor="#999"
                />
            </View>

            {/* PASSWORD */}
            <FormControlLabel style={styles.mt}><FormControlLabelText style={styles.labelText}>Password</FormControlLabelText></FormControlLabel>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.textInput}
                placeholder="8+ characters" 
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.securityHintRow}>
              <View style={[styles.strengthBar, { backgroundColor: isPasswordValid ? '#27ae60' : '#ccc' }]} />
              <Text style={[styles.hintText, { color: isPasswordValid ? '#27ae60' : '#999' }]}>Min. 8 chars</Text>
            </View>

            {/* CONFIRM PASSWORD */}
            <FormControlLabel style={styles.mt}><FormControlLabelText style={styles.labelText}>Confirm Password</FormControlLabelText></FormControlLabel>
            <View style={styles.inputWrapper}>
               <TextInput 
                style={styles.textInput}
                placeholder="Repeat password" 
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Match Indicators */}
            {password !== '' && confirmPassword !== '' && (
              <Text style={[styles.matchText, { color: passwordsMatch ? '#27ae60' : VIVID_RED }]}>
                {passwordsMatch ? '✓ Passwords Match' : '✗ Passwords Do Not Match'}
              </Text>
            )}
          </FormControl>

          {/* 🔴 ALWAYS RED REGISTER BUTTON */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.btn} 
            onPress={handleCreateAccount}
          >
            <Text style={styles.btnText}>Register Now</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={{color: '#666'}}>Joined already? </Text>
            <Link href="/login" style={styles.linkText}>Login</Link>
          </View>
        </Card>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, backgroundColor: '#F4F6F8' },
  wrapper: { paddingVertical: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16 },
  card: { padding: 25, borderRadius: 25, backgroundColor: 'white', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  logoSection: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 70, height: 70, borderRadius: 15, marginBottom: 10 },
  title: { color: VIVID_RED, fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#666', fontSize: 15, fontWeight: '600' },
  
  // Unified Input Styles
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f9f9f9', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 10, 
    height: 50, 
    paddingHorizontal: 12 
  },
  textInput: { flex: 1, height: '100%', fontSize: 15, color: '#333' },
  labelText: { fontWeight: '600', color: '#333' },

  eyeIcon: { padding: 5 },
  mt: { marginTop: 15 },
  securityHintRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  strengthBar: { width: 22, height: 4, borderRadius: 2, marginRight: 8 },
  hintText: { fontSize: 12 },
  matchText: { fontSize: 13, marginTop: 6, fontWeight: 'bold' },
  
  // ALWAYS RED BUTTON STYLE
  btn: { 
    marginTop: 30, 
    borderRadius: 12, 
    height: 55, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: VIVID_RED, // Fixed Red Color
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { color: VIVID_RED, fontWeight: 'bold', textDecorationLine: 'underline' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 15, color: VIVID_RED, fontWeight: 'bold' },
})