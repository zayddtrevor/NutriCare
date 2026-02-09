import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("❌ Admin Login failed:", error.message);
      setError(error.message);
      setLoading(false);
    } else {
      console.log("✅ Admin Login successful");
      navigate("/dashboard");
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
