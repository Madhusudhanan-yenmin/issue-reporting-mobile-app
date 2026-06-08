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

export const CreateIssueScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.issue);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ROAD');
  const [priority, setPriority] = useState('LOW');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    customCategory?: string;
  }>({});

  // Map Selector State
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.971592, // Default Chennai/Sholinganallur coordinates
    longitude: 80.243491,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude: 12.971592,
    longitude: 80.243491,
  });
  const [mapAddressPreview, setMapAddressPreview] = useState('');
  const [resolvingMapAddress, setResolvingMapAddress] = useState(false);
  const mapRef = useRef<MapView | null>(null);

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
      setLocation('');
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
    if (!location.trim()) {
      tempErrors.location = 'Location detail is required';
    }
    if (category === 'OTHER' && !customCategory.trim()) {
      tempErrors.customCategory = 'Please specify the category';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const resolveAddressForCoords = async (coords: { latitude: number; longitude: number }) => {
    try {
      setResolvingMapAddress(true);
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (addressResult && addressResult.length > 0) {
        const addr = addressResult[0];
        const namePart = addr.name && addr.name !== addr.streetNumber ? addr.name : '';
        const addressParts = [
          namePart,
          addr.streetNumber,
          addr.street,
          addr.district,
          addr.subregion,
          addr.city,
          addr.region,
          addr.postalCode,
        ].filter((val): val is string => !!val);

        // Deduplicate address parts case-insensitively
        const uniqueParts: string[] = [];
        addressParts.forEach((part) => {
          const trimmed = part.trim();
          if (trimmed && !uniqueParts.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
            uniqueParts.push(trimmed);
          }
        });

        const formattedAddress = uniqueParts.join(', ');
        setMapAddressPreview(formattedAddress || 'Unknown location');
      } else {
        setMapAddressPreview('Unknown location');
      }
    } catch {
      setMapAddressPreview('Failed to resolve address');
    } finally {
      setResolvingMapAddress(false);
    }
  };

  const getCurrentLocation = async () => {
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
      const coords = { latitude, longitude };

      setMarkerCoordinate(coords);
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);

      await resolveAddressForCoords(coords);
      setMapModalVisible(true);

      // Smoothly focus/animate once the modal renders the MapView
      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }, 300);
    } catch (err: any) {
      Alert.alert('Location Error', 'Failed to retrieve your current location. Opening map fallback...');
      setMapModalVisible(true);
    } finally {
      setFetchingLocation(false);
    }
  };

  const recenterToCurrentLocation = async () => {
    try {
      setResolvingMapAddress(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location is required!');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = locationData.coords;
      const coords = { latitude, longitude };

      setMarkerCoordinate(coords);
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      mapRef.current?.animateToRegion(newRegion, 800);
      await resolveAddressForCoords(coords);
    } catch (err: any) {
      Alert.alert('Location Error', 'Failed to get current GPS location. Please check if location services are enabled.');
    } finally {
      setResolvingMapAddress(false);
    }
  };

  const handleConfirmLocation = () => {
    const lat = markerCoordinate.latitude.toFixed(6);
    const lng = markerCoordinate.longitude.toFixed(6);
    
    let locationStr = `${lat}, ${lng}`;
    if (
      mapAddressPreview && 
      mapAddressPreview !== 'Unknown location' && 
      mapAddressPreview !== 'Failed to resolve address'
    ) {
      locationStr += ` (${mapAddressPreview})`;
    }
    
    setLocation(locationStr);
    setMapModalVisible(false);
    if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
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
      location,
      images,
      voiceUrl: voiceUrl || undefined,
      videoUrl: videoUrl || undefined,
    };

    const resultAction = await dispatch(createIssue(payload));
    if (createIssue.fulfilled.match(resultAction)) {
      dispatch(showToast({ message: 'Your issue has been filed successfully!', type: 'success' }));
      setTitle('');
      setDescription('');
      setLocation('');
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

          {/* Location/Address Selection */}
          <View style={styles.locationContainer}>
            <View style={styles.locationHeaderRow}>
              <Text style={styles.locationLabel}>Location/Address</Text>
              <TouchableOpacity onPress={getCurrentLocation} disabled={fetchingLocation}>
                <Text style={styles.locationLink}>
                  {fetchingLocation ? 'Fetching...' : '📍 Select on Map'}
                </Text>
              </TouchableOpacity>
            </View>
            <CustomInput
              placeholder="E.g., Near Block B Metro Station, Street 4"
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (errors.location) setErrors({ ...errors, location: undefined });
              }}
              error={errors.location}
            />
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

      {/* Map Selector Modal */}
      <Modal visible={mapModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.mapCloseButton}>
              <Text style={styles.mapCloseButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>Select Location</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}
              onRegionChangeComplete={(region) => {
                const coords = { latitude: region.latitude, longitude: region.longitude };
                setMarkerCoordinate(coords);
                resolveAddressForCoords(coords);
              }}
            />
            {/* Static Central Pin (Crosshair Style) */}
            <View style={styles.markerFixed} pointerEvents="none">
              <Text style={{ fontSize: 40 }}>📍</Text>
            </View>

            {/* Recenter Button */}
            <TouchableOpacity
              style={styles.recenterButton}
              onPress={recenterToCurrentLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.recenterButtonText}>⌖</Text>
            </TouchableOpacity>
          </View>

          {/* Address Preview Panel */}
          <View style={styles.addressPanel}>
            <Text style={styles.addressPanelLabel}>PINNED LOCATION DETAILS</Text>
            <Text style={styles.coordinatesText}>
              Latitude: {markerCoordinate.latitude.toFixed(6)} | Longitude: {markerCoordinate.longitude.toFixed(6)}
            </Text>
            <View style={styles.addressPreviewContainer}>
              {resolvingMapAddress ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.addressPreviewText}>{mapAddressPreview || 'Resolving address...'}</Text>
              )}
            </View>
            <CustomButton
              title="Confirm Location Pin"
              onPress={handleConfirmLocation}
              style={styles.confirmPinButton}
            />
          </View>
        </SafeAreaView>
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
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  locationLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  locationLink: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  mapHeaderTitle: {
    fontSize: Typography.size.base + 2,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  mapCloseButton: {
    paddingVertical: Spacing.xs,
  },
  mapCloseButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenterButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.md,
  },
  recenterButtonText: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 30,
    textAlign: 'center',
  },
  addressPanel: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Shadows.lg,
  },
  addressPanelLabel: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  coordinatesText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs + 1,
    marginBottom: Spacing.md,
  },
  addressPreviewContainer: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  addressPreviewText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    lineHeight: Typography.lineHeight.normal * Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  confirmPinButton: {
    width: '100%',
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
