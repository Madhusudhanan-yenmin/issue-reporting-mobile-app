import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchIssueById,
  fetchActivities,
  assignOfficer,
  updatePriority,
  updateStatus,
  clearSelectedIssue,
} from '../../store/slices/issueSlice';
import { fetchComments, postComment, clearComments } from '../../store/slices/commentSlice';
import { showToast } from '../../store/slices/uiSlice';
import { ActivityItem } from '../../components/ActivityItem';
import { CommentItem } from '../../components/CommentItem';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import api from '../../services/api';

type Props = StackScreenProps<RootStackParamList, 'IssueDetails'>;

export const IssueDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { issueId } = route.params;
  const dispatch = useAppDispatch();
  
  const { selectedIssue, activities, loading: issueLoading } = useAppSelector((state) => state.issue);
  const { comments, loading: commentsLoading } = useAppSelector((state) => state.comment);
  const { user } = useAppSelector((state) => state.auth);

  // Local UI State
  const [commentText, setCommentText] = useState('');
  const [officers, setOfficers] = useState<any[]>([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Resolution Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImages, setResolutionImages] = useState<string[]>([]);
  const [uploadingResImage, setUploadingResImage] = useState(false);

  // Image Preview Lightbox State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Voice Playback State
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<any>({
    positionMillis: 0,
    durationMillis: 0,
  });
  const [loadingAudio, setLoadingAudio] = useState(false);

  useEffect(() => {
    return () => {
      if (playbackSound) {
        playbackSound.unloadAsync();
      }
    };
  }, [playbackSound]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (Platform.OS === 'android') {
          // Provide 50px buffer to clear the keyboard layout safely
          setKeyboardHeight(e.endCoordinates.height + 50);
        }
        if (isCommentInputFocused) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        if (Platform.OS === 'android') {
          setKeyboardHeight(0);
        }
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [isCommentInputFocused]);

  const loadData = useCallback(() => {
    dispatch(fetchIssueById(issueId));
    dispatch(fetchActivities(issueId));
    dispatch(fetchComments(issueId));
  }, [dispatch, issueId]);

  useEffect(() => {
    loadData();
    return () => {
      dispatch(clearSelectedIssue());
      dispatch(clearComments());
    };
  }, [loadData, dispatch]);

  // Fetch officers list if Admin
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/users/officers')
        .then((res) => setOfficers(res.data))
        .catch(() => {});
    }
  }, [user]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    dispatch(postComment({ issueId, text: commentText.trim() })).then((action) => {
      if (postComment.fulfilled.match(action)) {
        setCommentText('');
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        dispatch(showToast({ message: (action.payload as string) || 'Failed to post comment', type: 'error' }));
      }
    });
  };

  const handleAssignOfficer = (officerId: string) => {
    dispatch(assignOfficer({ id: issueId, officerId })).then((action) => {
      if (assignOfficer.fulfilled.match(action)) {
        setAssignModalVisible(false);
        dispatch(fetchActivities(issueId));
        dispatch(showToast({ message: 'Officer assigned successfully!', type: 'success' }));
      } else {
        dispatch(showToast({ message: (action.payload as string) || 'Failed to assign officer', type: 'error' }));
      }
    });
  };

  const handleUpdatePriority = (priority: string) => {
    dispatch(updatePriority({ id: issueId, priority })).then((action) => {
      if (updatePriority.fulfilled.match(action)) {
        setPriorityModalVisible(false);
        dispatch(fetchActivities(issueId));
        dispatch(showToast({ message: 'Priority updated successfully!', type: 'success' }));
      } else {
        dispatch(showToast({ message: (action.payload as string) || 'Failed to update priority', type: 'error' }));
      }
    });
  };

  const handleStartWork = () => {
    dispatch(updateStatus({ id: issueId, status: 'IN_PROGRESS' })).then((action) => {
      if (updateStatus.fulfilled.match(action)) {
        dispatch(fetchActivities(issueId));
        dispatch(showToast({ message: 'Work status updated to In Progress.', type: 'success' }));
      } else {
        dispatch(showToast({ message: (action.payload as string) || 'Failed to start work', type: 'error' }));
      }
    });
  };

  const pickResolutionImage = async (skipCrop = false) => {
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
      uploadResImage(asset.uri, asset.fileName || undefined, asset.mimeType || undefined);
    }
  };

  const takeResolutionPhoto = async (skipCrop = false) => {
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
      uploadResImage(asset.uri, asset.fileName || undefined, asset.mimeType || undefined);
    }
  };

  const promptResolutionCropOption = (onSelect: (skipCrop: boolean) => void) => {
    Alert.alert(
      'Crop Option',
      'Do you want to crop the resolution photo or skip cropping?',
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

  const handleResolutionImageAttachment = () => {
    Alert.alert(
      'Attach Resolution Photo',
      'Select the source for your resolution proof photo:',
      [
        {
          text: 'Take Photo 📸',
          onPress: () => promptResolutionCropOption((skipCrop) => takeResolutionPhoto(skipCrop)),
        },
        {
          text: 'Choose from Gallery 🖼️',
          onPress: () => promptResolutionCropOption((skipCrop) => pickResolutionImage(skipCrop)),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadResImage = async (uri: string, assetName?: string, assetType?: string) => {
    try {
      setUploadingResImage(true);
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
      formData.append('file', { uri, name: filename, type } as any);

      const response = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = response.data.secure_url;
      if (imageUrl) {
        setResolutionImages((prev) => [...prev, imageUrl]);
      } else {
        throw new Error('Image URL not returned by server');
      }
    } catch {
      Alert.alert('Upload Failed', 'Failed to upload resolution image.');
    } finally {
      setUploadingResImage(false);
    }
  };

  const handleResolveIssue = () => {
    if (!resolutionNotes.trim()) {
      Alert.alert('Error', 'Resolution notes are required.');
      return;
    }

    dispatch(
      updateStatus({
        id: issueId,
        status: 'RESOLVED',
        resolutionNotes: resolutionNotes.trim(),
        resolutionImages,
      })
    ).then((action) => {
      if (updateStatus.fulfilled.match(action)) {
        setResolveModalVisible(false);
        setResolutionNotes('');
        setResolutionImages([]);
        dispatch(fetchActivities(issueId));
        dispatch(showToast({ message: 'Issue resolved successfully!', type: 'success' }));
      } else {
        dispatch(showToast({ message: (action.payload as string) || 'Failed to resolve issue', type: 'error' }));
      }
    });
  };

  const handleCloseIssue = () => {
    navigation.navigate('Feedback', { issueId });
  };

  const handleReopenIssue = () => {
    dispatch(updateStatus({ id: issueId, status: 'REOPENED' })).then((action) => {
      if (updateStatus.fulfilled.match(action)) {
        dispatch(fetchActivities(issueId));
        dispatch(showToast({ message: 'Issue has been reopened.', type: 'success' }));
      } else {
        dispatch(showToast({ message: (action.payload as string) || 'Failed to reopen issue', type: 'error' }));
      }
    });
  };

  const openLocationInMap = (locationStr: string) => {
    if (!locationStr) return;
    const coordsRegex = /^([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/;
    const match = locationStr.match(coordsRegex);

    if (match) {
      const lat = match[1];
      const lng = match[2];

      const scheme = Platform.select({
        ios: `maps://0,0?q=${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });

      Linking.openURL(scheme).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    } else {
      const encodedAddress = encodeURIComponent(locationStr);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    }
  };

  const handlePlayVoice = async () => {
    if (!selectedIssue?.voiceUrl) return;
    try {
      if (isPlayingAudio && playbackSound) {
        await playbackSound.pauseAsync();
        setIsPlayingAudio(false);
        return;
      }

      if (playbackSound) {
        await playbackSound.playAsync();
        setIsPlayingAudio(true);
        return;
      }

      setLoadingAudio(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: selectedIssue.voiceUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackStatus({
              positionMillis: status.positionMillis,
              durationMillis: status.durationMillis || 0,
            });
            if (status.didJustFinish) {
              setIsPlayingAudio(false);
              newSound.stopAsync();
            }
          }
        }
      );
      setPlaybackSound(newSound);
      setIsPlayingAudio(true);
    } catch (err: any) {
      Alert.alert('Playback Error', 'Failed to play the voice message.');
    } finally {
      setLoadingAudio(false);
    }
  };

  const formatAudioTime = (millis: number) => {
    if (!millis) return '0:00';
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (issueLoading && !selectedIssue) {
    return <LoadingIndicator message="Loading issue details..." fullScreen />;
  }

  if (!selectedIssue) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Issue details could not be found.</Text>
      </SafeAreaView>
    );
  }

  const isCreator = user?._id === selectedIssue.userId?._id || user?._id === selectedIssue.userId;
  const isAssignedOfficer = user?._id === selectedIssue.officerId?._id || user?._id === selectedIssue.officerId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Ticket Title & ID */}
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <Text style={styles.ticketId}>{selectedIssue.ticketId}</Text>
            <View style={[styles.badge, { backgroundColor: Colors.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: Colors.primaryLight }]}>
                {selectedIssue.category}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{selectedIssue.title}</Text>
          <Text style={styles.description}>{selectedIssue.description}</Text>

          {/* Voice Player */}
          {selectedIssue.voiceUrl ? (
            <View style={styles.voicePlayerCard}>
              <TouchableOpacity
                style={styles.voicePlayIconBtn}
                onPress={handlePlayVoice}
                disabled={loadingAudio}
              >
                {loadingAudio ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.voicePlayIconText}>
                    {isPlayingAudio ? '⏸' : '▶'}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.voiceProgressInfo}>
                <Text style={styles.voicePlayerTitle}>Voice Description Note</Text>
                <Text style={styles.voiceTimeText}>
                  {formatAudioTime(playbackStatus.positionMillis)} / {formatAudioTime(playbackStatus.durationMillis)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Details Row */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, { color: Colors.primaryLight }]}>
                {selectedIssue.status.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.label}>Priority</Text>
              <Text style={styles.value}>{selectedIssue.priority}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity onPress={() => openLocationInMap(selectedIssue.location)} activeOpacity={0.7}>
                <Text style={styles.locationValueLink} numberOfLines={3}>
                  📍 {selectedIssue.location}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Officer Details */}
          <View style={styles.officerRow}>
            <Text style={styles.label}>
              {selectedIssue.status === 'REOPENED' ? 'Last assigned Office: ' : 'Assigned Officer: '}
            </Text>
            <Text style={styles.officerName}>
              {selectedIssue.officerId?.name || 'Unassigned'}
            </Text>
          </View>

          {/* Render Action Buttons based on status & role */}
          <View style={styles.actionsContainer}>
            {user?.role === 'ADMIN' && selectedIssue.status !== 'CLOSED' && (
              <View style={styles.adminActionRow}>
                <CustomButton
                  title="Set Priority"
                  onPress={() => setPriorityModalVisible(true)}
                  variant="outline"
                  size="small"
                  style={styles.actionBtn}
                />
              </View>
            )}

            {(selectedIssue.status === 'ASSIGNED' || selectedIssue.status === 'REOPENED') && (isAssignedOfficer || user?.role === 'ADMIN') && (
              <CustomButton
                title="Start Work"
                onPress={handleStartWork}
                variant="success"
                style={styles.fullWidthAction}
              />
            )}

            {selectedIssue.status === 'IN_PROGRESS' && (isAssignedOfficer || user?.role === 'ADMIN') && (
              <CustomButton
                title="Resolve Issue"
                onPress={() => setResolveModalVisible(true)}
                variant="success"
                style={styles.fullWidthAction}
              />
            )}

            {selectedIssue.status === 'RESOLVED' && (isCreator || user?.role === 'ADMIN') && (
              <View style={styles.adminActionRow}>
                {isCreator && (
                  <CustomButton
                    title="Close & Feedback"
                    onPress={handleCloseIssue}
                    variant="success"
                    size="small"
                    style={styles.actionBtn}
                  />
                )}
                <CustomButton
                  title="Reopen Issue"
                  onPress={handleReopenIssue}
                  variant="danger"
                  size="small"
                  style={styles.actionBtn}
                />
              </View>
            )}
          </View>
        </View>

        {/* Issue Images */}
        {selectedIssue.images && selectedIssue.images.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Grievance Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {selectedIssue.images.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => setPreviewImage(img)} activeOpacity={0.8} style={styles.imageContainer}>
                  <Image source={{ uri: img }} style={styles.issueImage} />
                  <View style={styles.eyeIconOverlay}>
                    <Text style={styles.eyeIconText}>👁</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Grievance Video */}
        {selectedIssue.videoUrl ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Grievance Video Note</Text>
            <Video
              source={{ uri: selectedIssue.videoUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              useNativeControls
              style={styles.detailsVideoPlayer}
            />
          </View>
        ) : null}

        {/* Resolution Details */}
        {selectedIssue.resolutionNotes && (
          <View style={[styles.sectionCard, { borderColor: Colors.success + '50' }]}>
            <Text style={[styles.sectionTitle, { color: Colors.success }]}>Resolution Details</Text>
            <Text style={styles.description}>{selectedIssue.resolutionNotes}</Text>
            {selectedIssue.resolutionImages && selectedIssue.resolutionImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {selectedIssue.resolutionImages.map((img, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setPreviewImage(img)} activeOpacity={0.8} style={styles.imageContainer}>
                    <Image source={{ uri: img }} style={styles.issueImage} />
                    <View style={styles.eyeIconOverlay}>
                      <Text style={styles.eyeIconText}>👁</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* User Feedback & Rating */}
        {selectedIssue.status === 'CLOSED' && selectedIssue.feedback && (
          <View style={[styles.sectionCard, { borderColor: Colors.warning + '50' }]}>
            <Text style={[styles.sectionTitle, { color: Colors.warning }]}>User Feedback & Rating</Text>
            <View style={styles.feedbackStarRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={[
                    styles.feedbackStarText,
                    { color: star <= selectedIssue.feedback!.rating ? Colors.warning : Colors.textMuted },
                  ]}
                >
                  ★
                </Text>
              ))}
              <Text style={styles.feedbackRatingLabel}>
                ({selectedIssue.feedback.rating} / 5)
              </Text>
            </View>
            {selectedIssue.feedback.comment ? (
              <Text style={styles.feedbackComment}>
                "{selectedIssue.feedback.comment}"
              </Text>
            ) : (
              <Text style={[styles.feedbackComment, { color: Colors.textMuted }]}>
                No written remarks submitted.
              </Text>
            )}
          </View>
        )}

        {/* Timeline Activities */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Activities Timeline</Text>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No activities logged yet.</Text>
          ) : (
            activities.map((act, idx) => (
              <ActivityItem
                key={act._id}
                activity={act}
                isLast={idx === activities.length - 1}
              />
            ))
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Discussion & Comments</Text>
          {commentsLoading && comments.length === 0 ? (
            <ActivityIndicator color={Colors.primary} />
          ) : comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet. Start the discussion!</Text>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))
          )}

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor={Colors.placeholder}
              value={commentText}
              onChangeText={setCommentText}
              onFocus={() => {
                setIsCommentInputFocused(true);
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onBlur={() => setIsCommentInputFocused(false)}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handlePostComment}>
              <Text style={styles.sendBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: keyboardHeight }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODALS */}

      {/* Assign Officer Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Officer</Text>
            <ScrollView style={styles.modalScroll}>
              {(() => {
                const issueDistrict = selectedIssue?.district || '';
                const recommendedOfficers = officers.filter(
                  (o) => issueDistrict && o.district?.toLowerCase() === issueDistrict.toLowerCase()
                );

                if (recommendedOfficers.length === 0) {
                  return (
                    <Text style={styles.emptyText}>
                      No recommended officers available in {issueDistrict || 'this'} district.
                    </Text>
                  );
                }

                return recommendedOfficers.map((officer) => (
                  <TouchableOpacity
                    key={officer._id}
                    style={[
                      styles.officerCardItem,
                      styles.recommendedOfficerCardItem,
                    ]}
                    onPress={() => handleAssignOfficer(officer._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.officerItemHeader}>
                      <Text style={styles.officerItemName}>{officer.name}</Text>
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>✨ Recommended</Text>
                      </View>
                    </View>
                    <Text style={styles.officerItemRole}>{officer.officerRole || 'Sanitation/Maintenance Officer'}</Text>
                    <Text style={styles.officerItemDistrict}>District: {officer.district || 'Not Assigned'}</Text>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
            <CustomButton
              title="Close"
              onPress={() => setAssignModalVisible(false)}
              variant="secondary"
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Priority Modal */}
      <Modal visible={priorityModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Priority</Text>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
              <TouchableOpacity
                key={level}
                style={styles.modalItem}
                onPress={() => handleUpdatePriority(level)}
              >
                <Text style={styles.modalItemText}>{level}</Text>
              </TouchableOpacity>
            ))}
            <CustomButton
              title="Close"
              onPress={() => setPriorityModalVisible(false)}
              variant="secondary"
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Resolve Issue Modal */}
      <Modal visible={resolveModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resolve Complaint</Text>
            <TextInput
              style={styles.resNotesInput}
              placeholder="Describe resolution details..."
              placeholderTextColor={Colors.placeholder}
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={4}
            />

            {/* Resolution Images */}
            <View style={styles.resImagesContainer}>
              {resolutionImages.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.resThumbnail} />
              ))}
              {resolutionImages.length < 3 && (
                <TouchableOpacity
                  style={styles.resAddBtn}
                  onPress={handleResolutionImageAttachment}
                  disabled={uploadingResImage}
                >
                  {uploadingResImage ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={styles.resAddBtnText}>+ Add Photo</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Resolve"
                onPress={handleResolveIssue}
                variant="success"
                style={styles.modalActionBtn}
              />
              <CustomButton
                title="Cancel"
                onPress={() => setResolveModalVisible(false)}
                variant="secondary"
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Lightbox Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.lightboxBackdrop}>
          <TouchableOpacity style={styles.lightboxCloseArea} activeOpacity={1} onPress={() => setPreviewImage(null)}>
            <View style={styles.lightboxContent}>
              {previewImage && (
                <Image
                  source={{ uri: previewImage }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setPreviewImage(null)}>
                <Text style={styles.lightboxCloseBtnText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    padding: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.base,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ticketId: {
    color: Colors.primaryLight,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  badgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg + 1,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    lineHeight: Typography.lineHeight.normal * Typography.size.base,
    marginBottom: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailCol: {
    flex: 1,
    minWidth: '40%',
  },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.bold,
  },
  locationValueLink: {
    color: Colors.primaryLight,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.bold,
    textDecorationLine: 'underline',
  },
  officerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  officerName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  actionsContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 40,
  },
  fullWidthAction: {
    width: '100%',
    marginTop: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  issueImage: {
    width: 140,
    height: 100,
    borderRadius: Radii.sm,
    resizeMode: 'cover',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radii.md,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.sm,
    height: 48,
  },
  commentInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    height: '100%',
  },
  sendBtn: {
    paddingHorizontal: Spacing.md,
  },
  sendBtnText: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    maxHeight: '80%',
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
  },
  modalItemText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  modalItemSubText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs + 1,
  },
  modalCloseBtn: {
    marginTop: Spacing.sm,
  },
  resNotesInput: {
    height: 100,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    textAlignVertical: 'top',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  resImagesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  resThumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
  },
  resAddBtn: {
    width: 80,
    height: 60,
    borderRadius: Radii.sm,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resAddBtnText: {
    color: Colors.primary,
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalActionBtn: {
    flex: 1,
  },
  voicePlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.md,
  },
  voicePlayIconBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  voicePlayIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  voiceProgressInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  voicePlayerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.bold,
    marginBottom: 4,
  },
  voiceTimeText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs + 1,
  },
  detailsVideoPlayer: {
    width: '100%',
    height: 220,
    borderRadius: Radii.md,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lightboxImage: {
    width: '95%',
    height: '80%',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  lightboxCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Typography.size.sm,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  eyeIconOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  eyeIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
  feedbackStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feedbackStarText: {
    fontSize: 24,
    marginRight: Spacing.xs,
  },
  feedbackRatingLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    marginLeft: Spacing.sm,
  },
  feedbackComment: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeight.normal * Typography.size.base,
    marginTop: Spacing.xs,
  },
  // Recommended Officer Item Styles
  officerCardItem: {
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: Spacing.sm,
  },
  recommendedOfficerCardItem: {
    borderColor: Colors.accent + '60',
    backgroundColor: Colors.surfaceElevated,
  },
  officerItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs - 2,
  },
  officerItemName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  recommendedBadge: {
    backgroundColor: Colors.accent + '15',
    borderColor: Colors.accent,
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  recommendedBadgeText: {
    color: Colors.accent,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  officerItemRole: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginBottom: 2,
  },
  officerItemDistrict: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs + 1,
    fontWeight: Typography.weight.bold,
  },
});
