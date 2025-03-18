import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./section/auth/Login";
import Signup from "./section/auth/Signup";
import Messages from "./pages/Messages";
import { DarkModeProvider } from "./context/DarkModeContext";

const App = () => {
  const user = useSelector((state) => state.auth?.user); // Updated to use auth.user instead of auth.userInfo

  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" /> : <Signup />}
          />
          <Route
            path="/"
            element={user ? <Messages /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
};

export default App;
