const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const code = fs.readFileSync('android/lib/src/main/res/raw/trust_min.js', 'utf8');
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`, { runScripts: 'dangerously' });
try {
  dom.window.eval(code);
  console.log('Successfully evaluated! trustwallet is', typeof dom.window.trustwallet);
} catch(e) {
  console.error('Error during evaluation:', e);
}
