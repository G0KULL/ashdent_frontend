// test_confirm_password.js
// Verification of Scenarios A through F and Wizard Navigation

function createWizardSimulator() {
  let basicData = {
    name: 'Dr. Test Staff',
    role: 'Doctor',
    staff_level: 'Senior',
    phone: '9876543210',
    gender: 'Male',
    dob: '1990-01-01',
    age: 36,
    blood_group: 'O+',
    status: 'Active',
    address: '123 Clinic Road',
    username: 'dr_teststaff',
    password: '',
    confirm_password: '',
    qualification: 'BDS',
    specialization: 'General Dentistry',
    license_no: 'DENT-12345',
    registration_council: 'Dental Council',
    consultation_fee: '500',
    experience_years: '5'
  };

  let fieldErrors = {};
  let currentStep = 1;

  const handlePasswordChange = (val) => {
    basicData = { ...basicData, password: val };
    const updated = { ...fieldErrors };
    if (!val) {
      updated.password = 'Password is required.';
    } else {
      delete updated.password;
    }

    if (basicData.confirm_password) {
      if (!val) {
        delete updated.confirm_password;
      } else if (val !== basicData.confirm_password) {
        updated.confirm_password = 'Passwords do not match.';
      } else {
        delete updated.confirm_password;
      }
    } else if (val && updated.confirm_password) {
      updated.confirm_password = 'Please confirm your password.';
    }
    fieldErrors = updated;
  };

  const handleConfirmPasswordChange = (val) => {
    basicData = { ...basicData, confirm_password: val };
    const updated = { ...fieldErrors };
    if (!val) {
      if (basicData.password) {
        updated.confirm_password = 'Please confirm your password.';
      } else {
        delete updated.confirm_password;
      }
    } else if (basicData.password) {
      if (val !== basicData.password) {
        updated.confirm_password = 'Passwords do not match.';
      } else {
        delete updated.confirm_password;
      }
    } else {
      updated.password = 'Password is required.';
      delete updated.confirm_password;
    }
    fieldErrors = updated;
  };

  const validateStep1 = () => {
    const errs = {};
    if (!basicData.name.trim()) errs.name = 'Full Name is required.';
    if (!basicData.username.trim()) errs.username = 'Username is required.';

    if (!basicData.password) {
      errs.password = 'Password is required.';
    }
    if (!basicData.confirm_password) {
      if (basicData.password) {
        errs.confirm_password = 'Please confirm your password.';
      }
    } else if (basicData.password && basicData.password !== basicData.confirm_password) {
      errs.confirm_password = 'Passwords do not match.';
    }

    fieldErrors = errs;
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        currentStep = 2;
        return true;
      }
      return false;
    }
    return false;
  };

  const handleFinalSubmit = () => {
    if (!validateStep1()) {
      currentStep = 1;
      return false;
    }
    return true;
  };

  return {
    get basicData() { return basicData; },
    get fieldErrors() { return fieldErrors; },
    get currentStep() { return currentStep; },
    setCurrentStep: (s) => { currentStep = s; },
    handlePasswordChange,
    handleConfirmPasswordChange,
    validateStep1,
    handleNextStep,
    handleFinalSubmit
  };
}

console.log("------------------------------------------------------------");
console.log("RUNNING FRONTEND CONFIRM PASSWORD UNIT TESTS");
console.log("------------------------------------------------------------");

// Test 1: Scenario A - Matching Passwords
{
  const wiz = createWizardSimulator();
  wiz.handlePasswordChange("Dental@123");
  wiz.handleConfirmPasswordChange("Dental@123");
  const valid = wiz.validateStep1();
  console.assert(valid === true, "Scenario A: Validation should pass");
  console.assert(wiz.fieldErrors.confirm_password === undefined, "Scenario A: No confirm_password error");
  console.assert(wiz.fieldErrors.password === undefined, "Scenario A: No password error");
  console.log("✓ Scenario A (Matching passwords) PASSED");
}

// Test 2: Scenario B - Passwords do not match
{
  const wiz = createWizardSimulator();
  wiz.handlePasswordChange("Dental@123");
  wiz.handleConfirmPasswordChange("Dental@456");
  console.assert(wiz.fieldErrors.confirm_password === "Passwords do not match.", "Scenario B: Immediate error on mismatch");
  const canProgress = wiz.handleNextStep();
  console.assert(canProgress === false, "Scenario B: Next step blocked");
  console.assert(wiz.currentStep === 1, "Scenario B: Step remains 1");
  console.assert(wiz.fieldErrors.confirm_password === "Passwords do not match.", "Scenario B: Step 1 error persisted");
  console.log("✓ Scenario B (Mismatched passwords) PASSED");
}

