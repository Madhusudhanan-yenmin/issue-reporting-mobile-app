export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
};

export type UserTabParamList = {
  UserDashboard: undefined;
  CreateIssue: undefined;
  UserProfile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  CreateOfficer: undefined;
  AdminProfile: undefined;
};

export type OfficerTabParamList = {
  OfficerDashboard: undefined;
  OfficerProfile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  UserHome: undefined;
  AdminHome: undefined;
  OfficerHome: undefined;
  IssueDetails: { issueId: string };
  Feedback: { issueId: string };
};
