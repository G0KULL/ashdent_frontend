import os
import re

directory = r"c:\Users\HP\OneDrive\Desktop\dental software\src\components"

def refactor_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. if (!window.confirm("...")) return;
    def repl_negative(match):
        msg = match.group(1)
        return f"const _c = await Swal.fire({{title: {msg}, icon: 'warning', showCancelButton: true}}); if (!_c.isConfirmed) return;"

    content = re.sub(r'if\s*\(\s*!window\.confirm\(([^)]+)\)\s*\)\s*return;?', repl_negative, content)
    content = re.sub(r'if\s*\(\s*!confirm\(([^)]+)\)\s*\)\s*return;?', repl_negative, content)

    # 2. if (window.confirm("...")) {
    def repl_positive(match):
        msg = match.group(1)
        return f"const _c = await Swal.fire({{title: {msg}, icon: 'warning', showCancelButton: true}}); if (_c.isConfirmed) {{"
    
    content = re.sub(r'if\s*\(\s*window\.confirm\(([^)]+)\)\s*\)\s*\{', repl_positive, content)
    content = re.sub(r'if\s*\(\s*confirm\(([^)]+)\)\s*\)\s*\{', repl_positive, content)
    
    # 3. const confirmClear = window.confirm("...");
    def repl_assign(match):
        var_name = match.group(1)
        msg = match.group(2)
        return f"const {var_name}_res = await Swal.fire({{title: {msg}, icon: 'warning', showCancelButton: true}}); const {var_name} = {var_name}_res.isConfirmed;"

    content = re.sub(r'const\s+([a-zA-Z0-9_]+)\s*=\s*window\.confirm\(([^)]+)\);?', repl_assign, content)
    content = re.sub(r'const\s+([a-zA-Z0-9_]+)\s*=\s*confirm\(([^)]+)\);?', repl_assign, content)

    # Add import Swal if replacements were made
    if content != original_content and "import Swal" not in content:
        imports_end = content.rfind("import ")
        if imports_end != -1:
            newline_pos = content.find("\n", imports_end)
            content = content[:newline_pos+1] + "import Swal from 'sweetalert2'\n" + content[newline_pos+1:]
        else:
            content = "import Swal from 'sweetalert2'\n" + content

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Refactored {os.path.basename(file_path)}")

for filename in os.listdir(directory):
    if filename.endswith(".jsx"):
        refactor_file(os.path.join(directory, filename))
