'use client';

import React from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { AnalyzeResponse } from '../services/api';

interface Column2Props {
  analysisData: AnalyzeResponse | null;
  isPhysicianApproved: boolean;
  isDoctor: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  onViewDeepDive?: () => void;
}

export default function Column2SafetyGate({
  analysisData,
  isPhysicianApproved,
  isDoctor,
  onApprove,
  onEdit,
  onReject,
  onViewDeepDive,
}: Column2Props) {
  // If no API data yet, show clean awaiting state without any fake data
  if (!analysisData) {
    return (
      <Card
        sx={{
          p: 2.5,
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100%',
          justifyContent: 'flex-start',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              2
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1.02rem',
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}
            >
              Clinical Extraction &amp; Safety Gate
            </Typography>
          </Box>
          <Chip
            label="• AMD ROCm Gemma-4-31B-IT"
            size="small"
            sx={{
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 24,
              borderRadius: '12px',
            }}
          />
        </Box>

        {/* Empty state container */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3,
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            minHeight: 380,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#0f172a',
              mb: 0.8,
            }}
          >
            Awaiting Clinical Analysis
          </Typography>
          <Typography
            sx={{
              fontSize: '0.76rem',
              color: '#64748b',
              maxWidth: 320,
              lineHeight: 1.5,
              mb: 2,
            }}
          >
            Click <Box component="span" sx={{ fontWeight: 700, color: '#004e7c' }}>"Run Multi-Model AMD Analysis"</Box> on the left to execute the live FalkorDB Knowledge Graph traversal and AMD ROCm Cloud (Gemma-4-31B-IT) clinical verification.
          </Typography>
        </Box>
      </Card>
    );
  }

  // Check graph paths from real API response
  const hasLiveRisk =
    analysisData.graph_paths && analysisData.graph_paths.length > 0;
  const firstPath = hasLiveRisk ? analysisData.graph_paths[0] : null;
  const isHighRisk = analysisData.requires_physician_lock || firstPath?.severity === 'CRITICAL';

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            2
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.02rem',
              color: '#0f172a',
              letterSpacing: '-0.01em',
            }}
          >
            Clinical Extraction &amp; Safety Gate
          </Typography>
        </Box>

        <Chip
          label="• AMD ROCm Gemma-4-31B-IT"
          size="small"
          sx={{
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            fontWeight: 700,
            fontSize: '0.72rem',
            height: 24,
            borderRadius: '12px',
          }}
        />
      </Box>

      {/* High-Risk Alert Box */}
      <Box
        sx={{
          backgroundColor: isHighRisk ? '#fff1f2' : '#f0fdf4',
          border: `1px solid ${isHighRisk ? '#fecdd3' : '#bbf7d0'}`,
          borderRadius: '8px',
          p: 1.8,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningAmberIcon
            sx={{
              fontSize: 20,
              color: isHighRisk ? '#dc2626' : '#16a34a',
            }}
          />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '0.86rem',
              color: isHighRisk ? '#b91c1c' : '#15803d',
            }}
          >
            {isHighRisk
              ? 'High-Risk Flag: Human Review Required'
              : 'Safety Gate: Verified Low Risk'}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.8rem',
            color: isHighRisk ? '#991b1b' : '#166534',
            mb: 0.5,
          }}
        >
          {firstPath?.risk || 'Drug-Drug Interaction Analysis'}:
        </Typography>

        <Typography
          sx={{
            fontSize: '0.75rem',
            color: isHighRisk ? '#7f1d1d' : '#1e293b',
            lineHeight: 1.45,
            mb: 1.5,
          }}
        >
          {firstPath?.path || 'Concurrent prescription analysis complete.'}
        </Typography>

        {/* Live Graph Reasoning Pathway from FalkorDB */}
        {firstPath?.path && (
          <Box
            onClick={onViewDeepDive}
            sx={{
              backgroundColor: '#ffffff',
              border: '1px dashed #f87171',
              borderRadius: '6px',
              p: 1,
              mb: 1.5,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#fff5f5' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#b91c1c',
                  textTransform: 'uppercase',
                }}
              >
                ⚡ Live FalkorDB Multi-Hop Graph Traversal:
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: '#0284c7',
                  fontWeight: 600,
                }}
              >
                View Full Trace
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                color: '#7f1d1d',
                mt: 0.3,
                wordBreak: 'break-word',
              }}
            >
              {firstPath.path}
            </Typography>
          </Box>
        )}
      </Box>

      {/* EXTRACTED CONDITIONS */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.04em',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
            }}
          >
            Extracted Conditions
          </Typography>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            {analysisData.extracted_entities?.conditions?.length || 0} found
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {analysisData.extracted_entities?.conditions?.map((condition: string, index: number) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <CheckCircleOutlinedIcon
                  sx={{ fontSize: 18, color: '#10b981' }}
                />
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {condition}
                </Typography>
              </Box>
              <Chip
                label="Extracted"
                size="small"
                sx={{
                  backgroundColor: '#ccfbf1',
                  color: '#0f766e',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  height: 22,
                  borderRadius: '6px',
                }}
              />
            </Box>
          ))}
          {(!analysisData.extracted_entities?.conditions || analysisData.extracted_entities.conditions.length === 0) && (
            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              No conditions extracted from clinical notes
            </Typography>
          )}
        </Box>
      </Box>

      {/* MEDICATION RECONCILIATION */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.04em',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
            }}
          >
            Medication Reconciliation
          </Typography>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            {analysisData.extracted_entities?.medications?.length || 0} found
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    px: 0.5,
                    py: 0.5,
                  }}
                >
                  Medication
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    px: 0.5,
                    py: 0.5,
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    px: 0.5,
                    py: 0.5,
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysisData.extracted_entities?.medications?.map((med: string, index: number) => (
                <TableRow key={index} sx={{ '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                  <TableCell sx={{ px: 0.5, py: 0.8 }}>
                    <Typography
                      sx={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {med}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Prescribed
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: 0.5, py: 0.8, fontSize: '0.72rem', color: '#475569' }}>
                    Active
                  </TableCell>
                  <TableCell align="right" sx={{ px: 0.5, py: 0.8 }}>
                    <Chip
                      icon={<CheckIcon sx={{ fontSize: 13, color: '#ffffff !important' }} />}
                      label="EXTRACTED"
                      size="small"
                      sx={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!analysisData.extracted_entities?.medications || analysisData.extracted_entities.medications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ px: 0.5, py: 0.8 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No medications extracted from clinical notes
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Physician Approval Buttons */}
      {isDoctor && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            onClick={onApprove}
            disabled={isPhysicianApproved}
            sx={{
              flex: 1,
              backgroundColor: isPhysicianApproved ? '#16a34a' : '#004e7c',
              '&:hover': {
                backgroundColor: isPhysicianApproved ? '#15803d' : '#003c5e',
              },
            }}
          >
            {isPhysicianApproved ? '✓ Approved' : 'Approve & Sign-Off'}
          </Button>
          <Button
            variant="outlined"
            onClick={onEdit}
            sx={{ flex: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            onClick={onReject}
            color="error"
            sx={{ flex: 1 }}
          >
            Reject
          </Button>
        </Box>
      )}
    </Card>
  );
}
