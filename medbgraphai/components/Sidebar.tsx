'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Avatar,
} from '@mui/material';
import EmergencyIcon from '@mui/icons-material/Emergency';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { User } from '../services/auth';

interface SidebarProps {
  currentNav?: string;
  onSelectNav?: (nav: string) => void;
  user?: User | null;
  onLogout?: () => void;
  useRouter?: any;
}

export default function Sidebar({
  currentNav = 'Clinical Triage',
  onSelectNav,
  user,
  onLogout,
}: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { label: 'Clinical Triage', icon: <EmergencyIcon />, path: '/clinical-triage' },
    { label: 'Patient Discharge', icon: <AssignmentTurnedInOutlinedIcon />, path: '/patient' },
    { label: 'Doctor Admin', icon: <CloudUploadIcon />, path: '/doctor', doctorOnly: true },
  ];

  return (
    <Box
      component="aside"
      sx={{
        width: 240,
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}
        >
          <EmergencyIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.15rem',
              lineHeight: 1.1,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            MedGraph
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.68rem',
              color: '#0284c7',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Clinical AI
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <Box sx={{ px: 1.5, py: 1, flex: 1 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          {navItems
            .filter(item => !item.doctorOnly || user?.role === 'DOCTOR')
            .map((item) => {
            const isActive = currentNav === item.label;
            return (
              <ListItemButton
                key={item.label}
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  px: 1.5,
                  backgroundColor: isActive ? '#0077b6' : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                  '&:hover': {
                    backgroundColor: isActive ? '#0284c7' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#0f172a',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#ffffff' : '#64748b',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Footer item: EHR FHIR R4 Synchronized */}
      <Divider sx={{ borderColor: '#f1f5f9' }} />
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backgroundColor: '#ffffff',
        }}
      >
        <GppGoodOutlinedIcon sx={{ color: '#059669', fontSize: 22 }} />
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#0f172a',
              lineHeight: 1.2,
            }}
          >
            EHR FHIR R4
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#64748b',
              fontSize: '0.72rem',
            }}
          >
            Synchronized
          </Typography>
        </Box>
      </Box>

      {/* User Profile & Logout */}
      <Divider sx={{ borderColor: '#f1f5f9' }} />
      {user && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            backgroundColor: '#f8fafc',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0284c7' }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontSize: '0.7rem',
                }}
              >
                {user.role === 'DOCTOR' ? user.department : user.mrn}
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={onLogout}
            startIcon={<LogoutIcon />}
            size="small"
            sx={{
              color: '#64748b',
              justifyContent: 'flex-start',
              textTransform: 'none',
            }}
          >
            Logout
          </Button>
        </Box>
      )}
    </Box>
  );
}
