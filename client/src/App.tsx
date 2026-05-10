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

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="login" index element={<LoginPage />}></Route>
        <Route path="sign-up" element={<SignUpPage />}></Route>
        <Route path="volunteer-home" element={<VolunteerHomePage />}></Route>
        <Route path="programme-details/:id" element={<ProgrammeDetailsPage />}></Route>
        <Route path="leaderboard" element={<LeaderboardPage />}></Route>
        <Route path="qa" element={<QAPage />}></Route>
        <Route path="volunteering-history" element={<VolunteeringHistoryPage />}></Route>
        <Route path="manage-profile" element={<ManageProfilePage />}></Route>
        <Route path="manage-listing" element={<ManageListingPage />}></Route>
        <Route path="manage-applications" element={<ManageVolunteerApplicationPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
