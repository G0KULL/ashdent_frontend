// ToothPaths.js
// Anatomically stylized, production-grade Odontogram SVG paths.
// All paths are designed on a 40x40 viewBox.

// MOLARS (Rounded, broad)
export const MOLAR_PATHS = {
  C: "M 15 15 L 25 15 L 25 25 L 15 25 Z",
  T: "M 6 8 Q 20 2 34 8 L 25 15 L 15 15 Z",
  B: "M 6 32 Q 20 38 34 32 L 25 25 L 15 25 Z",
  L: "M 6 8 Q 2 20 6 32 L 15 25 L 15 15 Z",
  R: "M 34 8 Q 38 20 34 32 L 25 25 L 25 15 Z"
};

// PREMOLARS (Oval, narrower)
export const PREMOLAR_PATHS = {
  C: "M 17 14 L 23 14 L 23 26 L 17 26 Z",
  T: "M 10 6 Q 20 0 30 6 L 23 14 L 17 14 Z",
  B: "M 10 34 Q 20 40 30 34 L 23 26 L 17 26 Z",
  L: "M 10 6 Q 6 20 10 34 L 17 26 L 17 14 Z",
  R: "M 30 6 Q 34 20 30 34 L 23 26 L 23 14 Z"
};

// CANINES (Pointed cuspid tip)
export const CANINE_PATHS = {
  C: "M 18 16 L 22 16 L 22 24 L 18 24 Z",
  T: "M 12 10 L 20 2 L 28 10 L 22 16 L 18 16 Z", 
  B: "M 12 30 Q 20 38 28 30 L 22 24 L 18 24 Z",
  L: "M 12 10 Q 8 20 12 30 L 18 24 L 18 16 Z",
  R: "M 28 10 Q 32 20 28 30 L 22 24 L 22 16 Z"
};

// INCISORS (Flat incisal edge, shovel-shaped)
export const INCISOR_PATHS = {
  C: "M 12 18 L 28 18 L 28 22 L 12 22 Z",
  T: "M 8 6 L 32 6 L 28 18 L 12 18 Z",
  B: "M 10 34 Q 20 40 30 34 L 28 22 L 12 22 Z",
  L: "M 8 6 Q 6 20 10 34 L 12 22 L 12 18 Z",
  R: "M 32 6 Q 34 20 30 34 L 28 22 L 28 18 Z"
};

// PRIMARY MOLARS (More bulbous and slightly smaller visually)
export const PRIMARY_MOLAR_PATHS = {
  C: "M 16 16 L 24 16 L 24 24 L 16 24 Z",
  T: "M 8 10 Q 20 6 32 10 L 24 16 L 16 16 Z",
  B: "M 8 30 Q 20 34 32 30 L 24 24 L 16 24 Z",
  L: "M 8 10 Q 4 20 8 30 L 16 24 L 16 16 Z",
  R: "M 32 10 Q 36 20 32 30 L 24 24 L 24 16 Z"
};

// PRIMARY ANTERIORS (Smaller canines/incisors)
export const PRIMARY_ANTERIOR_PATHS = {
  C: "M 14 18 L 26 18 L 26 22 L 14 22 Z",
  T: "M 10 8 L 30 8 L 26 18 L 14 18 Z",
  B: "M 12 32 Q 20 38 28 32 L 26 22 L 14 22 Z",
  L: "M 10 8 Q 8 20 12 32 L 14 22 L 14 18 Z",
  R: "M 30 8 Q 32 20 28 32 L 26 22 L 26 18 Z"
};



// FACIAL VIEWS - MAXILLARY (Roots UP)
export const FACIAL_MAX_MOLAR = {
  CROWN: "M 10 20 Q 20 18 30 20 L 28 32 Q 20 36 12 32 Z",
  ROOT: "M 10 20 Q 5 10 12 5 Q 16 12 18 18 Q 20 18 22 18 Q 24 12 28 5 Q 35 10 30 20 Z"
};
export const FACIAL_MAX_PREMOLAR = {
  CROWN: "M 12 20 Q 20 18 28 20 L 26 34 Q 20 38 14 34 Z",
  ROOT: "M 12 20 Q 12 5 18 2 Q 28 5 28 20 Z"
};
export const FACIAL_MAX_CANINE = {
  CROWN: "M 14 20 Q 20 18 26 20 L 22 36 Q 20 38 18 36 Z",
  ROOT: "M 14 20 Q 14 4 18 2 Q 22 2 26 20 Z"
};
export const FACIAL_MAX_INCISOR = {
  CROWN: "M 12 20 Q 20 18 28 20 L 26 38 L 14 38 Z",
  ROOT: "M 12 20 Q 14 4 18 2 Q 22 4 28 20 Z"
};

