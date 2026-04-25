import { Routes, Route } from 'react-router';
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"
import { VolunteerHomePage } from './pages/VolunteerHomePage';
import { ProgrammeDetailsPage } from './pages/ProgrammeDetailsPage';
import { AuthProvider } from './context/auth/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="login" index element={<LoginPage />}></Route>
        <Route path="sign-up" element={<SignUpPage />}></Route>
        <Route path="volunteer-home" element={<VolunteerHomePage />}></Route>
        <Route path="programme-details" element={<ProgrammeDetailsPage />}></Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
