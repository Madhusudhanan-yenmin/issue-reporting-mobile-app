import React, { useState, useRef, useEffect } from 'react';
import { Audio, Video, ResizeMode } from 'expo-av';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { useAppDispatch, useAppSelector } from '../../store';
import { createIssue } from '../../store/slices/issueSlice';
import { showToast } from '../../store/slices/uiSlice';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { UserTabParamList, RootStackParamList } from '../../navigation/types';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = CompositeScreenProps<
  BottomTabScreenProps<UserTabParamList, 'CreateIssue'>,
  StackScreenProps<RootStackParamList>
>;

const CATEGORIES = ['ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Villupuram',
  'Virudhunagar',
];

export const CreateIssueScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.issue);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ROAD');
  const [priority, setPriority] = useState('LOW');
  
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    district?: string;
    town?: string;
    address?: string;
    customCategory?: string;
  }>({});

  // Voice Recording State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState('');
  const [uploadingVoice, setUploadingVoice] = useState(false);

  // Video State
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const titleInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Clear form inputs when screen gains focus
      setTitle('');
      setDescription('');
      setCategory('ROAD');
      setPriority('LOW');
      setDistrict('');
      setTown('');
      setStateName('Tamil Nadu');
      setAddress('');
      setLatitude(undefined);
      setLongitude(undefined);
      setImages([]);
      setCustomCategory('');
      setErrors({});
      setRecordingUri(null);
      setVoiceUrl('');
      setVideoUri(null);
      setVideoUrl('');

      // Auto focus the title field after transition finishes
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!title.trim()) {
      tempErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      tempErrors.description = 'Description is required';
    }
    if (!district) {
      tempErrors.district = 'District is required';
    }
    if (!town.trim()) {
      tempErrors.town = 'Town/City is required';
    }
    if (!address.trim()) {
      tempErrors.address = 'Address is required';
    }
    if (category === 'OTHER' && !customCategory.trim()) {
      tempErrors.customCategory = 'Please specify the category';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleUseCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location is required!');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = locationData.coords;
      setLatitude(latitude);
      setLongitude(longitude);

      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResult && addressResult.length > 0) {
        const addr = addressResult[0];

        // 1. Resolve District
        const resolvedDistrict = addr.district || addr.subregion || addr.city || '';
        const matchedDistrict = DISTRICTS.find(
          (d) => d.toLowerCase() === resolvedDistrict.toLowerCase()
        );
        if (matchedDistrict) {
          setDistrict(matchedDistrict);
          if (errors.district) setErrors((prev) => ({ ...prev, district: undefined }));
        } else {
          const cityMatch = DISTRICTS.find(
            (d) => d.toLowerCase() === (addr.city || '').toLowerCase()
          );
          if (cityMatch) {
            setDistrict(cityMatch);
            if (errors.district) setErrors((prev) => ({ ...prev, district: undefined }));
          } else {
            setDistrict('');
          }
        }

        // 2. Resolve Town / City
        const resolvedTown = addr.city || addr.subregion || addr.district || '';
        setTown(resolvedTown);
        if (errors.town) setErrors((prev) => ({ ...prev, town: undefined }));

        // 3. Resolve State
        const resolvedState = addr.region || '';
        setStateName(resolvedState);

        // 4. Resolve Address
        const namePart = addr.name && addr.name !== addr.streetNumber ? addr.name : '';
        const addressParts = [
          namePart,
          addr.streetNumber,
          addr.street,
        ].filter(Boolean);
        const resolvedAddress = addressParts.join(', ') || 'GPS Location';
        setAddress(resolvedAddress);
        if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));

        dispatch(showToast({ message: 'Location auto-filled successfully!', type: 'success' }));
      } else {
        Alert.alert('Location Error', 'Unable to resolve address for coordinates.');
      }
    } catch (err: any) {
      Alert.alert('Location Error', 'Failed to retrieve your current location. Please verify GPS is enabled.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const pickImage = async (skipCrop = false) => {
    // Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: !skipCrop,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      uploadSelectedImage(asset.uri, asset.fileName || undefined, asset.mimeType || undefined);
    }
  };

  const takePhoto = async (skipCrop = false) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: !skipCrop,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      uploadSelectedImage(asset.uri, asset.fileName || undefined, asset.mimeType || undefined);
    }
  };

  const promptCropOption = (onSelect: (skipCrop: boolean) => void) => {
    Alert.alert(
      'Crop Option',
      'Do you want to crop the photo or skip cropping?',
      [
        {
          text: 'Crop Photo ✂️',
          onPress: () => onSelect(false),
        },
        {
          text: 'Skip Crop ⏩',
          onPress: () => onSelect(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleImageAttachment = () => {
    Alert.alert(
      'Attach Image',
      'Select the source for your grievance photo:',
      [
        {
          text: 'Take Photo 📸',
          onPress: () => promptCropOption((skipCrop) => takePhoto(skipCrop)),
        },
        {
          text: 'Choose from Gallery 🖼️',
          onPress: () => promptCropOption((skipCrop) => pickImage(skipCrop)),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadSelectedImage = async (uri: string, assetName?: string, assetType?: string) => {
    try {
      setUploadingImage(true);
      
      let filename = assetName || uri.split('/').pop() || 'upload.jpg';
      let type = assetType || 'image/jpeg';

      // Ensure extension exists
      if (!filename.includes('.')) {
        const ext = type.split('/').pop() || 'jpg';
        filename = `${filename}.${ext}`;
      }

      // Sanitize special/percent-encoded characters from Content URIs
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      const formData = new FormData();
      // Need cast to any because react-native's FormData typing differs slightly from DOM's
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.secure_url;
      if (imageUrl) {
        setImages((prev) => [...prev, imageUrl]);
      } else {
        throw new Error('Image URL not returned by server');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access microphone is required to record a voice message.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingPreview(false);
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err: any) {
      Alert.alert('Recording Error', 'Failed to start audio recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);

      if (uri) {
        uploadVoiceMessage(uri);
      }
    } catch (err: any) {
      Alert.alert('Recording Error', 'Failed to stop audio recording.');
    }
  };

  const uploadVoiceMessage = async (uri: string) => {
    try {
      setUploadingVoice(true);
      let filename = uri.split('/').pop() || 'voice.m4a';
      
      // Sanitize special/percent-encoded characters from Content URIs
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      const type = 'audio/m4a';

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const audioUrl = response.data.secure_url;
      if (audioUrl) {
        setVoiceUrl(audioUrl);
      } else {
        throw new Error('Audio URL not returned by server');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', 'Failed to upload voice message. Please try recording again.');
      setRecordingUri(null);
    } finally {
      setUploadingVoice(false);
    }
  };

  const handlePlayPreview = async () => {
    if (!recordingUri) return;
    try {
      if (isPlayingPreview && sound) {
        await sound.pauseAsync();
        setIsPlayingPreview(false);
        return;
      }

      if (sound) {
        await sound.playAsync();
        setIsPlayingPreview(true);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlayingPreview(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPreview(false);
          newSound.stopAsync();
        }
      });
    } catch (err: any) {
      Alert.alert('Playback Error', 'Failed to play recorded preview.');
    }
  };

  const handleDeleteRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setRecordingUri(null);
      setVoiceUrl('');
      setIsPlayingPreview(false);
    } catch (err: any) {}
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required to select a video!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      uploadSelectedVideo(asset.uri, asset.fileName || undefined, asset.mimeType || undefined);
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access camera is required to record a video!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      uploadSelectedVideo(asset.uri, asset.fileName || undefined, asset.mimeType || undefined);
    }
  };

  const handleVideoAttachment = () => {
    Alert.alert(
      'Attach Video',
      'Select the source for your grievance video:',
      [
        {
          text: 'Record Video 📹',
          onPress: recordVideo,
        },
        {
          text: 'Choose from Gallery 🖼️',
          onPress: pickVideo,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadSelectedVideo = async (uri: string, assetName?: string, assetType?: string) => {
    try {
      setUploadingVideo(true);
      let filename = assetName || uri.split('/').pop() || 'video.mp4';
      let type = assetType || 'video/mp4';

      // Ensure extension exists
      if (!filename.includes('.')) {
        const ext = type.split('/').pop() || 'mp4';
        filename = `${filename}.${ext}`;
      }

      // Sanitize special/percent-encoded characters from Content URIs
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const serverVideoUrl = response.data.secure_url;
      if (serverVideoUrl) {
        setVideoUri(uri);
        setVideoUrl(serverVideoUrl);
      } else {
        throw new Error('Video URL not returned by server');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', 'Failed to upload video. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = () => {
    setVideoUri(null);
    setVideoUrl('');
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      title,
      description: category === 'OTHER' ? `[Custom Category: ${customCategory.trim()}] ${description}` : description,
      category,
      priority,
      district,
      town,
      address,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      location: `${address}, ${town}, ${district}`,
      images,
      voiceUrl: voiceUrl || undefined,
      videoUrl: videoUrl || undefined,
    };

    const resultAction = await dispatch(createIssue(payload));
    if (createIssue.fulfilled.match(resultAction)) {
      dispatch(showToast({ message: 'Your grievance has been filed successfully!', type: 'success' }));
      setTitle('');
      setDescription('');
      setDistrict('');
      setTown('');
      setStateName('Tamil Nadu');
      setAddress('');
      setLatitude(undefined);
      setLongitude(undefined);
      setImages([]);
      setRecordingUri(null);
      setVoiceUrl('');
      setVideoUri(null);
      setVideoUrl('');
      setCustomCategory('');
      navigation.navigate('UserDashboard');
    } else {
      dispatch(showToast({ message: (resultAction.payload as string) || 'Failed to file issue', type: 'error' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.topBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.topBackText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.screenTitle}>File an Issue</Text>
          <Text style={styles.screenSubtitle}>Provide details about the civic grievance</Text>

          <CustomInput
            ref={titleInputRef}
            label="Issue Title"
            placeholder="E.g., Pothole on Main Street"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            error={errors.title}
          />

          <CustomInput
            label="Description"
            placeholder="Describe the issue in detail"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: undefined });
            }}
            error={errors.description}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          {/* Category Selection */}
          <View style={styles.selectionGroup}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.tagGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tagButton, category === cat && styles.tagButtonActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.tagText, category === cat && styles.tagTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Category Input if OTHER is selected */}
          {category === 'OTHER' && (
            <CustomInput
              label="Specify Custom Category"
              placeholder="E.g., Stray Dogs, Broken Bench, Streetlight..."
              value={customCategory}
              onChangeText={(text) => {
                setCustomCategory(text);
                if (errors.customCategory) setErrors({ ...errors, customCategory: undefined });
              }}
              error={errors.customCategory}
            />
          )}

          {/* Priority Selection */}
          <View style={styles.selectionGroup}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.tagGrid}>
              {PRIORITIES.map((pri) => (
                <TouchableOpacity
                  key={pri}
                  style={[styles.tagButton, priority === pri && styles.tagButtonActive]}
                  onPress={() => setPriority(pri)}
                >
                  <Text style={[styles.tagText, priority === pri && styles.tagTextActive]}>
                    {pri}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Information Section */}
          <View style={styles.locationContainer}>
            <Text style={styles.sectionLabel}>Location Information</Text>

            {/* Option 1: Use Current Location */}
            <TouchableOpacity
              style={[
                styles.gpsButton,
                fetchingLocation && styles.gpsButtonFetching,
              ]}
              onPress={handleUseCurrentLocation}
              disabled={fetchingLocation}
              activeOpacity={0.8}
            >
              {fetchingLocation ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              ) : (
                <Ionicons name="location" size={18} color="#FFFFFF" style={{ marginRight: Spacing.xs }} />
              )}
              <Text style={styles.gpsButtonText}>
                {fetchingLocation ? 'Fetching GPS Location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.manualEntryDivider}>— Or Enter Location Manually —</Text>

            {/* Option 2: Manual / GPS Fields */}
            {/* District Select */}
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>District *</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  errors.district ? styles.selectBoxError : null,
                ]}
                onPress={() => setDistrictModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={district ? styles.selectValueText : styles.selectPlaceholderText}>
                  {district || 'Select district'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            {/* Town / City input */}
            <CustomInput
              label="Town / City *"
              placeholder="E.g., Panruti"
              value={town}
              onChangeText={(text) => {
                setTown(text);
                if (errors.town) setErrors({ ...errors, town: undefined });
              }}
              error={errors.town}
            />

            {/* State input */}
            <CustomInput
              label="State (Optional)"
              placeholder="E.g., Tamil Nadu"
              value={stateName}
              onChangeText={setStateName}
            />

            {/* Address input */}
            <CustomInput
              label="Address *"
              placeholder="E.g., Near Bus Stand"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) setErrors({ ...errors, address: undefined });
              }}
              error={errors.address}
            />

            {/* Coordinates Display if present */}
            {latitude && longitude ? (
              <Text style={styles.gpsCoordinatesInfo}>
                📍 GPS Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            ) : null}
          </View>

          {/* Image Upload Area */}
          <View style={styles.imageUploadSection}>
            <Text style={styles.sectionLabel}>Images (Max 5)</Text>
            <View style={styles.imageRow}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageBadge}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Text style={styles.removeText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  style={styles.uploadTrigger}
                  onPress={handleImageAttachment}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Text style={styles.uploadTriggerText}>+ Add</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Voice Description Section */}
          <View style={styles.voiceSection}>
            <Text style={styles.sectionLabel}>Voice Description (Optional)</Text>
            
            {/* If not recording and no recording exists */}
            {!isRecording && !recordingUri && (
              <TouchableOpacity style={styles.voiceButton} onPress={startRecording}>
                <Text style={styles.voiceButtonText}>🎤 Record Voice Description</Text>
              </TouchableOpacity>
            )}

            {/* If currently recording */}
            {isRecording && (
              <TouchableOpacity style={[styles.voiceButton, styles.voiceButtonRecording]} onPress={stopRecording}>
                <View style={styles.blinkingDot} />
                <Text style={styles.voiceButtonTextRecording}>Recording... Tap to Stop ⏹</Text>
              </TouchableOpacity>
            )}

            {/* If recording exists */}
            {!isRecording && recordingUri && (
              <View style={styles.previewContainer}>
                <TouchableOpacity style={styles.playButton} onPress={handlePlayPreview}>
                  <Text style={styles.playButtonText}>
                    {isPlayingPreview ? '⏸ Pause Preview' : '▶ Play Preview'}
                  </Text>
                </TouchableOpacity>
                
                {uploadingVoice ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginLeft: Spacing.sm }} />
                ) : (
                  <Text style={styles.uploadSuccessText}>✓ Uploaded to Server</Text>
                )}

                <TouchableOpacity style={styles.deleteVoiceBtn} onPress={handleDeleteRecording}>
                  <Text style={styles.deleteVoiceText}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Video Attachment Section */}
          <View style={styles.videoSection}>
            <Text style={styles.sectionLabel}>Video Attachment (Optional)</Text>
            
            {/* If no video selected */}
            {!videoUri && !uploadingVideo && (
              <TouchableOpacity style={styles.videoSelectButton} onPress={handleVideoAttachment}>
                <Text style={styles.videoSelectButtonText}>🎥 Add Video Attachment</Text>
              </TouchableOpacity>
            )}

            {/* If uploading */}
            {uploadingVideo && (
              <View style={styles.videoUploadingContainer}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.videoUploadingText}>Uploading Video...</Text>
              </View>
            )}

            {/* If video selected */}
            {videoUri && !uploadingVideo && (
              <View style={styles.videoPreviewCard}>
                <Video
                  source={{ uri: videoUri }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={true}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                  useNativeControls
                  style={styles.videoPreviewPlayer}
                />
                <View style={styles.videoPreviewDetails}>
                  <Text style={styles.videoNameText} numberOfLines={1}>
                    {videoUri.split('/').pop() || 'Selected Video'}
                  </Text>
                  <TouchableOpacity style={styles.deleteVideoBtn} onPress={handleDeleteVideo}>
                    <Text style={styles.deleteVideoText}>Remove Video 🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <CustomButton
            title="Submit Complaint"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* District Selection Modal */}
      <Modal visible={districtModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select District</Text>
            <ScrollView style={styles.modalScroll}>
              {DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.modalItem,
                    district === d && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setDistrict(d);
                    setDistrictModalVisible(false);
                    if (errors.district) setErrors((prev) => ({ ...prev, district: undefined }));
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      district === d && styles.modalItemTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <CustomButton
              title="Cancel"
              onPress={() => setDistrictModalVisible(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    marginBottom: Spacing.xl,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  selectionGroup: {
    marginBottom: Spacing.base,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagButton: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  imageUploadSection: {
    marginBottom: Spacing.xl,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  imagePreviewContainer: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.sm,
  },
  removeImageBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  uploadTrigger: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTriggerText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  locationContainer: {
    marginBottom: Spacing.base,
    width: '100%',
  },
  gpsButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  gpsButtonFetching: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.8,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Typography.size.base,
  },
  manualEntryDivider: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs + 1,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginVertical: Spacing.sm,
    textTransform: 'uppercase',
  },
  gpsCoordinatesInfo: {
    color: Colors.accent,
    fontSize: Typography.size.xs + 1,
    fontWeight: 'bold',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  // Custom Select Input Styles
  selectContainer: {
    marginBottom: Spacing.base,
    width: '100%',
  },
  selectLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  selectBoxError: {
    borderColor: Colors.error,
  },
  selectValueText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
  },
  selectPlaceholderText: {
    color: Colors.placeholder,
    fontSize: Typography.size.base,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.xs + 1,
    marginTop: Spacing.xs,
  },
  // Modal Selector Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    maxHeight: '70%',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: Spacing.md,
  },
  modalItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.sm,
  },
  modalItemActive: {
    backgroundColor: Colors.primary + '15',
  },
  modalItemText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
  },
  modalItemTextActive: {
    color: Colors.primaryLight,
    fontWeight: Typography.weight.bold,
  },
  voiceSection: {
    marginBottom: Spacing.xl,
  },
  voiceButton: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  voiceButtonRecording: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  voiceButtonText: {
    color: Colors.primaryLight,
    fontWeight: 'bold',
    fontSize: Typography.size.sm + 1,
  },
  voiceButtonTextRecording: {
    color: Colors.error,
    fontWeight: 'bold',
    fontSize: Typography.size.sm + 1,
  },
  blinkingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    marginRight: Spacing.sm,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  playButton: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Typography.size.xs + 1,
  },
  uploadSuccessText: {
    color: Colors.success,
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
    marginLeft: Spacing.md,
    flex: 1,
  },
  deleteVoiceBtn: {
    padding: Spacing.sm,
  },
  deleteVoiceText: {
    color: Colors.error,
    fontSize: 20,
  },
  videoSection: {
    marginBottom: Spacing.xl,
  },
  videoSelectButton: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSelectButtonText: {
    color: Colors.primaryLight,
    fontWeight: 'bold',
    fontSize: Typography.size.sm + 1,
  },
  videoUploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  videoUploadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginLeft: Spacing.sm,
  },
  videoPreviewCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.sm,
  },
  videoPreviewPlayer: {
    width: '100%',
    height: 180,
    borderRadius: Radii.sm,
    backgroundColor: '#000000',
  },
  videoPreviewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  videoNameText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xs + 1,
    flex: 1,
    marginRight: Spacing.sm,
  },
  deleteVideoBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  deleteVideoText: {
    color: Colors.error,
    fontSize: Typography.size.xs + 1,
    fontWeight: 'bold',
  },
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  topBackText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginLeft: Spacing.xs,
  },
});
