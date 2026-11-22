import https from 'https';

https.get('https://www.gstatic.com/googlemapsplatform-agent-skills/index.json?client=antigravity', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const matches = list.filter(item => /map|place|store|locator/i.test(item.name));
    console.log(JSON.stringify(matches.map(m => ({ name: m.name, entrypoint: m.entrypoint })), null, 2));
  });
});
