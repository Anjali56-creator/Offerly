import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, isValidEmail } from "../context/AuthContext.jsx";

function ForgotPassword() {
  const { user, authLoading, requestResetCode, checkResetCode, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => navigate("/login"), 2000);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSendCode(e) {
    e.preventDefault();
    if (!email.trim()) return setError("Email is required");
    if (!isValidEmail(email.trim())) return setError("Enter a valid email address");

    setSubmitting(true);
    const result = await requestResetCode(email);
    setSubmitting(false);

    if (!result.ok) return setError(result.error);

    setEmailSent(Boolean(result.emailSent));
    setDemoCode(result.code || "");
    setError("");
    setInfo("");
    setStep(2);
  }

  async function handleResend(e) {
    e.preventDefault();
    setSubmitting(true);
    const result = await requestResetCode(email);
    setSubmitting(false);

    if (!result.ok) return setError(result.error);

    setEmailSent(Boolean(result.emailSent));
    setDemoCode(result.code || "");
    setCode("");
    setError("");
    setInfo("A new code has been sent.");
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!code.trim()) return setError("Please enter the 6-digit code");

    setSubmitting(true);
    const result = await checkResetCode(email, code);
    setSubmitting(false);

    if (!result.ok) return setError(result.error);

    setError("");
    setInfo("");
    setStep(3);
  }

  async function handleNewPassword(e) {
    e.preventDefault();
    if (!newPassword) return setError("New password is required");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (confirm !== newPassword) return setError("Passwords do not match");

    setSubmitting(true);
    const result = await resetPassword(email, code, newPassword);
    setSubmitting(false);

    if (!result.ok) return setError(result.error);

    setError("");
    setDone(true);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">
          <span className="logo">
            <span>Offerly</span>
          </span>
        </h1>
        <p className="auth-tagline">from applied to offer</p>

        <h2 className="auth-title">Forgot password</h2>
        <p className="step-label">Step {step} of 3</p>

        {error && <p className="form-error">{error}</p>}

        {step === 1 && (
          <form className="step-form" onSubmit={handleSendCode} noValidate>
            <label className="field">
              <span>Registered email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </label>
            <button type="submit" className="btn btn-wide" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="step-form" onSubmit={handleVerifyCode} noValidate>
            {demoCode && (
              <p className="demo-note">SMTP not configured — your reset code is {demoCode}</p>
            )}
            <p className="step-help">
              {emailSent
                ? `We sent a 6-digit code to ${email.trim()}. It works for 10 minutes.`
                : `Enter the 6-digit reset code for ${email.trim()}. It works for 10 minutes.`}
            </p>
            {info && <p className="info-text">{info}</p>}

            <label className="field">
              <span>Enter code</span>
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
            </label>
            <button type="submit" className="btn btn-wide" disabled={submitting}>
              {submitting ? "Verifying..." : "Verify code"}
            </button>
            <p className="auth-switch">
              Didn't get it?{" "}
              <a href="#resend" onClick={handleResend}>
                Resend code
              </a>
            </p>
          </form>
        )}

        {step === 3 && !done && (
          <form className="step-form" onSubmit={handleNewPassword} noValidate>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
              />
            </label>
            <button type="submit" className="btn btn-wide" disabled={submitting}>
              {submitting ? "Updating..." : "Change password"}
            </button>
          </form>
        )}

        {done && <p className="success-box">Password changed! Please log in.</p>}

        <p className="auth-switch">
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPassword;
