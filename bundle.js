const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const SRC_DIR = path.join(__dirname, 'schema-src');
const MAIN_FILE = path.join(SRC_DIR, 'main.yaml');
const COMP_DIR = path.join(SRC_DIR, 'components');
const OUTPUT_FILE = path.join(__dirname, 'public/sample.yaml');

function bundle() {
  try {
    console.log('📦 Bundling schema files...');

    // 1. Load metadata/links from main.yaml
    if (!fs.existsSync(MAIN_FILE)) {
      console.error(`❌ File not found: ${MAIN_FILE}`);
      return;
    }
    const mainDoc = yaml.load(fs.readFileSync(MAIN_FILE, 'utf8')) || {};
    mainDoc.components = [];

    // 2. Load all components from the components folder
    if (fs.existsSync(COMP_DIR)) {
      const files = fs.readdirSync(COMP_DIR);
      let count = 0;
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(COMP_DIR, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const compDoc = yaml.load(content);
          if (compDoc) {
            mainDoc.components.push(compDoc);
            count++;
          }
        }
      }
      console.log(`✅ Loaded ${count} components from components/ folder.`);
    } else {
      console.warn(`⚠️ Components directory not found: ${COMP_DIR}`);
    }

    // 3. Write output file to public/sample.yaml
    const bundledYaml = yaml.dump(mainDoc, { noRefs: true, lineWidth: -1 });
    
    // Ensure output directory exists (public/)
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, bundledYaml, 'utf8');
    console.log(`🚀 Bundled schema successfully saved to: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ Error bundling schema:', err);
  }
}

bundle();