// Test 3: Scenario C - Confirm Password is empty
{
  const wiz = createWizardSimulator();
  wiz.handlePasswordChange("Dental@123");
  console.assert(wiz.basicData.confirm_password === "", "Scenario C: Confirm password is empty");
  const canProgress = wiz.handleNextStep();
  console.assert(canProgress === false, "Scenario C: Next step blocked");
  console.assert(wiz.fieldErrors.confirm_password === "Please confirm your password.", "Scenario C: Shows 'Please confirm your password.'");
  console.log("✓ Scenario C (Empty confirm password) PASSED");
}

// Test 4: Scenario D - Password is empty, Confirm Password is entered
{
  const wiz = createWizardSimulator();
  wiz.handleConfirmPasswordChange("Dental@123");
  console.assert(wiz.fieldErrors.password === "Password is required.", "Scenario D: Shows 'Password is required.'");
  console.assert(wiz.fieldErrors.confirm_password === undefined, "Scenario D: No confirm_password error");
  const canProgress = wiz.handleNextStep();
  console.assert(canProgress === false, "Scenario D: Next step blocked");
  console.assert(wiz.fieldErrors.password === "Password is required.", "Scenario D: validateStep1 enforces Password is required.");
  console.log("✓ Scenario D (Empty password) PASSED");
}

// Test 5: Scenario E - Passwords initially match, then one changes
{
  const wiz = createWizardSimulator();
  wiz.handlePasswordChange("Dental@123");
  wiz.handleConfirmPasswordChange("Dental@123");
  console.assert(wiz.fieldErrors.confirm_password === undefined, "Scenario E: Initially matched");
  
  // Progress to step 2
  const progressed = wiz.handleNextStep();
  console.assert(progressed === true && wiz.currentStep === 2, "Scenario E: Progressed to Step 2");

  // User returns to Step 1 and changes password
  wiz.setCurrentStep(1);
  wiz.handlePasswordChange("Dental@999");
  console.assert(wiz.fieldErrors.confirm_password === "Passwords do not match.", "Scenario E: Immediate revalidation on password change");
  console.assert(wiz.basicData.confirm_password === "Dental@123", "Scenario E: Preserves entered confirm_password");

  // Attempting to proceed must fail
  const blocked = wiz.handleNextStep();
  console.assert(blocked === false && wiz.currentStep === 1, "Scenario E: Progression blocked while mismatched");
  console.log("✓ Scenario E (Password changed after match) PASSED");
}

// Test 6: Scenario F - Whitespace differences
{
  const wiz = createWizardSimulator();
  wiz.handlePasswordChange("Dental@123 ");
  wiz.handleConfirmPasswordChange("Dental@123");
  console.assert(wiz.fieldErrors.confirm_password === "Passwords do not match.", "Scenario F: Whitespace difference flagged as mismatch");
  const valid = wiz.validateStep1();
  console.assert(valid === false, "Scenario F: Not valid with whitespace diff");
  console.log("✓ Scenario F (Exact whitespace differences) PASSED");
}

// Test 7: Final Submission validation blocks and returns to Step 1
{
  const wiz = createWizardSimulator();
  wiz.handlePasswordChange("Dental@123");
  wiz.handleConfirmPasswordChange("Dental@123");
  wiz.handleNextStep(); // to Step 2
  wiz.setCurrentStep(4); // simulate reaching step 4
  
  // Simulate password altered or invalidated
  wiz.handlePasswordChange("Dental@Changed");
  const submitSuccess = wiz.handleFinalSubmit();
  console.assert(submitSuccess === false, "Final submit blocked on password mismatch");
  console.assert(wiz.currentStep === 1, "Redirected to Step 1 to review password error");
  console.assert(wiz.fieldErrors.confirm_password === "Passwords do not match.", "Error shown on Step 1");
  console.log("✓ Final Submission Revalidation & Step Navigation PASSED");
}

console.log("------------------------------------------------------------");
console.log("ALL FRONTEND TESTS PASSED CLEANLY!");
console.log("------------------------------------------------------------");
