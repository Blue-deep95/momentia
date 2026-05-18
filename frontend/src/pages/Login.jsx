import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../services/api.js";
import { login } from "../slices/authSlice.js";

/* ─── Floating Activity Card ───────────────────────────────── */
const FloatCard = ({ avatar, title, sub, delay, className = "" }) => (
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
      <img
        src={avatar} alt=""
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        style={{ outline: "2px solid rgba(77,217,172,0.35)", outlineOffset: 1 }}
      />
    ) : (
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: "#4DD9AC", boxShadow: "0 0 8px 3px rgba(77,217,172,0.55)" }} />
    )}
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.92)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        {sub}
      </div>
    </div>
  </div>
);

/* ─── Input Field ───────────────────────────────────────────── */
const Field = ({ label, type, name, placeholder, value, onChange, extra }) => {
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
        {extra && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Social Button ─────────────────────────────────────────── */
const SocialBtn = ({ label }) => {
  const [hov, setHov] = useState(false);
  return (
    <button type="button"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200"
      style={{
        border: hov ? "1.5px solid #0D9488" : "1.5px solid #E5E7EB",
        background: hov ? "#F0FDFB" : "#fff",
        color: "#374151",
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
      {label === "Google" ? (
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )}
      {label}
    </button>
  );
};

/* ─── Eye toggle icon ───────────────────────────────────────── */
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

/* ─── Main ──────────────────────────────────────────────────── */
const Login = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [form,     setForm]     = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/user/login", form);
      dispatch(login({ user: res.data.user, accessToken: res.data.accessToken }));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes floatUD  { 0%{ transform:translateY(0) } 100%{ transform:translateY(-12px) } }
    @keyframes fadeForm { from{ opacity:0; transform:translateY(20px) } to{ opacity:1; transform:translateY(0) } }
    @keyframes pulse    { 0%,100%{ opacity:1; transform:scale(1) } 50%{ opacity:.35; transform:scale(.65) } }
    @keyframes spin     { to{ transform:rotate(360deg) } }

    .login-root { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; }
    .right-form  { animation:fadeForm .7s cubic-bezier(.22,1,.36,1) both; }
    .submit-btn  { transition:all .2s; }
    .submit-btn:hover:not(:disabled) { transform:translateY(-1.5px); box-shadow:0 14px 36px -6px rgba(13,148,136,0.52)!important; }
    .submit-btn:active:not(:disabled){ transform:translateY(0); }
    input::placeholder { color:#C4C4CF; }

    @media(max-width:1023px){
      .login-root { grid-template-columns:1fr!important; }
      .left-panel { display:none!important; }
      .right-panel{ min-height:100vh; padding:36px 24px!important; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="login-root" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

        {/* ══ LEFT — dark teal + landscape ══ */}
        <div
          className="left-panel relative overflow-hidden flex flex-col"
          style={{ background: "linear-gradient(150deg,#071c1a 0%,#0b2e2b 45%,#0d3532 75%,#082622 100%)", minHeight: "100vh" }}
        >
          {/* Diagonal texture lines */}
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

          {/* ── TOP card ── */}
          <div className="relative z-10 pt-5 px-5">
            <FloatCard
              avatar="https://picsum.photos/seed/fc1/80/80"
              title="@Spark_just posted"
              sub="Santorini, Greece"
              delay="0s"
            />
          </div>

          {/* ── CENTRE: text + landscape circle side-by-side ── */}
          <div className="relative z-10 flex-1 flex items-center px-8 py-4 gap-4">

            {/* Text block — left side */}
            <div className="flex-1 min-w-0">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 mb-6"
                style={{ padding:"5px 13px", borderRadius:20, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.11)" }}>
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background:"#4DD9AC", boxShadow:"0 0 6px 2px rgba(77,217,172,0.6)", animation:"pulse 2s ease infinite" }} />
                <span style={{ fontSize:9.5, color:"#4DD9AC", letterSpacing:"1.8px", textTransform:"uppercase", fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Live now</span>
              </div>

              <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:42, fontWeight:300, color:"#fff", lineHeight:1.16, letterSpacing:"-0.5px", marginBottom:20 }}>
                Capture your<br />
                <em style={{ fontStyle:"italic", color:"#4DD9AC" }}>moments,</em><br />
                <span style={{ color:"rgba(255,255,255,0.28)" }}>share your world</span>
              </h1>

              {/* M logo */}
              <div className="mb-5 flex items-center gap-3">
                <div style={{ width:44, height:44, borderRadius:"50%", border:"1.5px solid rgba(77,217,172,0.4)",
                  background:"rgba(77,217,172,0.06)", display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:"#4DD9AC" }}>M</div>
              </div>

              <p style={{ fontSize:12.5, color:"rgba(255,255,255,0.32)", fontWeight:300, lineHeight:1.8, marginBottom:24, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Join millions of creators sharing<br />their stories every day.
              </p>

              {/* Stats */}
              <div style={{ display:"flex", borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", backdropFilter:"blur(8px)" }}>
                {[["2.1M","Creators"],["14M","Moments"],["98%","Happiness"]].map(([n,l],i) => (
                  <div key={l} style={{ flex:1, textAlign:"center", padding:"11px 6px", borderRight: i<2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:"#4DD9AC" }}>{n}</div>
                    <div style={{ fontSize:8.5, color:"rgba(255,255,255,0.28)", marginTop:2, letterSpacing:"1px", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Landscape circle — right side, doesn't overlap text */}
            <div className="flex-shrink-0" style={{
              width:200, height:200, borderRadius:"50%", overflow:"hidden",
              border:"1.5px solid rgba(77,217,172,0.22)",
              boxShadow:"0 0 48px 8px rgba(13,148,136,0.18), inset 0 0 30px rgba(0,0,0,0.35)",
            }}>
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80"
                alt="landscape"
                style={{ width:"100%", height:"100%", objectFit:"cover", filter:"saturate(0.8) brightness(0.85)" }}
              />
              {/* Teal inner vignette */}
              <div style={{ position:"absolute", inset:0, borderRadius:"50%",
                background:"radial-gradient(circle at center, transparent 35%, rgba(7,28,26,0.5) 100%)", pointerEvents:"none" }} />
            </div>
          </div>

          {/* ── BOTTOM two cards ── */}
          <div className="relative z-10 pb-5 px-5 flex items-end justify-between gap-3">
            <FloatCard
              avatar="https://picsum.photos/seed/fc3/80/80"
              title="@Teddy.photo liked"
              sub="your latest story"
              delay="-4s"
            />
            <FloatCard
              avatar="https://picsum.photos/seed/fc2/80/80"
              title="@Mohana_rupa posted"
              sub="shared today"
              delay="-2s"
            />
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

          <form onSubmit={handleSubmit} className="right-form w-full" style={{ maxWidth:400, position:"relative", zIndex:2 }}>

            {/* Mobile brand */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div style={{ width:38, height:38, borderRadius:10, background:"#0b2d2a",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Fraunces',serif", fontSize:20, color:"#4DD9AC", fontWeight:700 }}>M</div>
              <span style={{ fontWeight:700, color:"#111827", fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Momentia</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6"
              style={{ borderRadius:20, padding:"5px 14px", fontSize:11.5, fontWeight:500,
                background:"rgba(13,148,136,0.07)", border:"1px solid rgba(13,148,136,0.18)",
                color:"#0D9488", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background:"#0D9488", animation:"pulse 2s ease infinite" }} />
              Welcome back to Momentia
            </div>

            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:44, fontWeight:400, color:"#111827",
              letterSpacing:"-1px", lineHeight:1.08, marginBottom:6 }}>Sign in</h2>
            <p style={{ fontSize:13.5, color:"#9CA3AF", marginBottom:32, fontWeight:400, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Continue your creative journey
            </p>

            {error && (
              <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)",
                borderRadius:12, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:20,
                fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{error}</div>
            )}

            <Field label="Email address" type="email" name="email"
              placeholder="teddy@gmail.com" value={form.email} onChange={handleChange} />
            <Field label="Password" type={showPass ? "text" : "password"} name="password"
              placeholder="••••••••••" value={form.password} onChange={handleChange}
              extra={<EyeIcon show={showPass} onToggle={() => setShowPass(!showPass)} />} />

            <div className="text-right mb-6" style={{ marginTop:-10 }}>
              <span onClick={() => navigate("/forgot-password")}
                style={{ fontSize:12.5, color:"#0D9488", fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Forgot password?
              </span>
            </div>

            <button type="submit" disabled={loading} className="submit-btn w-full flex items-center justify-center gap-2.5"
              style={{ padding:"15px", borderRadius:14, border:"none",
                background:"linear-gradient(135deg, #0D9488 0%, #14B8A6 55%, #2DD4BF 100%)",
                color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:14.5, fontWeight:700, cursor:loading ? "not-allowed" : "pointer",
                opacity:loading ? 0.75 : 1, letterSpacing:"0.15px", marginBottom:24,
                boxShadow:"0 6px 24px -4px rgba(13,148,136,0.38)" }}>
              {loading ? (
                <>
                  <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)",
                    borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
                  Signing in...
                </>
              ) : "Sign In →"}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div style={{ flex:1, height:1, background:"#F3F4F6" }} />
              <span style={{ fontSize:11.5, color:"#C4C4CF", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>or continue with</span>
              <div style={{ flex:1, height:1, background:"#F3F4F6" }} />
            </div>

            <div className="flex gap-3 mb-7">
              <SocialBtn label="Google" />
              <SocialBtn label="Facebook" />
            </div>

            <p style={{ textAlign:"center", fontSize:13.5, color:"#9CA3AF", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Don't have an account?{" "}
              <span onClick={() => navigate("/register")}
                style={{ color:"#0D9488", fontWeight:700, cursor:"pointer" }}>
                Create one free
              </span>
            </p>
          </form>
        </div>

      </div>
    </>
  );
};

export default Login;
