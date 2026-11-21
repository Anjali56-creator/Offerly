import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, isValidEmail } from "../context/AuthContext.jsx";

function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email.trim())) newErrors.email = "Enter a valid email address";
    if (!form.college.trim()) newErrors.college = "College name is required";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirm) newErrors.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) newErrors.confirm = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = signup(form);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setErrors({ email: result.error });
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

        <h2 className="auth-title">Create account</h2>

        <label className="field">
          <span>Full name</span>
          <input name="name" value={form.name} onChange={handleChange} autoFocus />
          {errors.name && <small className="error">{errors.name}</small>}
        </label>

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>College name</span>
          <input name="college" value={form.college} onChange={handleChange} />
          {errors.college && <small className="error">{errors.college}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} />
          {errors.password && <small className="error">{errors.password}</small>}
        </label>

        <label className="field">
          <span>Confirm password</span>
          <input name="confirm" type="password" value={form.confirm} onChange={handleChange} />
          {errors.confirm && <small className="error">{errors.confirm}</small>}
        </label>

        <button type="submit" className="btn btn-wide">
          Sign up
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}

export default Signup;
