import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect, createContext } from "react";
import Home from "./pages/Home";
import HowItWorks from "./pages/hiw"; // Correct the import statement
import LandingPage from "./pages/Landing";// Correct the import statement
import Price_list from "./pages/pricing";
import Informative from "./unoff/Info";
import { Toaster } from 'react-hot-toast';

// Create auth context
export const AuthContext = createContext(null);

function App() {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  // Function to handle login
  
  // Function to handle logout
  
  return (
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/howitworks" element={<HowItWorks />} /> {/* Correct the element */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/Landing" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/price" element={<Price_list />} />
          <Route path="/info" element={<Informative />} />
        </Routes>
      </Router>
  );
}

export default App;
