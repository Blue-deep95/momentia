import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

/* ───────────────── FLOAT CARD ───────────────── */
const FloatCard = ({ title, sub, delay }) => (
  <div
    className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-4 py-3 shadow-lg animate-[float_5s_ease-in-out_infinite_alternate]"
    style={{ animationDelay: delay }}
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
        M
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-blue-100/70">{sub}</p>
      </div>
    </div>
  </div>
);

/* ───────────────── INPUT FIELD ───────────────── */
const Field = ({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  extra,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="mb-5">
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none transition-all duration-300 ${
            focused
              ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
              : "border-gray-200"
          }`}
          style={{
            paddingRight: extra ? 50 : 16,
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

/* ───────────────── OTP BOX ───────────────── */
const OtpBox = ({ id, value, onChange, onKeyDown }) => (
  <input
    id={id}
    type="text"
    inputMode="numeric"
    maxLength="1"
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    autoComplete="off"
    className={`h-14 w-12 rounded-2xl border text-center text-xl font-bold outline-none transition-all duration-300 ${
      value
        ? "border-blue-500 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
        : "border-gray-200 bg-white"
    }`}
  />
);

/* ───────────────── EYE ICON ───────────────── */
const EyeIcon = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-gray-400 hover:text-blue-600 transition"
  >
    {show ? "🙈" : "👁️"}
  </button>
);

/* ───────────────── STEP DOTS ───────────────── */
const StepDots = ({ step }) => (
  <div className="mb-8 flex items-center gap-2">
    {[1, 2, 3].map((s) => (
      <React.Fragment key={s}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            s <= step
              ? "w-7 bg-gradient-to-r from-blue-500 to-purple-500"
              : "w-2 bg-gray-300"
          }`}
        />

        {s < 3 && (
          <div
            className={`h-[1px] w-5 ${
              s < step ? "bg-blue-400" : "bg-gray-300"
            }`}
          />
        )}
      </React.Fragment>
    ))}

    <span className="ml-2 text-xs text-gray-400">
      Step {step} of 3
    </span>
  </div>
);

/* ───────────────── MAIN COMPONENT ───────────────── */
const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", ""]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [timer, setTimer] = useState(30);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, timer]);

  /* ───────────────── SEND OTP ───────────────── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await api.post("/user/forgot-password", {
        email,
      });

      setMessage(res.data.message || "OTP sent successfully");
      setStep(2);
      setTimer(30);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No account found with this email"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────── VERIFY OTP ───────────────── */
  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (otp.join("").length < 5) {
      setError("Please enter full OTP");
      return;
    }

    setError("");
    setStep(3);
  };

  /* ───────────────── RESET PASSWORD ───────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/user/reset-password", {
        email,
        otp: otp.join(""),
        password,
      });

      setMessage(
        res.data.message || "Password reset successful"
      );

      setStep(4);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────── OTP CHANGE ───────────────── */
  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans">
      {/* ───────────────── LEFT ───────────────── */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-10">
        <div className="absolute top-[-120px] left-[-100px] h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"></div>

        <div className="absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full bg-purple-400/20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-between w-full">
          <FloatCard
            title="🔐 Secure Recovery"
            sub="Protected account access"
            delay="0s"
          />

          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-lg">
              <div className="h-2 w-2 rounded-full bg-blue-300 animate-pulse"></div>

              <span className="text-xs uppercase tracking-[3px] text-blue-100">
                Password Recovery
              </span>
            </div>

            <h1 className="text-6xl font-black leading-tight text-white">
              Recover your
              <span className="block text-blue-200">
                account safely
              </span>
            </h1>

            <p className="mt-6 max-w-md text-blue-100/80 leading-7">
              Reset your password securely with OTP verification
              and regain access to your account instantly.
            </p>

            <div className="mt-10 grid grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl">
              {[
                ["30s", "OTP Speed"],
                ["256-bit", "Security"],
                ["99%", "Success"],
              ].map(([num, text]) => (
                <div key={text} className="p-5 text-center">
                  <h3 className="text-2xl font-bold text-white">
                    {num}
                  </h3>

                  <p className="mt-1 text-xs uppercase tracking-widest text-blue-100/70">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <FloatCard
            title="@momentia secured"
            sub="Blue & Purple Theme"
            delay="-2s"
          />
        </div>
      </div>

      {/* ───────────────── RIGHT ───────────────── */}
      <div className="relative flex items-center justify-center overflow-hidden bg-white px-6 py-12">
        <div className="absolute top-[-100px] right-[-100px] h-72 w-72 rounded-full bg-blue-100 blur-3xl"></div>

        <div className="absolute bottom-[-100px] left-[-100px] h-72 w-72 rounded-full bg-purple-100 blur-3xl"></div>

        <div className="relative z-10 w-full max-w-md">
          {step < 4 && <StepDots step={step} />}

          {/* SUCCESS */}
          {step === 4 ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-4xl text-white shadow-2xl">
                ✓
              </div>

              <h2 className="text-5xl font-black text-gray-900">
                Success!
              </h2>

              <p className="mt-4 text-gray-500">
                Your password has been reset successfully.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>

                Forgot Password
              </div>

              <h2 className="text-5xl font-black text-gray-900">
                {step === 1 && "Recover account"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Create password"}
              </h2>

              <p className="mt-3 mb-8 text-gray-500">
                {step === 1 &&
                  "Enter your email to receive OTP"}
                {step === 2 &&
                  "Check your email and verify OTP"}
                {step === 3 &&
                  "Create your new secure password"}
              </p>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-600">
                  {message}
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <Field
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || !email}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading
                      ? "Sending OTP..."
                      : "Send OTP →"}
                  </button>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <div className="mb-6 flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <OtpBox
                        key={index}
                        id={`otp-${index}`}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(
                            e.target.value,
                            index
                          )
                        }
                        onKeyDown={(e) =>
                          handleOtpKeyDown(e, index)
                        }
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    Verify OTP →
                  </button>

                  <div className="mt-5 text-center text-sm text-gray-500">
                    {timer > 0 ? (
                      <>Resend OTP in {timer}s</>
                    ) : (
                      <span
                        onClick={handleSendOtp}
                        className="cursor-pointer font-semibold text-blue-600"
                      >
                        Resend OTP
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <Field
                    label="New Password"
                    type={showPass ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    extra={
                      <EyeIcon
                        show={showPass}
                        onToggle={() =>
                          setShowPass(!showPass)
                        }
                      />
                    }
                  />

                  <Field
                    label="Confirm Password"
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    name="confirm"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPass(e.target.value)
                    }
                    extra={
                      <EyeIcon
                        show={showConfirm}
                        onToggle={() =>
                          setShowConfirm(!showConfirm)
                        }
                      />
                    }
                  />

                  <button
                    onClick={handleResetPassword}
                    disabled={
                      loading ||
                      !password ||
                      !confirmPassword
                    }
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading
                      ? "Resetting..."
                      : "Reset Password →"}
                  </button>
                </>
              )}

              <p className="mt-8 text-center text-sm text-gray-500">
                Remember password?{" "}
                <span
                  onClick={() => navigate("/login")}
                  className="cursor-pointer font-bold text-blue-600 hover:text-purple-600"
                >
                  Back to login
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;