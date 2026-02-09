import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Mail, Lock, ArrowRight } from "lucide-react";
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
      email,
      password,
    });

    if (error) {
      console.error("❌ Admin Login failed:", error.message);
      setError("Invalid email or password");
    } else {
      console.log("✅ Admin Login successful");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="welcome-section">
          <h1 className="welcome-title">
            Welcome to <span className="brand-highlight">NutriCare!</span>
          </h1>
          <p className="tagline">Monitor. Nourish. Grow.</p>
        </div>

        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Admin Portal</h2>
            <p className="login-subtitle">Sign in to manage student health</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <div className="icon-wrapper">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>

            <div className="input-group">
              <div className="icon-wrapper">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={18} className="btn-icon" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
