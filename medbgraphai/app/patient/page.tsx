'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { authService, User } from '../../services/auth';

interface PatientHistory {
  patient_mrn: string;
  postgresql_encounters: Array<{
    id: string;
    patient_mrn: string;
    doctor_name: string;
    raw_notes: string;
    sanitized_notes: string | null;
    clinical_analysis: string | null;
    status: string;
    approved_by: number | null;
    updated_at: string;
  }>;
  falkordb_episodic_memory: Array<{
    encounter_id: string;
    action: string;
    timestamp: string;
    notes: string;
    doctor_name: string;
  }>;
}

export default function PatientPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.role === 'PATIENT') {
        fetchPatientHistory(currentUser.mrn);
      }
    }
  }, []);

  const fetchPatientHistory = async (mrn: string) => {
    if (!mrn) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/encounter/patient/${mrn}/history`
      );
      setPatientHistory(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch patient history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!user || user.role !== 'PATIENT') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          This page is only accessible to patients. Please log in as a patient.
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const latestEncounter = patientHistory?.postgresql_encounters[0];
  const isApproved = latestEncounter?.status === 'APPROVED_UNLOCKED';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Patient Discharge Companion
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome, {user.name} (MRN: {user.mrn})
      </Typography>

      {!isApproved && latestEncounter ? (
        <Alert severity="warning" icon={<LockIcon />} sx={{ mt: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Physician Gate: Locked & Staged
          </Typography>
          <Typography variant="body2">
            Your discharge summary is awaiting digital signature from your physician.
            Please check back once your physician has reviewed and approved the clinical summary.
          </Typography>
        </Alert>
      ) : isApproved ? (
        <Alert severity="success" icon={<LockOpenIcon />} sx={{ mt: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Discharge Summary Approved & Unlocked
          </Typography>
          <Typography variant="body2">
            Your physician has reviewed and approved your discharge summary.
            You can now view your medication checklist and safe alternatives.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
          <Typography variant="body2">
            No discharge summaries available yet. Your physician will create one after your consultation.
          </Typography>
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Encounter History
        </Typography>
        {patientHistory?.postgresql_encounters.map((encounter) => (
          <Card key={encounter.id} sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {encounter.id}
              </Typography>
              <Chip
                icon={encounter.status === 'APPROVED_UNLOCKED' ? <CheckCircleIcon /> : <LockIcon />}
                label={encounter.status === 'APPROVED_UNLOCKED' ? 'Approved' : 'Pending Review'}
                color={encounter.status === 'APPROVED_UNLOCKED' ? 'success' : 'warning'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Doctor:</strong> {encounter.doctor_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Date:</strong> {new Date(encounter.updated_at).toLocaleString()}
            </Typography>
            {encounter.status === 'APPROVED_UNLOCKED' && encounter.clinical_analysis && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Clinical Analysis:</strong>
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {encounter.clinical_analysis}
                </Typography>
              </Box>
            )}
          </Card>
        ))}
      </Box>
    </Container>
  );
}
