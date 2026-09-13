# Known Limitations

1. **Cleveland Cohort Demographic Bias:** Models trained on baseline clinical cohorts may show variance in patient sub-populations; clinical evaluation remains mandatory.
2. **EHR Direct Sync [PLANNED]:** Current release requires manual or API-based observation entry rather than native HL7/FHIR socket polling.
3. **Browser Compatibility:** WebSocket telemetry requires modern browsers supporting HTML5 WebSockets (Chrome 80+, Firefox 75+, Safari 14+, Edge 80+).
