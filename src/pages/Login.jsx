import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    console.log("Attempting login with:", trimmedEmail);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.error("❌ Admin Login failed:", error);

        // Enhance "Failed to fetch" message with actionable advice
        if (error.message === "Failed to fetch") {
          setError("Network Error: Could not reach Supabase. Please check your internet connection and Supabase URL configuration.");
        } else {
          setError(error.message);
        }
      } else {
        console.log("✅ Admin Login successful");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("❌ Unexpected Login error:", err);
      setError("An unexpected error occurred. Check console for details.");
    }
  };

  return (
    <div className="login-container">
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
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-btn">
            Login
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
