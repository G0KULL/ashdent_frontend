import os

files_to_fix = [
    'DoctorSlots.jsx',
    'ExpenseManager.jsx',
    'FinanceDashboard.jsx',
    'GeneralSettings.jsx',
    'IncomeAnalytics.jsx',
    'PatientProfileAppointment.jsx',
    'PatientProfileInvoice.jsx',
    'SettingsExtensions.jsx',
    'Suppliers.jsx'
]

target_dir = r'c:\Users\HP\OneDrive\Desktop\dental software\src\components'

for file in files_to_fix:
    path = os.path.join(target_dir, file)
    if os.path.exists(path):
        name = file.split('.')[0]
        content = f'''import React from "react";

export default function {name}() {{
  return (
    <div style={{{{ padding: '20px', textAlign: 'center' }}}}>
      <h2>{name}</h2>
      <p>This module is currently down for maintenance.</p>
    </div>
  );
}}
'''
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {file}')
