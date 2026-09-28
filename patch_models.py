import re

path = 'backend/patients/models.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'credits', ", "").replace("'lab', ", "").replace("'credits',", "").replace("'lab',", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed from models.py")
