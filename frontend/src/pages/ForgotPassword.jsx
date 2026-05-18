import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

/* ─── Floating Activity Card (matches Login exactly) ───────── */
const FloatCard = ({ avatar, icon, title, sub, delay, className = "" }) => (
  <div
    className={`flex items-center gap-3 rounded-2xl px-4 py-3 min-w-[180px] ${className}`}
    style={{
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      animation: `floatUD 5s ${delay} ease-in-out infinite alternate`,
    }}
  >
    {avatar ? (
      <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        style={{ outline: "2px solid rgba(77,217,172,0.35)", outlineOffset: 1 }} />
    ) : (
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: "#4DD9AC", boxShadow: "0 0 8px 3px rgba(77,217,172,0.55)" }} />
    )}
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.92)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{sub}</div>
    </div>
  </div>
);

/* ─── Input Field (matches Login's Field) ───────────────────── */
const Field = ({ label, type = "text", name, placeholder, value, onChange, extra }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="mb-5">
      <label className="block mb-2"
        style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.9px", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type} name={name} placeholder={placeholder} value={value}
          onChange={onChange} required
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all duration-200"
          style={{
            paddingRight: extra ? 44 : 16,
            background: "#fff",
            border: focused ? "1.5px solid #0D9488" : "1.5px solid #E5E7EB",
            color: "#111827",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            boxShadow: focused ? "0 0 0 3px rgba(13,148,136,0.1)" : "0 1px 2px rgba(0,0,0,0.04)",
          }}
        />
        {extra && <div className="absolute right-4 top-1/2 -translate-y-1/2">{extra}</div>}
      </div>
    </div>
  );
};

/* ─── OTP Single Box (teal theme) ───────────────────────────── */
const OtpBox = ({ id, value, onChange, onKeyDown }) => (
  <input
    id={id} type="text" inputMode="numeric" maxLength="1"
    value={value} onChange={onChange} onKeyDown={onKeyDown} autoComplete="off"
    style={{
      width: 52, height: 58, borderRadius: 14,
      border: value ? "1.5px solid #0D9488" : "1.5px solid #E5E7EB",
      background: value ? "rgba(13,148,136,0.05)" : "#fff",
      textAlign: "center", fontSize: 22, fontWeight: 700,
      color: "#111827", fontFamily: "'Fraunces',serif",
      outline: "none", transition: "all 0.2s",
      boxShadow: value ? "0 0 0 3px rgba(13,148,136,0.12)" : "0 1px 2px rgba(0,0,0,0.04)",
      caretColor: "#0D9488",
    }}
  />
);

/* ─── Eye Toggle Icon ────────────────────────────────────────── */
const EyeIcon = ({ show, onToggle }) => (
  <button type="button" onClick={onToggle} className="text-gray-400 hover:text-gray-600 transition-colors">
    {show ? (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )}
  </button>
);

