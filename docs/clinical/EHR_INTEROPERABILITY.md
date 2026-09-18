# EHR Interoperability & HL7 FHIR R4 Boundary — BPY-CSE-2666

## Architecture & Integration Boundary
The CDSS provides an interoperability adapter (`FHIRAdapter`) designed to map internal clinical entities to HL7 FHIR Release 4 standard resources.

## Supported FHIR Resources
1. **`Patient`:** Demographics, medical record number (`urn:oid:healthnova:mrn`), biological sex, birth date.
2. **`Observation`:** Vital signs mapped with standard LOINC codes:
   - Blood Pressure (LOINC `85354-9`)
   - Heart Rate (LOINC `8867-4`)
   - Oxygen Saturation (LOINC `2708-6`)
   - Blood Glucose (LOINC `2339-0`)
3. **`RiskAssessment`:** Inferences from the risk prediction engine mapped with algorithm version metadata, probabilities, and clinical disclaimers.

## Anti-Fabrication Invariant
The system does not establish fake or unauthenticated EHR socket connections. Development and validation utilize synthetic EHR datasets conforming to FHIR R4 JSON schemas.
