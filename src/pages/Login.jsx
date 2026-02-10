import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Login.css";
import NutriCareLogo from "./NutriCare.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Admin Login failed:", error.message);
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      console.log("✅ Admin Login successful");
      navigate("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo-container">
            <img src={NutriCareLogo} alt="NutriCare Logo" className="loading-logo" />
          </div>
          <h2 className="loading-title">NutriCare</h2>
          <p className="loading-tagline">Monitor. Nourish. Grow.</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-content-wrapper">
        <div className="welcome-overlay-text">
          <h1 className="welcome-title-overlay">
            Welcome to{" "}
            <span className="nutricare-highlight-overlay">NutriCare!</span>
          </h1>
          <p className="tagline-overlay">Monitor. Nourish. Grow.</p>
        </div>

        <div className="login-card">
          <h2 className="login-title">NutriCare Admin</h2>
          <p className="login-description">
            Monitoring the health of the students
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <button type="submit" className="login-btn" disabled={isLoading}>
              Login
            </button>

            <div className="error-container">
              {error && <p className="login-error">{error}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
