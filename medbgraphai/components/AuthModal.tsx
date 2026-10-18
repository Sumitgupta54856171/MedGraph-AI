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
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');
  const [signupMrn, setSignupMrn] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const credentials: LoginRequest = {
        email: loginEmail,
        password: loginPassword,
      };

      const user = await authService.login(credentials);
      authService.saveUser(user);
      onAuthSuccess(user);
      onClose();
      setLoginEmail('');
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
        password: signupPassword,
        role: roleTab,
        department: roleTab === 'DOCTOR' ? signupDepartment : undefined,
        mrn: roleTab === 'PATIENT' ? signupMrn : undefined,
      };

      const user = await authService.signup(data);
      authService.saveUser(user);
      onAuthSuccess(user);
      onClose();
      // Reset form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupDepartment('');
      setSignupMrn('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoDoctor = () => {
    setTabValue(0);
    setLoginEmail('sarah.jenkins@medgraph.ai');
    setLoginPassword('doctor123');
  };

  const fillDemoPatient = () => {
    setTabValue(0);
    setLoginEmail('m.reyes@patient.ai');
    setLoginPassword('patient123');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
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
              label="Email"
              type="email"
              fullWidth
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
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
          // Signup Form
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
              <Tabs
                value={roleTab}
                onChange={(e, v) => setRoleTab(v as 'DOCTOR' | 'PATIENT')}
                variant="fullWidth"
              >
                <Tab label="Doctor Portal" value="DOCTOR" />
                <Tab label="Patient Portal" value="PATIENT" />
              </Tabs>
            </Box>

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
              label="Password"
              type="password"
              fullWidth
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              disabled={loading}
            />

            {roleTab === 'DOCTOR' ? (
              <TextField
                label="Department"
                fullWidth
                placeholder="e.g., Cardiology, Nephrology"
                value={signupDepartment}
                onChange={(e) => setSignupDepartment(e.target.value)}
                disabled={loading}
              />
            ) : (
              <TextField
                label="MRN (Medical Record Number)"
                fullWidth
                placeholder="e.g., PT-8491"
                value={signupMrn}
                onChange={(e) => setSignupMrn(e.target.value)}
                disabled={loading}
              />
            )}
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
