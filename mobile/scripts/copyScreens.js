const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/app/start/volunteer');
const destDir = path.join(__dirname, '../src/app/start/user');

const filesToCopy = [
  '_layout.tsx',
  'selectLanguage.tsx',
  'specialnotice.tsx',
  'authScreens/_layout.tsx',
  'authScreens/CreateNewPassword.tsx',
  'authScreens/enterEmail.tsx',
  'authScreens/loginSuccessful.tsx',
  'authScreens/OTPVerification.tsx',
  'authScreens/registerSuccessful.tsx',
  'authScreens/ResetPassword.tsx',
  'authScreens/signIn.tsx',
  'authScreens/signupNlogin.tsx',
  'authScreens/signUp.tsx', // including this as signIn references it
];

function processFile(filePath) {
  const srcPath = path.join(srcDir, filePath);
  const destPath = path.join(destDir, filePath);

  if (!fs.existsSync(srcPath)) {
    console.log(`Source file does not exist: ${srcPath}`);
    return;
  }

  let content = fs.readFileSync(srcPath, 'utf8');

  // Replace references
  content = content.replace(/\/volunteer\//g, '/user/');
  content = content.replace(/\/start\/volunteer/g, '/start/user');
  content = content.replace(/setRole\('volunteer'\)/g, "setRole('user')");

  // specialnotice specific
content = content.replace(/\/user\/tabs\/home/g, '/user/(tabs)/home');
  const destFolder = path.dirname(destPath);
  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
  }

  fs.writeFileSync(destPath, content);
  console.log(`Created: ${destPath}`);
}

filesToCopy.forEach(processFile);
console.log('Done copying screens.');
