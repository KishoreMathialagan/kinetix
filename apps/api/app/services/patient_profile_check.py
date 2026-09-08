PATIENT_REQUIRED_FIELDS = {
    "dob": "Date of birth",
    "gender": "Gender",
    "address": "Address",
    "emergency_contact": "Emergency contact name",
    "emergency_phone": "Emergency contact phone",
    "primary_concern": "Primary concern / reason for visit",
}


def check_patient_profile_complete(patient) -> tuple[bool, list[str]]:
    """Check if a patient profile has all required fields filled.
    
    Returns:
        (is_complete, list_of_missing_field_labels)
    """
    if patient is None:
        return False, list(PATIENT_REQUIRED_FIELDS.values())

    missing = []
    for field, label in PATIENT_REQUIRED_FIELDS.items():
        value = getattr(patient, field, None)
        if not value or (isinstance(value, str) and not value.strip()):
            missing.append(label)

    return len(missing) == 0, missing
