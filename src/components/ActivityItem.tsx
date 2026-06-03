import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { Activity } from '../store/slices/issueSlice';

interface ActivityItemProps {
  activity: Activity;
  isLast?: boolean;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isLast = false,
}) => {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getActionStyles = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('filed')) {
      return { dotColor: Colors.primary, bgColor: Colors.primary + '15' };
    }
    if (actionLower.includes('assign')) {
      return { dotColor: Colors.statusAssigned, bgColor: Colors.statusAssigned + '15' };
    }
    if (actionLower.includes('progress') || actionLower.includes('start')) {
      return { dotColor: Colors.statusInProgress, bgColor: Colors.statusInProgress + '15' };
    }
    if (actionLower.includes('resolve')) {
      return { dotColor: Colors.statusResolved, bgColor: Colors.statusResolved + '15' };
    }
    if (actionLower.includes('reopen')) {
      return { dotColor: Colors.statusReopened, bgColor: Colors.statusReopened + '15' };
    }
    if (actionLower.includes('close')) {
      return { dotColor: Colors.statusClosed, bgColor: Colors.statusClosed + '15' };
    }
    return { dotColor: Colors.textSecondary, bgColor: Colors.surfaceElevated };
  };

  const { dotColor, bgColor } = getActionStyles(activity.action);

  return (
    <View style={styles.container}>
      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={[styles.contentCard, { backgroundColor: bgColor }]}>
        <Text style={styles.actionText}>{activity.action}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.userText}>
            By {activity.performedBy?.name || 'System'}{' '}
            <Text style={styles.roleText}>
              ({activity.performedBy?.role || 'SYSTEM'})
            </Text>
          </Text>
          <Text style={styles.timeText}>{formatTime(activity.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  timelineCol: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.surfaceBorder,
    marginTop: 2,
    marginBottom: -10, // overlap with the next item slightly to avoid breaks
  },
  contentCard: {
    flex: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder + '50',
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.medium,
    lineHeight: Typography.lineHeight.normal * Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  userText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
  },
  roleText: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs - 1,
    fontWeight: Typography.weight.bold,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
  },
});
