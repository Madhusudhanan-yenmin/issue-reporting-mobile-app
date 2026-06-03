const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, query);
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(query)) {
          console.log(`Found in: ${fullPath}`);
        }
      }
    }
  }
}

try {
  const targetDir = path.resolve(__dirname, 'node_modules/react-native-gesture-handler');
  console.log(`Searching in: ${targetDir}`);
  searchDir(targetDir, 'useIsomorphicLayoutEffect');
  console.log('Search finished.');
} catch (e) {
  console.error(e);
}
