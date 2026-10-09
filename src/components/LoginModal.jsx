import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Shield, User, KeyRound, Check, X, AlertCircle } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { users, currentUser, switchUser, loginWithPin } = useApp();
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === selectedUser.pin) {
      switchUser(selectedUser.id);
      setErrorMsg('');
      setPin('');
      onClose();
    } else {
      setErrorMsg(`PIN salah! (PIN demo akun ini: ${selectedUser.pin})`);
    }
  };

  const handleQuickLogin = (u) => {
    switchUser(u.id);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--primary-400)" />
            <span className="modal-title">Sistem Login Mart Pillar</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Pilih akun pengguna di bawah ini untuk menguji akses hak peran (Role-Based Access Control):
          </p>

          {/* Quick User Selection Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            {users.map(u => {
              const isSelected = selectedUser.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setPin(u.pin);
                    setErrorMsg('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--primary-gradient)' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isSelected ? 'white' : 'var(--text-secondary)'
                    }}>
                      {u.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {u.title} (PIN: <strong>{u.pin}</strong>)
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={16} color="var(--primary-400)" />}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Masukkan PIN Akun ({selectedUser.name}):</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  maxLength={6}
                  className="form-input"
                  style={{ paddingLeft: '38px', letterSpacing: '0.2em', fontSize: '1.1rem' }}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="****"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: '#fb7185', fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => handleQuickLogin(selectedUser)}
              >
                Login Cepat Langsung
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Masuk
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
