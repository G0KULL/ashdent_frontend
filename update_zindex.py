import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.css') and file != 'Sidebar.module.css':
            fpath = os.path.join(root, file)
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Use negative lookbehind to avoid changing 10000 to 10100
            new_content = re.sub(r'z-index:\s*1000(?!0)', 'z-index: 1010', content)
            
            if new_content != content:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated z-index in {fpath}")

print("Done")
