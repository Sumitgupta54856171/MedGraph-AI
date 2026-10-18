'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { authService, User } from '../../services/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DoctorAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.role !== 'DOCTOR') {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/admin/ingest-data`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(response.data);
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctor/admin/stats`);
      setStats(response.data.knowledge_base_stats);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      fetchStats();
    }
  }, [user?.role]);

  if (!user || user.role !== 'DOCTOR') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          This page is only accessible to doctors. Please log in as a doctor.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Doctor Admin Portal
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Upload drug-drug interaction data (CSV or PDF) to update the knowledge base
      </Typography>

      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Knowledge Base Statistics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Medications: ${stats.medications}`} color="primary" />
              <Chip label={`Pathways: ${stats.biological_pathways}`} color="secondary" />
              <Chip label={`Risks: ${stats.clinical_risks}`} color="warning" />
              <Chip label={`Interactions: ${stats.drug_interactions}`} color="error" />
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Upload Data File
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Supported formats: CSV, PDF
          </Typography>

          <Box
            sx={{
              border: '2px dashed #cbd5e1',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              mt: 2,
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#0284c7',
                backgroundColor: '#f0f9ff',
              },
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: '#64748b', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {file ? file.name : 'Click to select file or drag and drop'}
            </Typography>
            <input
              id="file-input"
              type="file"
              accept=".csv,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUpload}
              disabled={!file || uploading}
              sx={{ flex: 1 }}
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload & Ingest'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError('');
              }}
              disabled={uploading}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon />
            <Typography variant="body1" fontWeight="bold">
              {result.message}
            </Typography>
          </Box>
          {result.pipeline_result && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Entities processed: {result.pipeline_result.total_entities}
              </Typography>
              <Typography variant="body2">
                Nodes created: {result.pipeline_result.agent2_output.telemetry.nodes_created}
              </Typography>
              <Typography variant="body2">
                Relationships created: {result.pipeline_result.agent2_output.telemetry.relationships_created}
              </Typography>
            </Box>
          )}
        </Alert>
      )}
    </Container>
  );
}
