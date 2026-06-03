import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme';
import { Issue } from '../store/slices/issueSlice';

interface IssueCardProps {
  issue: Issue;
  onPress: () => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onPress }) => {
  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'OPEN':
        return Colors.statusOpen;
      case 'ASSIGNED':
        return Colors.statusAssigned;
      case 'IN_PROGRESS':
        return Colors.statusInProgress;
      case 'RESOLVED':
        return Colors.statusResolved;
      case 'REOPENED':
        return Colors.statusReopened;
      case 'CLOSED':
        return Colors.statusClosed;
      default:
        return Colors.textMuted;
    }
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'LOW':
        return Colors.priorityLow;
      case 'MEDIUM':
        return Colors.priorityMedium;
      case 'HIGH':
        return Colors.priorityHigh;
      case 'CRITICAL':
        return Colors.priorityCritical;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const hasImage = issue.images && issue.images.length > 0;
  const thumbnail = hasImage ? issue.images[0] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            <Text style={styles.ticketId}>{issue.ticketId}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: getStatusColor(issue.status) + '20' },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: getStatusColor(issue.status) }]}
              >
                {issue.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {issue.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {issue.description}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.metadataTag}>
              <Text style={styles.metadataText}>{issue.category}</Text>
            </View>
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor(issue.priority) },
              ]}
            />
            <Text style={styles.priorityText}>{issue.priority}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.dateText}>{formatDate(issue.createdAt)}</Text>
          </View>
        </View>

        {thumbnail && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  contentRow: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ticketId: {
    color: Colors.primaryLight,
    fontSize: Typography.size.xs + 1,
    fontWeight: Typography.weight.bold,
    marginRight: Spacing.sm,
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
    fontSize: Typography.size.base + 1,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataTag: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    marginRight: Spacing.md,
  },
  metadataText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
  },
  dotSeparator: {
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
    fontSize: Typography.size.xs,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    marginLeft: Spacing.sm,
    alignSelf: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
