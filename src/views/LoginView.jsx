import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Lock,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const LoginView = () => {
  const { users, loginWithCredentials } = useApp();

  const [selectedRole, setSelectedRole] = useState('owner');
  const [phone, setPhone] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // References for the 6 PIN digit boxes
  const pinInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Handle PIN input with auto-advance and backspace support
  const handlePinChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/[^0-9]/g, '');
    
    // Support pasting complete 6-digit PIN
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const newDigits = [...pinDigits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setPinDigits(newDigits);
      const nextFocus = Math.min(chars.length, 5);
      pinInputRefs[nextFocus]?.current?.focus();
      return;
    }

    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);
    setErrorMsg('');

    // Advance to next box if digit entered
    if (cleanVal && index < 5) {
      pinInputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move backwards on backspace if current box is empty
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1]?.current?.focus();
    }
  };

  // Submit credentials
  const handleSubmit = (e) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');

    if (fullPin.length !== 6) {
      setErrorMsg('Harap lengkapi 6 digit PIN keamanan Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const result = loginWithCredentials({
        role: selectedRole,
        phone,
        pin: fullPin
      });

      if (!result.success) {
        setErrorMsg(result.message);
        setIsLoading(false);
      }
    }, 250);
  };

  // Quick fill demo accounts
  const handleQuickFill = (user) => {
    setSelectedRole(user.role);
    setPhone(user.phone);
    const chars = (user.pin || '123456').slice(0, 6).split('');
    setPinDigits(chars);
    setErrorMsg('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: 'var(--bg-main)',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.06) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(234, 88, 12, 0.05) 0%, transparent 40%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Brand Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          padding: '28px 24px 22px',
          textAlign: 'center',
          borderBottom: '1px solid #fed7aa'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: 'var(--shadow-glow)',
            marginBottom: '12px'
          }}>
            <Store size={28} />
          </div>
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--primary-700)'
          }}>
            MART PILLAR
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Portal Autentikasi Pengadaan & Distribusi Outlet
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '28px 24px' }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Role Selection */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>1. Pilih Hak Akses (Role):</span>
                <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Wajib</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { id: 'owner', label: 'Owner', icon: '👑' },
                  { id: 'finance', label: 'Finance', icon: '💳' },
                  { id: 'supervisor', label: 'Atasan', icon: '📦' },
                  { id: 'outlet', label: 'Outlet', icon: '🏪' }
                ].map(r => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => {
                        setSelectedRole(r.id);
                        setErrorMsg('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--border-medium)',
                        background: isSelected ? '#fff7ed' : '#ffffff',
                        color: isSelected ? 'var(--primary-700)' : 'var(--text-main)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: No. HP */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">2. Nomor Handphone (No. HP):</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--primary-500)' }} />
                <input
                  type="tel"
                  placeholder="Contoh: 0812-1000-0001"
                  className="form-input"
                  style={{
                    paddingLeft: '42px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em'
                  }}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMsg('');
                  }}
                  required
                />
              </div>
            </div>

            {/* Step 3: 6-Digit PIN */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  3. PIN Keamanan (6 Digit):
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {pinDigits.filter(Boolean).length}/6 Digit
                </span>
              </div>

              {/* 6 Individual PIN Digit Boxes */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={pinInputRefs[index]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    style={{
                      width: '100%',
                      maxWidth: '60px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-md)',
                      border: digit ? '2px solid var(--primary-500)' : '1px solid var(--border-medium)',
                      background: digit ? '#fff7ed' : '#ffffff',
                      color: 'var(--primary-700)',
                      outline: 'none',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#dc2626'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '14px', fontSize: '0.98rem' }}
              disabled={isLoading}
            >
              <Lock size={18} />
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Demo Credentials Quick Fill Helper */}
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px dashed var(--border-subtle)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Kredensial Akun Demo (Klik untuk Isi Cepat):
              </span>
              <Sparkles size={14} color="var(--primary-500)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleQuickFill(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: '#fafafa',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-400)';
                    e.currentTarget.style.background = '#fff7ed';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = '#fafafa';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-700)',
                      fontSize: '0.68rem',
                      fontWeight: 800
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>{u.name}</strong>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    {u.displayPhone || u.phone} | PIN: <strong>{u.pin}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
