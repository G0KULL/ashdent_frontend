const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\HP\\OneDrive\\Desktop\\dental software\\src';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walk(dirPath, callback);
        } else if (dirPath.endsWith('.jsx') || dirPath.endsWith('.js')) {
            callback(dirPath);
        }
    });
}

let replacedFiles = 0;
walk(dir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    const regex = /new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g;
    if (regex.test(content)) {
        content = content.replace(regex, "(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]");
        fs.writeFileSync(filePath, content, 'utf-8');
        replacedFiles++;
        console.log('Fixed', filePath);
    }
});
console.log(`Replaced in ${replacedFiles} files`);
