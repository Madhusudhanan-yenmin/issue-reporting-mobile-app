import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchIssues } from '../../store/slices/issueSlice';
import { IssueCard } from '../../components/IssueCard';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Typography, Spacing } from '../../theme';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AdminTabParamList, RootStackParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'AdminDashboard'>,
  StackScreenProps<RootStackParamList>
>;

const CATEGORIES = ['ALL', 'ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE', 'OTHER'];
const STATUSES = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED'];

export const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { issues, loading } = useAppSelector((state) => state.issue);
  const { user } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    (isRefresh = false) => {
      const filters: any = {
        page: 1,
        limit: 50,
      };
      if (search) filters.search = search;
      if (selectedCategory !== 'ALL') filters.category = selectedCategory;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;

      if (isRefresh) setRefreshing(true);
      dispatch(fetchIssues(filters)).finally(() => {
        if (isRefresh) setRefreshing(false);
      });
    },
    [dispatch, search, selectedCategory, selectedStatus]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Admin,</Text>
          <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateOfficer')}
        >
          <Text style={styles.createButtonText}>+ Create Officer</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Ticket ID, Title, Description..."
          placeholderTextColor={Colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.categoryScrollOuter}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterTag,
                selectedCategory === cat && styles.filterTagActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterTagText,
                  selectedCategory === cat && styles.filterTagTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.statusScrollOuter}
        >
          {STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTag,
                selectedStatus === status && styles.filterTagActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterTagText,
                  selectedStatus === status && styles.filterTagTextActive,
                ]}
              >
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Issues List */}
      {loading && !refreshing ? (
        <LoadingIndicator message="Loading complaints..." />
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <IssueCard
              issue={item}
              onPress={() => navigation.navigate('IssueDetails', { issueId: item._id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Grievances Found"
              description="No user complaints match the chosen filters."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm + 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: Typography.size.base,
  },
  filtersWrapper: {
    marginBottom: Spacing.sm,
  },
  categoryScrollOuter: {
    marginBottom: Spacing.xs,
  },
  statusScrollOuter: {
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterTagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs + 1,
    fontWeight: Typography.weight.bold,
  },
  filterTagTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
