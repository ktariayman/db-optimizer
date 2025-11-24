const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');
const FILES = ['baseline.json', 'constrained.json', 'replica.json'];

function loadReport(filename) {
  try {
    const content = fs.readFileSync(path.join(REPORTS_DIR, filename), 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function formatNum(n, decimals = 2) {
  return n ? n.toFixed(decimals) : 'N/A';
}

console.log('--- Benchmark Comparison ---\n');

const data = FILES.map(file => {
  const report = loadReport(file);
  const name = file.replace('.json', '');
  
  if (!report) {
    return {
      Scenario: name,
      'Req/s': 'Missing',
      'Avg Latency (ms)': 'Missing',
      'P95 Latency (ms)': 'Missing'
    };
  }

  return {
    Scenario: name,
    'Req/s': formatNum(report.metrics.http_reqs.rate),
    'Avg Latency (ms)': formatNum(report.metrics.http_req_duration.avg),
    'P95 Latency (ms)': formatNum(report.metrics.http_req_duration['p(95)'])
  };
});

console.table(data);

console.log('\n----------------------------');
