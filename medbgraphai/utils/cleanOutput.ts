/**
 * Utilities to filter and clean raw LLM output, removing **, ##, and markdown symbols
 */

export function cleanOutput(text: string): string {
  if (!text) return '';

  return text
    // Remove markdown headers (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic markers (**, *, __, _)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove inline backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove stray asterisks and hashes
    .replace(/\*{2,}/g, '')
    .replace(/#{2,}/g, '')
    // Format bullets neatly
    .replace(/^\s*[-*]\s+/gm, '• ')
    // Normalize consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface ParsedAnalysis {
  cleanFullText: string;
  warning: string;
  mechanism: string;
  recommendedActions: string[];
  severity: string;
}

export function parseClinicalAnalysis(rawText: string): ParsedAnalysis {
  if (!rawText) {
    return {
      cleanFullText: '',
      warning: '',
      mechanism: '',
      recommendedActions: [],
      severity: 'NORMAL',
    };
  }

  const cleanFull = cleanOutput(rawText);

  // Extract warning
  let warning = '';
  const warningMatch = cleanFull.match(/(?:HIGH-PRIORITY SAFETY WARNING|CONTRAINDICATION DETECTED:?)\s*([\s\S]*?)(?=(?:\d+\.\s+[A-Z]|RECOMMENDED ACTIONS|RISK ASSESSMENT|$))/i);
  if (warningMatch && warningMatch[1]) {
    warning = warningMatch[1].replace(/CONTRAINDICATION DETECTED:?/i, '').trim();
  }

  // Extract mechanism / clinical concern
  let mechanism = '';
  const mechanismMatch = cleanFull.match(/(?:Mechanism of Risk:|Combined Effect:|Clinical Concern:)\s*([\s\S]*?)(?=(?:\d+\.\s+[A-Z]|RECOMMENDED ACTIONS|Disclaimer|$))/i);
  if (mechanismMatch && mechanismMatch[1]) {
    mechanism = mechanismMatch[1].trim();
  }

  // Extract recommended actions
  const recommendedActions: string[] = [];
  const actionsMatch = cleanFull.match(/(?:RECOMMENDED ACTIONS:?)\s*([\s\S]*?)(?=(?:Disclaimer|---|$))/i);
  if (actionsMatch && actionsMatch[1]) {
    const lines = actionsMatch[1].split('\n');
    for (const line of lines) {
      const cleanLine = line.replace(/^\s*(?:\d+\.|\*|•)\s*/, '').trim();
      if (cleanLine && cleanLine.length > 5) {
        recommendedActions.push(cleanLine);
      }
    }
  }

  // Detect severity
  let severity = 'CRITICAL';
  if (/CRITICAL/i.test(cleanFull)) {
    severity = 'CRITICAL';
  } else if (/HIGH/i.test(cleanFull)) {
    severity = 'HIGH';
  } else if (/MODERATE/i.test(cleanFull)) {
    severity = 'MODERATE';
  }

  return {
    cleanFullText: cleanFull,
    warning: warning || cleanFull.slice(0, 200),
    mechanism,
    recommendedActions,
    severity,
  };
}
