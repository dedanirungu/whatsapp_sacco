const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// Read the input CSS file
const inputFile = path.resolve(__dirname, 'frontend/src/css/input.css');
const outputFile = path.resolve(__dirname, 'frontend/dist/styles.css');

// Ensure the output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the CSS content
const css = fs.readFileSync(inputFile, 'utf8');

// Process the CSS with Tailwind and autoprefixer
postcss([
  tailwind(require('./tailwind.config.js')),
  autoprefixer
])
  .process(css, { 
    from: inputFile, 
    to: outputFile 
  })
  .then(result => {
    // Write the processed CSS to the output file
    fs.writeFileSync(outputFile, result.css);
    console.log('CSS built successfully!');
  })
  .catch(error => {
    console.error('Error building CSS:', error);
  });