// FACIAL VIEWS - MANDIBULAR (Roots DOWN)
export const FACIAL_MAND_MOLAR = {
  CROWN: "M 10 20 Q 20 22 30 20 L 28 8 Q 20 4 12 8 Z",
  ROOT: "M 10 20 Q 5 30 12 35 Q 16 28 18 22 Q 20 22 22 22 Q 24 28 28 35 Q 35 30 30 20 Z"
};
export const FACIAL_MAND_PREMOLAR = {
  CROWN: "M 12 20 Q 20 22 28 20 L 26 6 Q 20 2 14 6 Z",
  ROOT: "M 12 20 Q 12 35 18 38 Q 28 35 28 20 Z"
};
export const FACIAL_MAND_CANINE = {
  CROWN: "M 14 20 Q 20 22 26 20 L 22 4 Q 20 2 18 4 Z",
  ROOT: "M 14 20 Q 14 36 18 38 Q 22 38 26 20 Z"
};
export const FACIAL_MAND_INCISOR = {
  CROWN: "M 12 20 Q 20 22 28 20 L 26 2 L 14 2 Z",
  ROOT: "M 12 20 Q 14 36 18 38 Q 22 36 28 20 Z"
};

// Helper to determine tooth category based on FDI number
export const getToothType = (num) => {
  const toothDigit = num % 10;
  const isPrimary = [5, 6, 7, 8].includes(Math.floor(num / 10));

  if (isPrimary) {
    if (toothDigit >= 4) return 'primary_molar';
    if (toothDigit === 3) return 'primary_canine';
    return 'primary_incisor';
  } else {
    if (toothDigit >= 6) return 'molar';
    if (toothDigit >= 4) return 'premolar';
    if (toothDigit === 3) return 'canine';
    return 'incisor';
  }
};

// Return paths and clinical surface mapping for a tooth
export const getToothConfig = (num, viewType = 'occlusal') => {
  const type = getToothType(num);
  const q = Math.floor(num / 10);
  const isUpper = [1, 2, 5, 6].includes(q);
  
  let paths;
  
  if (viewType === 'facial') {
    if (isUpper) {
      if (type.includes('molar')) paths = FACIAL_MAX_MOLAR;
      else if (type === 'premolar') paths = FACIAL_MAX_PREMOLAR;
      else if (type === 'canine') paths = FACIAL_MAX_CANINE;
      else paths = FACIAL_MAX_INCISOR;
    } else {
      if (type.includes('molar')) paths = FACIAL_MAND_MOLAR;
      else if (type === 'premolar') paths = FACIAL_MAND_PREMOLAR;
      else if (type === 'canine') paths = FACIAL_MAND_CANINE;
      else paths = FACIAL_MAND_INCISOR;
    }
  } else {
    // Occlusal paths
    if (type === 'molar') paths = MOLAR_PATHS;
    else if (type === 'premolar') paths = PREMOLAR_PATHS;
    else if (type === 'canine') paths = CANINE_PATHS;
    else if (type === 'incisor') paths = INCISOR_PATHS;
    else if (type === 'primary_molar') paths = PRIMARY_MOLAR_PATHS;
    else paths = PRIMARY_ANTERIOR_PATHS;
  }
  const isRight = [1, 4, 5, 8].includes(q);
  const isAnt = [1, 2, 3].includes(num % 10);
  
  const mapping = {};
  
  // Center is always O or I
  mapping[isAnt ? 'I' : 'O'] = 'C';

  // Upper
  if (isUpper) {
    mapping[isAnt ? 'F' : 'B'] = 'T'; // Buccal/Facial is Top
    mapping['L'] = 'B';               // Lingual/Palatal is Bottom
  } else {
    // Lower
    mapping['L'] = 'T';               // Lingual is Top
    mapping[isAnt ? 'F' : 'B'] = 'B'; // Buccal/Facial is Bottom
  }

  // Mesial / Distal depends on midline.
  // Midline is between 11/21, 41/31.
  // Right side (1, 4, 5, 8): Mesial is RIGHT side of the drawing (towards center), Distal is LEFT.
  if (isRight) {
    mapping['M'] = 'R';
    mapping['D'] = 'L';
  } else {
    // Left side (2, 3, 6, 7): Mesial is LEFT side of the drawing (towards center), Distal is RIGHT.
    mapping['M'] = 'L';
    mapping['D'] = 'R';
  }

  return { paths, mapping };
};
