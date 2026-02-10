import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Login.css";
import NutriCareLogo from "./NutriCare.png";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      // Small delay for UX so it doesn't flash too fast
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.error("❌ Admin Login failed:", loginError.message);
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      console.log("✅ Admin Login successful");
      // Success! Show overlay and transition
      setShowSuccessOverlay(true);

      // Enforce minimum display time for the brand overlay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Trigger fade out
      setIsFadingOut(true);

      // Wait for fade out animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      navigate("/dashboard");
    }
  };

  if (showSuccessOverlay) {
    return (
      <div className={`loading-screen ${isFadingOut ? "fade-out" : ""}`}>
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
            <div className="input-group">
                <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                aria-label="Email Address"
                />
            </div>

            <div className="input-group">
                <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                aria-label="Password"
                />
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 className="spin" size={20} />
                      <span>Logging in...</span>
                  </div>
              ) : (
                  "Login"
              )}
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
