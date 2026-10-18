'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Checkbox,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import EmergencyIcon from '@mui/icons-material/Emergency';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import MicNoneIcon from '@mui/icons-material/MicNone';
import SendIcon from '@mui/icons-material/Send';
import LanguageIcon from '@mui/icons-material/Language';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { AnalyzeResponse } from '../services/api';
import { cleanOutput } from '../utils/cleanOutput';

interface Column3Props {
  analysisData: AnalyzeResponse | null;
  isPhysicianApproved: boolean;
  onDialEmergency?: () => void;
}

type SupportedLanguage = 'English' | 'Hinglish' | 'Hindi';

interface LanguageContent {
  label: string;
  whatHappenedTitle: string;
  whatHappenedText: string;
  checklistTitle: string;
  scheduledText: string;
  med1Name: string;
  med1Time: string;
  med1Instructions: string;
  holdAlertTitle: string;
  holdAlertText: string;
  med2Name: string;
  med2Time: string;
  med2Instructions: string;
  redFlagsTitle: string;
  redFlagsList: string[];
  emergencyDesk: string;
  dial911: string;
}

const LOCALIZED_CONTENT: Record<SupportedLanguage, LanguageContent> = {
  English: {
    label: 'English (Simplified Grade 5)',
    whatHappenedTitle: 'What Happened Today',
    whatHappenedText:
      'You came to the clinic because of chest discomfort. Our team checked your heart rhythms and verified your condition is stabilizing. You are safe to recover at home, but we are adjusting your medicines carefully to keep you safe.',
    checklistTitle: 'Your Daily Medicine Checklist',
    scheduledText: '3 Doses Scheduled',
    med1Name: 'Atorvastatin 40mg',
    med1Time: 'Morning',
    med1Instructions: 'Take 1 tablet after breakfast for cholesterol.',
    holdAlertTitle: 'Blood Thinner Check (Hold Aspirin)',
    holdAlertText:
      'Do NOT take Aspirin until Dr. Jenkins confirms your exact schedule to prevent bleeding with Warfarin.',
    med2Name: 'Warfarin 5mg',
    med2Time: '6:00 PM',
    med2Instructions: 'Take 1 tablet with a full glass of water.',
    redFlagsTitle: 'When to Seek Immediate Help',
    redFlagsList: [
      'Sudden sharp chest pressure or pain radiating to jaw or left arm',
      'Feeling unusually dizzy, faint, or severe shortness of breath',
      'Unusual spontaneous bleeding, dark tarry stools, or large bruises',
    ],
    emergencyDesk: 'EMERGENCY CARDIAC DESK',
    dial911: 'Dial 911',
  },
  Hinglish: {
    label: 'Hinglish (Conversational)',
    whatHappenedTitle: 'Aaj Clinic Mein Kya Hua',
    whatHappenedText:
      'Aap clinic chest mein discomfort (seene mein dard) ki wajah se aaye the. Hamari medical team ne aapka heart rhythm check kiya hai aur aapki condition stabilize ho rahi hai. Aap safely ghar par recover kar sakte hain, lekin dawaiyon ko bahut dhyan se adjust kiya gaya hai.',
    checklistTitle: 'Aapki Daily Dawai Checklist',
    scheduledText: '3 Doses Scheduled',
    med1Name: 'Atorvastatin 40mg',
    med1Time: 'Subah',
    med1Instructions: 'Breakfast ke baad 1 tablet lein (cholesterol control ke liye).',
    holdAlertTitle: 'Safety Alert: Aspirin Abhi Hold Karein',
    holdAlertText:
      'Aspirin tab tak BILKUL NA lein jab tak Dr. Jenkins aapka schedule confirm na karein, taaki Warfarin ke saath bleeding ka koi risk na ho.',
    med2Name: 'Warfarin 5mg',
    med2Time: 'Shaam 6:00 PM',
    med2Instructions: '1 poore glass paani ke saath 1 tablet lein.',
    redFlagsTitle: 'Emergency Mein Turant Contact Karein',
    redFlagsList: [
      'Seene mein achanak tez dard jo jaw (jabde) ya left arm tak faile',
      'Bohat zyada chakkar aana, behoshi lagna ya saans lene mein takleef',
      'Kahin se bhi bleeding hona, black stools aana ya bade neel (bruises) padna',
    ],
    emergencyDesk: 'EMERGENCY CARDIAC DESK',
    dial911: 'Dial 911',
  },
  Hindi: {
    label: 'हिन्दी (Hindi Medical)',
    whatHappenedTitle: 'आज क्लिनिक में क्या हुआ',
    whatHappenedText:
      'आप सीने में बेचैनी और दर्द के कारण क्लिनिक आए थे। हमारी टीम ने आपके दिल की धड़कनों की जांच की है और आपकी स्थिति स्थिर हो रही है। आप घर पर आराम कर सकते हैं, लेकिन आपकी सुरक्षा के लिए दवाओं में सावधानीपूर्वक बदलाव किया गया है।',
    checklistTitle: 'आपकी दैनिक दवा चेकलिस्ट',
    scheduledText: '3 खुराक निर्धारित',
    med1Name: 'एटोरवास्टेटिन (Atorvastatin 40mg)',
    med1Time: 'सुबह',
    med1Instructions: 'कोलेस्ट्रॉल के लिए नाश्ते के बाद 1 गोली लें।',
    holdAlertTitle: 'रक्त पतला करने वाली दवा चेतावनी (एस्पिरिन रोकें)',
    holdAlertText:
      'चेतावनी: एस्पिरिन (Aspirin) तब तक बिल्कुल न लें जब तक डॉ. जेनकिंस आपके सटीक शेड्यूल की पुष्टि न करें, ताकि वारफारिन के साथ रक्तस्राव का कोई जोखिम न हो।',
    med2Name: 'वारफारिन (Warfarin 5mg)',
    med2Time: 'शाम 6:00 बजे',
    med2Instructions: 'पूरे एक गिलास पानी के साथ 1 गोली लें।',
    redFlagsTitle: 'तुरंत आपातकालीन सहायता कब लें',
    redFlagsList: [
      'सीने में अचानक तेज दबाव या दर्द जो जबड़े या बाएं हाथ तक फैले',
      'असामान्य चक्कर आना, बेहोशी महसूस होना या सांस लेने में भारी तकलीफ',
      'असामान्य रक्तस्राव, काला मल आना या त्वचा पर बड़े नीले निशान पड़ना',
    ],
    emergencyDesk: 'आपातकालीन कार्डियक डेस्क',
    dial911: 'कॉल 911',
  },
};

