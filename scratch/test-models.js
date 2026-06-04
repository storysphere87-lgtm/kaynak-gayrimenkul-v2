async function testModels() {
  const key = 'AIzaSyDS7ct5hF6jsxv4a37Lz4ZoguwJw4oFvbI';
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.0-pro'
  ];
  const apiVersions = ['v1beta', 'v1'];

  for (const model of models) {
    for (const ver of apiVersions) {
      const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${key}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Ping" }] }]
          })
        });
        const status = response.status;
        const text = await response.text();
        console.log(`Model: ${model}, Version: ${ver} -> Status: ${status}`);
        if (response.ok) {
          console.log(`✅ SUCCESS! Output: ${text.substring(0, 150)}`);
        } else {
          console.log(`❌ FAILED: ${text.substring(0, 150)}`);
        }
      } catch (e) {
        console.log(`Error testing ${model} on ${ver}:`, e.message);
      }
    }
  }
}

testModels();
