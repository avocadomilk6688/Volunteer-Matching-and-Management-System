import { Routes, Route } from 'react-router';
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"
import { VolunteerHomePage } from './pages/VolunteerHomePage';
import { ProgrammeDetailsPage } from './pages/ProgrammeDetailsPage';
import { AuthProvider } from './context/auth/AuthProvider';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { QAPage } from './pages/QAPage';
import { VolunteeringHistoryPage } from './pages/VolunteeringHistoryPage';
import { ManageProfilePage } from './pages/ManageProfilePage';
import { ManageListingPage } from './pages/ManageListingPage';
import { ManageVolunteerApplicationPage } from './pages/ManageVolunteerApplicationPage';
import { ManageUserAccountPage } from './pages/ManageUserAccountPage';
import { VerifyOrganizationRegistrationPage } from './pages/VerifyOrganizationRegistrationPage';
import { AdminManageListingPage } from './pages/AdminManageListingPage';
import { AdminManageQAPage } from './pages/AdminManageQAPage';
import { AdminManageTicketsPage } from './pages/AdminManageTicketsPage';
import { OrganizationVerificationPage } from './pages/OrganizationVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { ProtectedRoute } from './context/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="login" index element={<LoginPage />}></Route>
        <Route path="sign-up" element={<SignUpPage />}></Route>
        
        {/* Volunteer Routes */}
        <Route path="volunteer-home" element={<ProtectedRoute allowedRoles={['volunteer']}><VolunteerHomePage /></ProtectedRoute>} />
        <Route path="programme-details/:id" element={<ProtectedRoute allowedRoles={['volunteer']}><ProgrammeDetailsPage /></ProtectedRoute>} />
        <Route path="leaderboard" element={<ProtectedRoute allowedRoles={['volunteer']}><LeaderboardPage /></ProtectedRoute>} />
        <Route path="volunteering-history" element={<ProtectedRoute allowedRoles={['volunteer']}><VolunteeringHistoryPage /></ProtectedRoute>} />
        
        {/* Organization Routes */}
        <Route path="manage-listing" element={<ProtectedRoute allowedRoles={['organization']}><ManageListingPage /></ProtectedRoute>} />
        <Route path="manage-applications" element={<ProtectedRoute allowedRoles={['organization']}><ManageVolunteerApplicationPage /></ProtectedRoute>} />
        <Route path="organization-verification" element={<ProtectedRoute allowedRoles={['organization']}><OrganizationVerificationPage /></ProtectedRoute>} />
        <Route path="pending-approval" element={<ProtectedRoute allowedRoles={['organization']}><PendingApprovalPage /></ProtectedRoute>} />

        {/* Shared Routes */}
        <Route path="qa" element={<ProtectedRoute allowedRoles={['volunteer', 'organization']}><QAPage /></ProtectedRoute>} />
        <Route path="manage-profile" element={<ProtectedRoute allowedRoles={['volunteer', 'organization']}><ManageProfilePage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="manage-user-account" element={<ProtectedRoute allowedRoles={['admin']}><ManageUserAccountPage /></ProtectedRoute>} />
        <Route path="verify-organization-registration" element={<ProtectedRoute allowedRoles={['admin']}><VerifyOrganizationRegistrationPage /></ProtectedRoute>} />
        <Route path="admin-manage-listing" element={<ProtectedRoute allowedRoles={['admin']}><AdminManageListingPage /></ProtectedRoute>} />
        <Route path="manage-qa" element={<ProtectedRoute allowedRoles={['admin']}><AdminManageQAPage /></ProtectedRoute>} />
        <Route path="manage-tickets" element={<ProtectedRoute allowedRoles={['admin']}><AdminManageTicketsPage /></ProtectedRoute>} />
        
        {/* Public Utility Routes */}
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
