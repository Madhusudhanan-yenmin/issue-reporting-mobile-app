import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { submitFeedback, clearFeedback } from '../../store/slices/feedbackSlice';
import { updateStatus, fetchIssues } from '../../store/slices/issueSlice';
import { showToast } from '../../store/slices/uiSlice';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Feedback'>;

export const FeedbackScreen: React.FC<Props> = ({ route, navigation }) => {
  const { issueId } = route.params;
  const dispatch = useAppDispatch();
  const { loading, submitted, error } = useAppSelector((state) => state.feedback);
  const { selectedIssue } = useAppSelector((state) => state.issue);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    dispatch(clearFeedback());
  }, [dispatch]);

  const handleSubmit = () => {
    const submitFeedbackAction = () => {
      dispatch(submitFeedback({ issueId, rating, comment: comment.trim() })).then(
        (feedbackAction) => {
          if (submitFeedback.fulfilled.match(feedbackAction)) {
            dispatch(fetchIssues()); // Refresh issues list
            dispatch(showToast({ message: 'Your feedback has been submitted, and the issue is officially closed.', type: 'success' }));
            navigation.navigate('UserHome');
          } else {
            dispatch(showToast({ message: (feedbackAction.payload as string) || 'Failed to submit rating', type: 'error' }));
          }
        }
      );
    };

    if (selectedIssue?.status === 'CLOSED') {
      // If the issue is already CLOSED, skip status update and directly submit feedback
      submitFeedbackAction();
    } else {
      // First, close the issue
      dispatch(updateStatus({ id: issueId, status: 'CLOSED' })).then((action) => {
        if (updateStatus.fulfilled.match(action)) {
          submitFeedbackAction();
        } else {
          dispatch(showToast({ message: (action.payload as string) || 'Failed to close the issue', type: 'error' }));
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Grievance Resolution Feedback</Text>
        <Text style={styles.subtitle}>
          How satisfied are you with the resolution of this issue?
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Star Rating Select */}
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={styles.starTouch}
              onPress={() => setRating(star)}
            >
              <Text
                style={[
                  styles.starText,
                  { color: star <= rating ? Colors.warning : Colors.textMuted },
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 1 && 'Very Dissatisfied'}
          {rating === 2 && 'Dissatisfied'}
          {rating === 3 && 'Neutral'}
          {rating === 4 && 'Satisfied'}
          {rating === 5 && 'Highly Satisfied'}
        </Text>

        <View style={styles.commentContainer}>
          <Text style={styles.label}>Remarks / Suggestions (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us what went well or how we can improve..."
            placeholderTextColor={Colors.placeholder}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
        </View>

        <CustomButton
          title="Submit Feedback & Close Ticket"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  starTouch: {
    paddingHorizontal: Spacing.sm,
  },
  starText: {
    fontSize: 48,
  },
  ratingLabel: {
    color: Colors.warning,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  commentContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  textArea: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: Typography.size.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
