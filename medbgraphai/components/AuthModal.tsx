'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Tab,
  Tabs,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authService, LoginRequest, SignupRequest, User } from '../services/auth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export default function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const [tabValue, setTabValue] = useState(0); // 0 = Login, 1 = Signup
  const [roleTab, setRoleTab] = useState<'DOCTOR' | 'PATIENT'>('DOCTOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state (only for doctors)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');
  const [signupNote, setSignupNote] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const credentials: LoginRequest = {
        email: loginEmail || undefined,
        mobile: loginMobile || undefined,
        password: loginPassword,
      };

      const user = await authService.login(credentials);
      authService.saveUser(user);
      onAuthSuccess(user);
      onClose();
      setLoginEmail('');
      setLoginMobile('');
      setLoginPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const data: SignupRequest = {
        name: signupName,
        email: signupEmail,
        mobile: signupMobile,
        password: signupPassword,
        role: 'DOCTOR' as 'DOCTOR',
        department: signupDepartment,
        note: signupNote,
      };

      const user = await authService.signup(data);
      authService.saveUser(user);
      onAuthSuccess(user);
      onClose();
      // Reset form
      setSignupName('');
      setSignupEmail('');
      setSignupMobile('');
      setSignupPassword('');
      setSignupDepartment('');
      setSignupNote('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoDoctor = () => {
    setTabValue(0);
    setLoginEmail('sarah.jenkins@medgraph.ai');
    setLoginMobile('9876543210');
    setLoginPassword('doctor123');
  };

  const fillDemoPatient = () => {
    setTabValue(0);
    setLoginMobile('1234567890');
    setLoginPassword('1234567890');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          MedGraph AI Authentication
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Login" />
            <Tab label="Signup" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tabValue === 0 ? (
          // Login Form
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email (optional for patients)"
              type="email"
              fullWidth
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Mobile Number"
              fullWidth
              placeholder="10 digits"
              value={loginMobile}
              onChange={(e) => setLoginMobile(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={loading}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={fillDemoDoctor}
                disabled={loading}
              >
                Demo Doctor
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={fillDemoPatient}
                disabled={loading}
              >
                Demo Patient
              </Button>
            </Box>
          </Box>
        ) : (
          // Signup Form (Doctors only)
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Only doctors can signup. Patients are registered by doctors.
            </Alert>

            <TextField
              label="Full Name"
              fullWidth
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Mobile Number"
              fullWidth
              placeholder="10 digits"
              value={signupMobile}
              onChange={(e) => setSignupMobile(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Department"
              fullWidth
              placeholder="e.g., Cardiology, Nephrology"
              value={signupDepartment}
              onChange={(e) => setSignupDepartment(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Note / Reason"
              fullWidth
              multiline
              rows={2}
              placeholder="Add a note about your specialization or role"
              value={signupNote}
              onChange={(e) => setSignupNote(e.target.value)}
              disabled={loading}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={tabValue === 0 ? handleLogin : handleSignup}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : tabValue === 0 ? 'Login' : 'Signup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
