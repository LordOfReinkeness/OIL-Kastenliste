export const config = {
  meeting: {
    defaultMeetingStartTime: { hour: 13,  minute: 15 },
    defaultExcuseDeadline:   { days: 0,   hours: 1,  minutes: 0 },
    defaultCheckInDeadline:  { days: 7,   hours: 0,  minutes: 0 },
    defaultLiveWindow:       { days: 0,   hours: 0,  minutes: 45 },
    defaultMaxRetries: 3,
  },
  ui: {
    // How long the "Kopieren" button shows a checkmark after copying
    copyFeedbackMs: 2000,
    debounceMs: 300,
    qrCodeSize: 240,
    liveScreenPopup: { width: 420, height: 600 },
  },
} as const;