/* ─── Step Indicator (teal theme) ───────────────────────────── */
const StepDots = ({ step }) => (
  <div className="flex items-center gap-2 mb-7">
    {[1, 2, 3].map((s) => (
      <React.Fragment key={s}>
        <div style={{
          width: s <= step ? 28 : 8, height: 8, borderRadius: 6,
          background: s <= step ? "linear-gradient(90deg,#0D9488,#14B8A6)" : "#E5E7EB",
          transition: "all 0.4s cubic-bezier(.22,1,.36,1)",
          boxShadow: s === step ? "0 0 12px rgba(13,148,136,0.45)" : "none",
        }} />
        {s < 3 && <div style={{ width: 20, height: 1, background: s < step ? "#0D9488" : "#E5E7EB", transition: "all 0.4s" }} />}
      </React.Fragment>
    ))}
    <span className="ml-2" style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      Step {step} of 3
    </span>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep]                   = useState(1);
  const [email, setEmail]                 = useState("");
  const [otp, setOtp]                     = useState(["", "", "", "", "", ""]);
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState("");
  const [error, setError]                 = useState("");
  const [timer, setTimer]                 = useState(30);
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await api.post("/user/forgot-password", { email });
      setMessage(res.data.message || "OTP sent to your email!");
      setStep(2); setTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || "No account found with that email.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.join("").length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setError(""); setMessage(""); setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await api.post("/user/reset-password", { email, otp: otp.join(""), password });
      setMessage(res.data.message || "Password reset successfully!");
      setStep(4);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); document.getElementById("otp-5")?.focus(); }
  };

  /* password strength */
  const strengthScore = [
    password.length >= 8, /[A-Z]/.test(password),
    /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthScore];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#3B82F6", "#0D9488"][strengthScore];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes floatUD   { 0%{ transform:translateY(0) } 100%{ transform:translateY(-12px) } }
    @keyframes fadeForm  { from{ opacity:0; transform:translateY(20px) } to{ opacity:1; transform:translateY(0) } }
    @keyframes pulse     { 0%,100%{ opacity:1; transform:scale(1) } 50%{ opacity:.35; transform:scale(.65) } }
    @keyframes spin      { to{ transform:rotate(360deg) } }
    @keyframes slideIn   { from{ opacity:0; transform:translateX(20px) } to{ opacity:1; transform:translateX(0) } }
    @keyframes successPop{ 0%{ transform:scale(0.5); opacity:0 } 60%{ transform:scale(1.15) } 100%{ transform:scale(1); opacity:1 } }
    @keyframes checkDraw { from{ stroke-dashoffset:60 } to{ stroke-dashoffset:0 } }
    @keyframes progressBar { from{ width:0 } to{ width:100% } }

    .fp-root    { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; }
    .right-form { animation:fadeForm .7s cubic-bezier(.22,1,.36,1) both; }
    .step-content { animation:slideIn .4s cubic-bezier(.22,1,.36,1) both; }
    .submit-btn { transition:all .2s; }
    .submit-btn:hover:not(:disabled){ transform:translateY(-1.5px); box-shadow:0 14px 36px -6px rgba(13,148,136,0.52)!important; }
    .submit-btn:active:not(:disabled){ transform:translateY(0); }
    input::placeholder { color:#C4C4CF; }

    @media(max-width:1023px){
      .fp-root { grid-template-columns:1fr!important; }
      .left-panel { display:none!important; }
      .right-panel{ min-height:100vh; padding:36px 24px!important; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="fp-root" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

        {/* ══ LEFT — dark teal (same as Login) ══ */}
        <div
          className="left-panel relative overflow-hidden flex flex-col"
          style={{ background: "linear-gradient(150deg,#071c1a 0%,#0b2e2b 45%,#0d3532 75%,#082622 100%)", minHeight: "100vh" }}
        >
          {/* Diagonal texture */}
          <div className="absolute inset-0 pointer-events-none z-0" style={{
            backgroundImage: "repeating-linear-gradient(155deg, transparent, transparent 40px, rgba(255,255,255,0.022) 40px, rgba(255,255,255,0.022) 41px)",
          }} />

          {/* Ambient glows */}
          <div className="absolute pointer-events-none z-0"
            style={{ right:-80, top:"40%", width:440, height:440, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(45,180,150,0.1) 0%, transparent 65%)" }} />
          <div className="absolute pointer-events-none z-0"
            style={{ left:-80, top:-80, width:320, height:320, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(20,120,100,0.09) 0%, transparent 65%)" }} />

          {/* TOP card */}
          <div className="relative z-10 pt-5 px-5">
            <FloatCard title="🔐 Secure recovery" sub="End-to-end encrypted" delay="0s" />
          </div>

          {/* CENTRE */}
          <div className="relative z-10 flex-1 flex items-center px-8 py-4 gap-4">
            <div className="flex-1 min-w-0">

              {/* Secure badge */}
              <div className="inline-flex items-center gap-2 mb-6"
                style={{ padding:"5px 13px", borderRadius:20, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.11)" }}>
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background:"#4DD9AC", boxShadow:"0 0 6px 2px rgba(77,217,172,0.6)", animation:"pulse 2s ease infinite" }} />
                <span style={{ fontSize:9.5, color:"#4DD9AC", letterSpacing:"1.8px", textTransform:"uppercase", fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Secure mode active</span>
              </div>

              <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:42, fontWeight:300, color:"#fff", lineHeight:1.16, letterSpacing:"-0.5px", marginBottom:20 }}>
                We'll find<br />
                <em style={{ fontStyle:"italic", color:"#4DD9AC" }}>your account,</em><br />
                <span style={{ color:"rgba(255,255,255,0.28)" }}>safely & fast</span>
              </h1>

              {/* M logo */}
              <div className="mb-5 flex items-center gap-3">
                <div style={{ width:44, height:44, borderRadius:"50%", border:"1.5px solid rgba(77,217,172,0.4)",
                  background:"rgba(77,217,172,0.06)", display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:"#4DD9AC" }}>M</div>
              </div>

              <p style={{ fontSize:12.5, color:"rgba(255,255,255,0.32)", fontWeight:300, lineHeight:1.8, marginBottom:24, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Military-grade recovery with<br />zero-knowledge architecture.
              </p>

              {/* Stats */}
              <div style={{ display:"flex", borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", backdropFilter:"blur(8px)" }}>
                {[["30s","OTP Speed"],["256-bit","Encryption"],["99.9%","Uptime"]].map(([n,l],i) => (
                  <div key={l} style={{ flex:1, textAlign:"center", padding:"11px 6px", borderRight: i<2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:"#4DD9AC" }}>{n}</div>
                    <div style={{ fontSize:8.5, color:"rgba(255,255,255,0.28)", marginTop:2, letterSpacing:"1px", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Circle illustration */}
            <div className="flex-shrink-0 relative" style={{
              width:200, height:200, borderRadius:"50%", overflow:"hidden",
              border:"1.5px solid rgba(77,217,172,0.22)",
              boxShadow:"0 0 48px 8px rgba(13,148,136,0.18), inset 0 0 30px rgba(0,0,0,0.35)",
            }}>
              <img
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80"
                alt="secure"
                style={{ width:"100%", height:"100%", objectFit:"cover", filter:"saturate(0.7) brightness(0.8)" }}
              />
            </div>
          </div>

          {/* BOTTOM cards */}
          <div className="relative z-10 pb-5 px-5 flex items-end justify-between gap-3">
            <FloatCard title="⚡ OTP delivered" sub="Check your inbox" delay="-4s" />
            <FloatCard title="✅ Account secured" sub="2-step verification" delay="-2s" />
          </div>
        </div>

        {/* ══ RIGHT — clean white form ══ */}
        <div
          className="right-panel flex items-center justify-center"
          style={{ background:"#ffffff", padding:"48px 52px", position:"relative", overflow:"hidden" }}
        >
          {/* Subtle glows */}
          <div className="absolute pointer-events-none"
            style={{ top:-140, right:-140, width:380, height:380, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(13,148,136,0.05) 0%, transparent 70%)" }} />
          <div className="absolute pointer-events-none"
            style={{ bottom:-100, left:-100, width:300, height:300, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(13,148,136,0.04) 0%, transparent 70%)" }} />

          <div className="right-form w-full" style={{ maxWidth:400, position:"relative", zIndex:2 }}>

            {/* Mobile brand + secure badge */}
            <div className="flex items-center gap-3 mb-7">
              <div style={{ width:38, height:38, borderRadius:10, background:"#0b2d2a",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Fraunces',serif", fontSize:20, color:"#4DD9AC", fontWeight:700 }}>M</div>
              <span style={{ fontWeight:700, color:"#111827", fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Momentia</span>
              <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background:"rgba(13,148,136,0.07)", border:"1px solid rgba(13,148,136,0.18)" }}>
                <span style={{ fontSize:10, color:"#0D9488", fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>🔒 Secure Recovery</span>
              </div>
            </div>

            {/* Step dots */}
            {step < 4 && <StepDots step={step} />}

            {/* ── SUCCESS STATE ── */}
            {step === 4 ? (
              <div className="text-center py-10">
                <div style={{ width:80, height:80, borderRadius:"50%",
                  background:"linear-gradient(135deg,#0D9488,#14B8A6)",
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px",
                  animation:"successPop 0.6s cubic-bezier(.22,1,.36,1) both",
                  boxShadow:"0 16px 40px -8px rgba(13,148,136,0.5)" }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M8 18L15 25L28 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="60" strokeDashoffset="0"
                      style={{ animation:"checkDraw 0.5s 0.3s ease both" }} />
                  </svg>
                </div>
                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:400, color:"#111827", marginBottom:12, letterSpacing:"-1px" }}>
                  All done! 🎉
                </h2>
                <p style={{ fontSize:14, color:"#9CA3AF", marginBottom:32, lineHeight:1.7, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Your password has been reset successfully.<br />Redirecting you to login...
                </p>
                <div style={{ width:"100%", height:4, borderRadius:2, background:"#F3F4F6", overflow:"hidden" }}>
                  <div style={{ height:"100%", background:"linear-gradient(90deg,#0D9488,#14B8A6,#2DD4BF)",
                    animation:"progressBar 2.5s linear both", borderRadius:2 }} />
                </div>
              </div>

            ) : step === 1 ? (
              /* ── STEP 1: Email ── */
              <div className="step-content">
                <div className="inline-flex items-center gap-2 mb-6"
                  style={{ borderRadius:20, padding:"5px 14px", fontSize:11.5, fontWeight:500,
                    background:"rgba(13,148,136,0.07)", border:"1px solid rgba(13,148,136,0.18)",
                    color:"#0D9488", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background:"#0D9488", animation:"pulse 2s ease infinite" }} />
                  Password recovery
                </div>

                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:44, fontWeight:400, color:"#111827",
                  letterSpacing:"-1px", lineHeight:1.08, marginBottom:6 }}>
                  Forgot<br /><em style={{ fontStyle:"italic", color:"#0D9488" }}>password?</em>
                </h2>
                <p style={{ fontSize:13.5, color:"#9CA3AF", marginBottom:28, fontWeight:400, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  No worries. Enter your email and we'll send a 6-digit code.
                </p>

                {error && <ErrorBox>{error}</ErrorBox>}

                <Field label="Email address" type="email" name="email"
                  placeholder="teddy@gmail.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} />

                <button onClick={handleSendOtp} disabled={loading || !email} className="submit-btn w-full flex items-center justify-center gap-2.5"
                  style={{ padding:"15px", borderRadius:14, border:"none",
                    background:"linear-gradient(135deg,#0D9488 0%,#14B8A6 55%,#2DD4BF 100%)",
                    color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontSize:14.5, fontWeight:700,
                    cursor: loading || !email ? "not-allowed" : "pointer",
                    opacity: loading || !email ? 0.65 : 1, marginBottom:24, marginTop:8,
                    boxShadow:"0 6px 24px -4px rgba(13,148,136,0.38)" }}>
                  {loading ? (
                    <><Spinner /> Sending OTP...</>
                  ) : "Send OTP →"}
                </button>

                <p style={{ textAlign:"center", fontSize:13.5, color:"#9CA3AF", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Remember it?{" "}
                  <span onClick={() => navigate("/login")}
                    style={{ color:"#0D9488", fontWeight:700, cursor:"pointer" }}>Back to login</span>
                </p>
              </div>

            ) : step === 2 ? (
              /* ── STEP 2: OTP ── */
              <div className="step-content">
                <div className="inline-flex items-center gap-2 mb-6"
                  style={{ borderRadius:20, padding:"5px 14px", fontSize:11.5, fontWeight:500,
                    background:"rgba(13,148,136,0.07)", border:"1px solid rgba(13,148,136,0.18)",
                    color:"#0D9488", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background:"#0D9488", animation:"pulse 2s ease infinite" }} />
                  Code verification
                </div>

                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:44, fontWeight:400, color:"#111827",
                  letterSpacing:"-1px", lineHeight:1.08, marginBottom:6 }}>
                  Check your<br /><em style={{ fontStyle:"italic", color:"#0D9488" }}>inbox</em>
                </h2>
                <p style={{ fontSize:13.5, color:"#9CA3AF", marginBottom:4, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  We sent a 6-digit code to
                </p>
                <p className="mb-6" style={{ fontSize:14, fontWeight:600, color:"#111827", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {email}
                  <span onClick={() => setStep(1)}
                    style={{ marginLeft:10, fontSize:12, color:"#0D9488", fontWeight:500, cursor:"pointer" }}>Change ↩</span>
                </p>

                {error   && <ErrorBox>{error}</ErrorBox>}
                {message && <SuccessBox>{message}</SuccessBox>}

                {/* OTP boxes */}
                <div className="flex justify-between gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <OtpBox key={index} id={`otp-${index}`} value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)} />
                  ))}
                </div>

                <button onClick={handleVerifyOtp} disabled={otp.join("").length < 6}
                  className="submit-btn w-full flex items-center justify-center"
                  style={{ padding:"15px", borderRadius:14, border:"none",
                    background:"linear-gradient(135deg,#0D9488 0%,#14B8A6 55%,#2DD4BF 100%)",
                    color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontSize:14.5, fontWeight:700,
                    cursor: otp.join("").length < 6 ? "not-allowed" : "pointer",
                    opacity: otp.join("").length < 6 ? 0.65 : 1, marginBottom:20,
                    boxShadow:"0 6px 24px -4px rgba(13,148,136,0.38)" }}>
                  Verify Code →
                </button>

                {/* Timer / Resend */}
                <div className="text-center">
                  {timer > 0 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background:"#F9FAFB", border:"1px solid #E5E7EB" }}>
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill="none" stroke="#E5E7EB" strokeWidth="2" />
                        <circle cx="10" cy="10" r="8" fill="none" stroke="#0D9488" strokeWidth="2"
                          strokeDasharray={`${(timer / 30) * 50.3} 50.3`} strokeLinecap="round"
                          transform="rotate(-90 10 10)" style={{ transition:"stroke-dasharray 1s linear" }} />
                      </svg>
                      <span style={{ fontSize:12, color:"#9CA3AF", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        Resend in <strong style={{ color:"#111827" }}>{timer}s</strong>
                      </span>
                    </div>
                  ) : (
                    <span onClick={handleSendOtp}
                      style={{ fontSize:13.5, color:"#0D9488", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Resend OTP ↺
                    </span>
                  )}
                </div>
              </div>

            ) : step === 3 ? (
              /* ── STEP 3: New Password ── */
              <div className="step-content">
                <div className="inline-flex items-center gap-2 mb-6"
                  style={{ borderRadius:20, padding:"5px 14px", fontSize:11.5, fontWeight:500,
                    background:"rgba(13,148,136,0.07)", border:"1px solid rgba(13,148,136,0.18)",
                    color:"#0D9488", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background:"#0D9488", animation:"pulse 2s ease infinite" }} />
                  Create new password
                </div>

                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:44, fontWeight:400, color:"#111827",
                  letterSpacing:"-1px", lineHeight:1.08, marginBottom:6 }}>
                  New<br /><em style={{ fontStyle:"italic", color:"#0D9488" }}>password</em>
                </h2>
                <p style={{ fontSize:13.5, color:"#9CA3AF", marginBottom:24, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Create a strong password for your account.
                </p>

                {error && <ErrorBox>{error}</ErrorBox>}

                {/* Strength bar */}
                {password && (
                  <div className="mb-4">
                    <div className="flex gap-1 mb-1.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:3,
                          background: i <= strengthScore ? strengthColor : "#E5E7EB",
                          transition:"all 0.3s" }} />
                      ))}
                    </div>
                    <span style={{ fontSize:11, color:strengthColor, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {strengthLabel} password
                    </span>
                  </div>
                )}

                <Field label="New password"
                  type={showPass ? "text" : "password"} name="password"
                  placeholder="At least 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  extra={<EyeIcon show={showPass} onToggle={() => setShowPass(!showPass)} />} />

                <Field label="Confirm password"
                  type={showConfirm ? "text" : "password"} name="confirm"
                  placeholder="Repeat your password" value={confirmPassword}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  extra={<EyeIcon show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />} />

                {/* Match indicator */}
                {confirmPassword && (
                  <div className="mb-4 -mt-2" style={{ fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif",
                    color: password === confirmPassword ? "#0D9488" : "#EF4444", fontWeight:600 }}>
                    {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                  </div>
                )}

                <button onClick={handleResetPassword} disabled={loading || !password || !confirmPassword}
                  className="submit-btn w-full flex items-center justify-center gap-2.5"
                  style={{ padding:"15px", borderRadius:14, border:"none",
                    background:"linear-gradient(135deg,#0D9488 0%,#14B8A6 55%,#2DD4BF 100%)",
                    color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontSize:14.5, fontWeight:700,
                    cursor: loading || !password || !confirmPassword ? "not-allowed" : "pointer",
                    opacity: loading || !password || !confirmPassword ? 0.65 : 1,
                    marginBottom:20, boxShadow:"0 6px 24px -4px rgba(13,148,136,0.38)" }}>
                  {loading ? (<><Spinner /> Resetting...</>) : "Reset Password →"}
                </button>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Tiny helpers ───────────────────────────────────────────── */
const Spinner = () => (
  <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff",
    borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
);

const ErrorBox = ({ children }) => (
  <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)",
    borderRadius:12, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:20,
    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</div>
);

const SuccessBox = ({ children }) => (
  <div style={{ background:"rgba(13,148,136,0.06)", border:"1px solid rgba(13,148,136,0.18)",
    borderRadius:12, padding:"10px 14px", fontSize:13, color:"#0D9488", marginBottom:20,
    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</div>
);

export default ForgotPassword;