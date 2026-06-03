import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  
  // Resolution Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImages, setResolutionImages] = useState<string[]>([]);
  const [uploadingResImage, setUploadingResImage] = useState(false);

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
      } else {
        Alert.alert('Error', (action.payload as string) || 'Failed to post comment');
      }
    });
  };

  const handleAssignOfficer = (officerId: string) => {
    dispatch(assignOfficer({ id: issueId, officerId })).then((action) => {
      if (assignOfficer.fulfilled.match(action)) {
        setAssignModalVisible(false);
        dispatch(fetchActivities(issueId));
        Alert.alert('Success', 'Officer assigned successfully!');
      } else {
        Alert.alert('Error', (action.payload as string) || 'Failed to assign officer');
      }
    });
  };

  const handleUpdatePriority = (priority: string) => {
    dispatch(updatePriority({ id: issueId, priority })).then((action) => {
      if (updatePriority.fulfilled.match(action)) {
        setPriorityModalVisible(false);
        dispatch(fetchActivities(issueId));
        Alert.alert('Success', 'Priority updated successfully!');
      } else {
        Alert.alert('Error', (action.payload as string) || 'Failed to update priority');
      }
    });
  };

  const handleStartWork = () => {
    dispatch(updateStatus({ id: issueId, status: 'IN_PROGRESS' })).then((action) => {
      if (updateStatus.fulfilled.match(action)) {
        dispatch(fetchActivities(issueId));
        Alert.alert('Success', 'Work status updated to In Progress.');
      } else {
        Alert.alert('Error', (action.payload as string) || 'Failed to start work');
      }
    });
  };

  const pickResolutionImage = async () => {
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
      uploadResImage(result.assets[0].uri);
    }
  };

  const uploadResImage = async (uri: string) => {
    try {
      setUploadingResImage(true);
      const filename = uri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);

      const response = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResolutionImages((prev) => [...prev, response.data.url]);
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
        Alert.alert('Success', 'Issue resolved successfully!');
      } else {
        Alert.alert('Error', (action.payload as string) || 'Failed to resolve issue');
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
        Alert.alert('Success', 'Issue has been reopened.');
      } else {
        Alert.alert('Error', (action.payload as string) || 'Failed to reopen issue');
      }
    });
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
      <ScrollView contentContainerStyle={styles.container}>
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
              <Text style={styles.value} numberOfLines={2}>
                {selectedIssue.location}
              </Text>
            </View>
          </View>

          {/* Officer Details */}
          <View style={styles.officerRow}>
            <Text style={styles.label}>Assigned Officer: </Text>
            <Text style={styles.officerName}>
              {selectedIssue.officerId?.name || 'Unassigned'}
            </Text>
          </View>

          {/* Render Action Buttons based on status & role */}
          <View style={styles.actionsContainer}>
            {user?.role === 'ADMIN' && (
              <View style={styles.adminActionRow}>
                <CustomButton
                  title="Assign Officer"
                  onPress={() => setAssignModalVisible(true)}
                  variant="outline"
                  size="small"
                  style={styles.actionBtn}
                />
                <CustomButton
                  title="Set Priority"
                  onPress={() => setPriorityModalVisible(true)}
                  variant="outline"
                  size="small"
                  style={styles.actionBtn}
                />
              </View>
            )}

            {selectedIssue.status === 'ASSIGNED' && (isAssignedOfficer || user?.role === 'ADMIN') && (
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
                <CustomButton
                  title="Close & Feedback"
                  onPress={handleCloseIssue}
                  variant="success"
                  size="small"
                  style={styles.actionBtn}
                />
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
                <Image key={idx} source={{ uri: img }} style={styles.issueImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Resolution Details */}
        {selectedIssue.resolutionNotes && (
          <View style={[styles.sectionCard, { borderColor: Colors.success + '50' }]}>
            <Text style={[styles.sectionTitle, { color: Colors.success }]}>Resolution Details</Text>
            <Text style={styles.description}>{selectedIssue.resolutionNotes}</Text>
            {selectedIssue.resolutionImages && selectedIssue.resolutionImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {selectedIssue.resolutionImages.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.issueImage} />
                ))}
              </ScrollView>
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
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handlePostComment}>
              <Text style={styles.sendBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODALS */}

      {/* Assign Officer Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Officer</Text>
            <ScrollView style={styles.modalScroll}>
              {officers.length === 0 ? (
                <Text style={styles.emptyText}>No officers available.</Text>
              ) : (
                officers.map((officer) => (
                  <TouchableOpacity
                    key={officer._id}
                    style={styles.modalItem}
                    onPress={() => handleAssignOfficer(officer._id)}
                  >
                    <Text style={styles.modalItemText}>{officer.name}</Text>
                    <Text style={styles.modalItemSubText}>{officer.email}</Text>
                  </TouchableOpacity>
                ))
              )}
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
              style={[styles.commentInput, styles.resNotesInput]}
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
                  onPress={pickResolutionImage}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginRight: Spacing.sm,
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
});
