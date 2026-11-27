import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, isValidEmail } from "../context/AuthContext.jsx";

function Login() {
  const { user, authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email.trim())) newErrors.email = "Enter a valid email address";
    if (!form.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);

    if (result.ok) {
      navigate("/dashboard");
    } else {
      setErrors({ form: result.error });
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-logo">
          <span className="logo">
            <span>Offerly</span>
          </span>
        </h1>
        <p className="auth-tagline">from applied to offer</p>

        <h2 className="auth-title">Login</h2>

        {errors.form && <p className="form-error">{errors.form}</p>}

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} autoFocus />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} />
          {errors.password && <small className="error">{errors.password}</small>}
        </label>

        <Link to="/forgot-password" className="forgot-link">
          Forgot password?
        </Link>

        <button type="submit" className="btn btn-wide" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="auth-switch">
          New here? <Link to="/signup">Create account</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