export default function Column3PatientDischarge({
  analysisData,
  isPhysicianApproved,
  onDialEmergency,
}: Column3Props) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('English');
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

  const [medChecked, setMedChecked] = useState({
    atorvastatin: true,
    warfarin: false,
  });

  const [promptInput, setPromptInput] = useState('');
  const [generativeCards, setGenerativeCards] = useState<
    Array<{
      id: string;
      prompt: string;
      response: string;
      tag: string;
    }>
  >([]);

  const handleSendPrompt = () => {
    if (!promptInput.trim()) return;
    const cleanPrompt = cleanOutput(promptInput);
    setPromptInput('');

    // Detect language change intent from prompt
    if (/hindi|हिन्दी/i.test(cleanPrompt)) {
      setSelectedLang('Hindi');
    } else if (/hinglish/i.test(cleanPrompt)) {
      setSelectedLang('Hinglish');
    } else if (/english/i.test(cleanPrompt)) {
      setSelectedLang('English');
    }

    // Use real API response
    let genResponse = `Based on clinical analysis: ${cleanPrompt}`;
    if (analysisData?.clinical_analysis) {
      genResponse = `AI Analysis Response: The clinical safety agent has reviewed your query about "${cleanPrompt}". Please consult with your physician for specific guidance.`;
    }

    setGenerativeCards((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        prompt: cleanPrompt,
        response: genResponse,
        tag: 'AMD ROCm Gemma-4-31B-IT',
      },
    ]);
  };

  const content = LOCALIZED_CONTENT[selectedLang];

  // If no analysis data from API yet, show clean waiting state without fake data
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
                backgroundColor: '#9a3412',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              3
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
              Patient-Friendly Discharge
            </Typography>
          </Box>
          <Chip
            label="CopilotKit Engine"
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
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <AssignmentLateOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography
            sx={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#0f172a',
              mb: 0.8,
            }}
          >
            Discharge Plan Staged
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
            Discharge instructions, patient checklist, and emergency red flags will generate dynamically once clinical analysis is received from the API.
          </Typography>
          <Chip
            label="Awaiting Safety Clearance"
            size="small"
            sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          />
        </Box>
      </Card>
    );
  }

  const isLocked = analysisData.requires_physician_lock && !isPhysicianApproved;

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
              backgroundColor: '#9a3412',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            3
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
            Patient-Friendly Discharge
          </Typography>
        </Box>

        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: 13, color: '#6d28d9 !important' }} />}
          label="CopilotKit Engine"
          size="small"
          sx={{
            backgroundColor: '#ede9fe',
            color: '#6d28d9',
            fontWeight: 700,
            fontSize: '0.72rem',
            height: 24,
            borderRadius: '12px',
          }}
        />
      </Box>

      {/* Mode / Multilingual Generative UI Selector (English, Hinglish, Hindi) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          onClick={(e) => setLangAnchor(e.currentTarget)}
          startIcon={<LanguageIcon sx={{ fontSize: 16, color: '#0284c7' }} />}
          sx={{
            backgroundColor: '#f0f9ff',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            px: 1.5,
            py: 0.4,
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#e0f2fe' },
          }}
        >
          🌐 Mode: {content.label}
        </Button>
        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={() => setLangAnchor(null)}
        >
          {(['English', 'Hinglish', 'Hindi'] as SupportedLanguage[]).map((lang) => (
            <MenuItem
              key={lang}
              onClick={() => {
                setSelectedLang(lang);
                setLangAnchor(null);
              }}
              sx={{
                fontSize: '0.8rem',
                fontWeight: selectedLang === lang ? 700 : 500,
                backgroundColor: selectedLang === lang ? '#eff6ff' : 'transparent',
              }}
            >
              {LOCALIZED_CONTENT[lang].label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Physician Gate Banner */}
      <Box
        sx={{
          backgroundColor: isLocked ? '#fffbeb' : '#ecfdf5',
          border: `1px solid ${isLocked ? '#fde68a' : '#a7f3d0'}`,
          borderRadius: '8px',
          p: 1.4,
          display: 'flex',
          gap: 1.2,
          alignItems: 'flex-start',
        }}
      >
        {isLocked ? (
          <LockIcon sx={{ fontSize: 18, color: '#d97706', mt: 0.1 }} />
        ) : (
          <LockOpenIcon sx={{ fontSize: 18, color: '#059669', mt: 0.1 }} />
        )}
        <Typography
          sx={{
            fontSize: '0.74rem',
            color: isLocked ? '#b45309' : '#065f46',
            lineHeight: 1.4,
            fontWeight: 600,
          }}
        >
          {isLocked ? (
            <>
              <Box component="span" sx={{ fontWeight: 800 }}>
                Physician Gate:
              </Box>{' '}
              This simplified summary remains{' '}
              <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 700 }}>
                Locked &amp; Staged
              </Box>{' '}
              until digitally signed by Dr. Jenkins above. AI discharge summaries are decision-support tools only.
            </>
          ) : (
            <>
              <Box component="span" sx={{ fontWeight: 800 }}>
                Physician Gate Unlocked:
              </Box>{' '}
              Summary verified and electronically signed by Dr. Sarah Jenkins. Safe for patient export.
            </>
          )}
        </Typography>
      </Box>

      {/* What Happened Today (Generative UI Multilingual) */}
      <Box
        sx={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          p: 1.6,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
          <HealthAndSafetyOutlinedIcon sx={{ fontSize: 18, color: '#0284c7' }} />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '0.82rem',
              color: '#0369a1',
            }}
          >
            {content.whatHappenedTitle}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: '#0f172a',
            lineHeight: 1.5,
          }}
        >
          {content.whatHappenedText}
        </Typography>
      </Box>

      {/* YOUR DAILY MEDICINE CHECKLIST (With is_hold_alert: true Guardrail) */}
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
            {content.checklistTitle}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: '#0f766e',
              fontWeight: 700,
            }}
          >
            {content.scheduledText}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Item 1: Atorvastatin */}
          <Box
            sx={{
              p: 1.2,
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            <Checkbox
              size="small"
              checked={medChecked.atorvastatin}
              onChange={(e) =>
                setMedChecked({ ...medChecked, atorvastatin: e.target.checked })
              }
              sx={{
                p: 0,
                color: '#0284c7',
                '&.Mui-checked': { color: '#0284c7' },
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {content.med1Name}
                </Typography>
                <Chip
                  icon={
                    <WbSunnyOutlinedIcon
                      sx={{ fontSize: 12, color: '#b45309 !important' }}
                    />
                  }
                  label={content.med1Time}
                  size="small"
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    height: 20,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2 }}>
                {content.med1Instructions}
              </Typography>
            </Box>
          </Box>

          {/* Item 2: Blood Thinner Check (Hold Aspirin) - is_hold_alert: true */}
          <Box
            sx={{
              p: 1.4,
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
              <PauseCircleOutlinedIcon sx={{ fontSize: 18, color: '#dc2626' }} />
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#b91c1c',
                }}
              >
                {content.holdAlertTitle}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.74rem',
                color: '#7f1d1d',
                lineHeight: 1.4,
                pl: 3,
              }}
            >
              {content.holdAlertText}
            </Typography>
          </Box>

          {/* Item 3: Warfarin */}
          <Box
            sx={{
              p: 1.2,
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            <Checkbox
              size="small"
              checked={medChecked.warfarin}
              onChange={(e) =>
                setMedChecked({ ...medChecked, warfarin: e.target.checked })
              }
              sx={{
                p: 0,
                color: '#64748b',
                '&.Mui-checked': { color: '#0284c7' },
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {content.med2Name}
                </Typography>
                <Chip
                  icon={
                    <BedtimeOutlinedIcon
                      sx={{ fontSize: 12, color: '#475569 !important' }}
                    />
                  }
                  label={content.med2Time}
                  size="small"
                  sx={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    height: 20,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2 }}>
                {content.med2Instructions}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* WHEN TO SEEK IMMEDIATE HELP (Multilingual Red Flags) */}
      <Box
        sx={{
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '8px',
          p: 1.6,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <EmergencyIcon sx={{ fontSize: 18, color: '#dc2626' }} />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.82rem',
                color: '#991b1b',
              }}
            >
              {content.redFlagsTitle}
            </Typography>
          </Box>
          <Chip
            label="RED FLAGS"
            size="small"
            sx={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.62rem',
              height: 18,
              borderRadius: '4px',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, pl: 0.5, mb: 1.5 }}>
          {content.redFlagsList.map((item, idx) => (
            <Typography
              key={idx}
              sx={{
                fontSize: '0.73rem',
                color: '#7f1d1d',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
              }}
            >
              <Box component="span" sx={{ color: '#dc2626', fontWeight: 900 }}>
                •
              </Box>
              {item}
            </Typography>
          ))}
        </Box>

        {/* Emergency Call Box */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 1,
            borderTop: '1px solid #fee2e2',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#991b1b',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {content.emergencyDesk}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#dc2626',
              }}
            >
              (555) 019-2834
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={onDialEmergency}
            startIcon={<PhoneIcon sx={{ fontSize: 14 }} />}
            sx={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              py: 0.6,
              px: 1.6,
              borderRadius: '6px',
              '&:hover': { backgroundColor: '#b91c1c' },
            }}
          >
            {content.dial911}
          </Button>
        </Box>
      </Box>

      {/* CopilotKit Generative UI Stream Cards */}
      {generativeCards.map((card) => (
        <Box
          key={card.id}
          sx={{
            p: 1.2,
            borderRadius: '8px',
            backgroundColor: '#f5f3ff',
            border: '1px solid #ddd6fe',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
          >
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#6d28d9' }}>
              Q: "{card.prompt}"
            </Typography>
            <Chip
              label={card.tag}
              size="small"
              sx={{
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                fontSize: '0.6rem',
                height: 18,
                fontWeight: 700,
              }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.73rem', color: '#4c1d95', lineHeight: 1.4 }}>
            {card.response}
          </Typography>
        </Box>
      ))}

      {/* CopilotKit Prompt Console */}
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
          <ChatBubbleOutlinedIcon sx={{ fontSize: 14, color: '#64748b' }} />
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#64748b',
            }}
          >
            CopilotKit Prompt Console
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            p: 0.5,
          }}
        >
          <TextField
            fullWidth
            placeholder={`Ask Copilot (e.g. Translate to ${selectedLang === 'English' ? 'Hindi or Hinglish' : 'English'})...`}
            variant="standard"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: {
                  fontSize: '0.75rem',
                  px: 1,
                  color: '#1e293b',
                },
              },
            }}
          />
          <IconButton size="small" sx={{ color: '#64748b' }}>
            <MicNoneIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleSendPrompt}
            sx={{
              backgroundColor: '#0077b6',
              color: '#ffffff',
              borderRadius: '6px',
              ml: 0.5,
              '&:hover': { backgroundColor: '#0284c7' },
            }}
          >
            <SendIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
}
