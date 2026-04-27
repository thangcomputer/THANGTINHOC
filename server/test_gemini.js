require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  console.log('API Key:', process.env.GEMINI_API_KEY?.slice(0, 10) + '...');
  
  // Try different model names
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash-latest'];
  
  for (const modelName of models) {
    try {
      console.log(`\nTrying: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "OK" in one word only');
      console.log(`✅ ${modelName} WORKS:`, result.response.text().trim());
      break;
    } catch (err) {
      console.log(`❌ ${modelName} FAILED:`, err.message.slice(0, 100));
    }
  }
}

test();
