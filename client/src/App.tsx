import { Routes, Route } from 'react-router';
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"

function App() {

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="login" index element={<LoginPage />}></Route>
      <Route path="sign-up" element={<SignUpPage />}></Route>
    </Routes>
  )
}

export default App
