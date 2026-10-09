import os
import re

files = [
    'src/components/UserManagement.jsx',
    'src/components/StatsCards.jsx'
]

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Remove lines matching Labs or Credits (case-sensitive) or specific string literal 'credits' or 'lab'
        new_lines = []
        for line in lines:
            if re.search(r'import Labs from', line) or re.search(r'import Credits from', line):
                continue
            if re.search(r'path="lab"', line) or re.search(r'path="credits"', line):
                continue
            if re.search(r'id:\s*\'credits\'', line) or re.search(r'id:\s*\'lab\'', line):
                continue
            if re.search(r'Credits', line) and 'UserManagement' in fpath:
                continue
            if re.search(r'Lab Tests', line) and 'UserManagement' in fpath:
                continue
            if re.search(r'Total Credits', line) and 'StatsCards' in fpath:
                continue
            new_lines.append(line)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Processed {fpath}")
