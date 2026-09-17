# Dataset Privacy & De-Identification Protocol — BPY-CSE-2666

## HIPAA Expert Determination & Safe Harbor Compliance
1. **Direct Identifiers Stripped**: Medical record numbers, names, telephone, and social security numbers are zeroed out before dataset formation.
2. **Age Aggregation**: Ages above 89 are binned to protect patient anonymity.
3. **No Direct PHI in ML Storage**: Raw datasets reside exclusively in encrypted PostgreSQL with role-based access controls.
