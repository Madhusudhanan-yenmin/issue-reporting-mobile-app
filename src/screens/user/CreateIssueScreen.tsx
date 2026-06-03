import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store';
import { createIssue } from '../../store/slices/issueSlice';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { UserTabParamList, RootStackParamList } from '../../navigation/types';
import api from '../../services/api';

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
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
  }>({});

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
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const pickImage = async () => {
    // Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadSelectedImage(result.assets[0].uri);
    }
  };

  const uploadSelectedImage = async (uri: string) => {
    try {
      setUploadingImage(true);
      const filename = uri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

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

      const imageUrl = response.data.url;
      setImages((prev) => [...prev, imageUrl]);
    } catch (err: any) {
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      title,
      description,
      category,
      priority,
      location,
      images,
    };

    const resultAction = await dispatch(createIssue(payload));
    if (createIssue.fulfilled.match(resultAction)) {
      Alert.alert('Success', 'Your issue has been filed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setLocation('');
            setImages([]);
            navigation.navigate('UserDashboard');
          },
        },
      ]);
    } else {
      Alert.alert('Error', (resultAction.payload as string) || 'Failed to file issue');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.screenTitle}>File an Issue</Text>
          <Text style={styles.screenSubtitle}>Provide details about the civic grievance</Text>

          <CustomInput
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

          <CustomInput
            label="Location/Address"
            placeholder="E.g., Near Block B Metro Station, Street 4"
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              if (errors.location) setErrors({ ...errors, location: undefined });
            }}
            error={errors.location}
          />

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
                  onPress={pickImage}
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

          <CustomButton
            title="File Complaint"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
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
});
