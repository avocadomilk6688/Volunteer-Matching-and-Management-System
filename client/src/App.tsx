import { Routes, Route } from 'react-router';
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"
import { VolunteerHomePage } from './pages/VolunteerHomePage';

function App() {

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="login" index element={<LoginPage />}></Route>
      <Route path="sign-up" element={<SignUpPage />}></Route>
      <Route path="volunteer-home" element={<VolunteerHomePage />}></Route>
    </Routes>
  )
}

export default App
