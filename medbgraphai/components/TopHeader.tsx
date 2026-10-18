'use client';

import React from 'react';
import {
  Box,
  Typography,
  Switch,
  Badge,
  IconButton,
  Avatar,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

interface TopHeaderProps {
  humanInTheLoop: boolean;
  onToggleHumanInTheLoop: (val: boolean) => void;
  backendOnline?: boolean;
}

export default function TopHeader({
  humanInTheLoop,
  onToggleHumanInTheLoop,
  backendOnline = true,
}: TopHeaderProps) {
  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        px: 3,
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
      }}
    >
      {/* Left badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* AMD ROCm Cloud pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            px: 1.5,
            py: 0.6,
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              boxShadow: '0 0 6px #38bdf8',
            }}
          />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            AMD ROCm Cloud: Gemma-4-31B-IT + DeepSeek-V4.1-Flash
          </Typography>
        </Box>

        {/* PII Privacy Anonymizer pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            px: 1.4,
            py: 0.5,
            borderRadius: '20px',
            fontSize: '0.74rem',
            fontWeight: 500,
          }}
        >
          <VerifiedUserOutlinedIcon sx={{ fontSize: 16, color: '#059669' }} />
          <Typography sx={{ fontSize: '0.74rem', color: '#047857' }}>
            PII Privacy Anonymizer:{' '}
            <Box component="span" sx={{ fontWeight: 700, color: '#065f46' }}>
              ACTIVE
            </Box>
          </Typography>
        </Box>

        {/* Live Backend Connection Indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            backgroundColor: backendOnline ? '#eff6ff' : '#fef2f2',
            border: `1px solid ${backendOnline ? '#bfdbfe' : '#fecaca'}`,
            color: backendOnline ? '#1d4ed8' : '#b91c1c',
            px: 1.2,
            py: 0.4,
            borderRadius: '20px',
            fontSize: '0.72rem',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: backendOnline ? '#10b981' : '#ef4444',
            }}
          />
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
            {backendOnline ? 'API Connected: 8000' : 'API Offline'}
          </Typography>
        </Box>
      </Box>

      {/* Right controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        {/* Human-in-the-Loop Mode Switch */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#475569',
            }}
          >
            Human-in-the-Loop Mode
          </Typography>
          <Switch
            checked={humanInTheLoop}
            onChange={(e) => onToggleHumanInTheLoop(e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#0077b6',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#0077b6',
              },
            }}
          />
        </Box>

        {/* Notifications */}
        <IconButton size="small" sx={{ color: '#64748b' }}>
          <Badge
            badgeContent={3}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 16,
                minWidth: 16,
              },
            }}
          >
            <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>

        {/* Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Avatar
            alt="Dr. Sarah Jenkins"
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120"
            sx={{ width: 34, height: 34, border: '2px solid #e2e8f0' }}
          />
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#0f172a',
                lineHeight: 1.1,
              }}
            >
              Dr. Sarah Jenkins, MD
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#64748b',
                fontSize: '0.7rem',
              }}
            >
              Cardiology Lead
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
