'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Button } from '@mui/material';
import AuthModal from '../components/AuthModal';
import { authService, User } from '../services/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  useEffect(() => {
    const existingUser = authService.getUser();
    if (existingUser) {
      setUser(existingUser);
      // Redirect based on role
      if (existingUser.role === 'DOCTOR') {
        router.push('/clinical-triage');
      } else if (existingUser.role === 'PATIENT') {
        router.push('/patient');
      }
    }
  }, [router]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    // Redirect based on role
    if (authenticatedUser.role === 'DOCTOR') {
      router.push('/clinical-triage');
    } else if (authenticatedUser.role === 'PATIENT') {
      router.push('/patient');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          MedGraph AI
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Clinical Intelligence & Patient Safety Platform
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => setAuthModalOpen(true)}
          sx={{ mt: 4, px: 4, py: 1.5 }}
        >
          Login / Signup
        </Button>
      </Container>
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </Box>
  );
}
