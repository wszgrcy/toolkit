import http from 'http';

const PORT = 18932;

const files: Record<string, { content: string; contentType: string }> = {
  '/': {
    content: 'Hello, this is the root directory of the test server.',
    contentType: 'text/plain; charset=utf-8',
  },
  '/assets/img/logo.svg': {
    content:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>',
    contentType: 'image/svg+xml',
  },
  '/b': {
    content: 'B'.repeat(500_000),
    contentType: 'text/plain; charset=utf-8',
  },
  '/c': {
    content: 'C'.repeat(10_000),
    contentType: 'text/plain; charset=utf-8',
  },
  '/README.md': {
    content:
      '# Test README\n\nThis is a test README file for download testing.\n',
    contentType: 'text/markdown; charset=utf-8',
  },
  '/ggml-vulkan.zip.001': {
    content: 'PART001' + 'A'.repeat(1000),
    contentType: 'application/octet-stream',
  },
  '/ggml-vulkan.zip.002': {
    content: 'PART002' + 'B'.repeat(1000),
    contentType: 'application/octet-stream',
  },
  '/ggml-vulkan.zip.003': {
    content: 'PART003' + 'C'.repeat(1000),
    contentType: 'application/octet-stream',
  },
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url!, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;

  // Slow streaming endpoint for signal test
  if (pathname === '/c') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': Buffer.byteLength(files['/c'].content),
    });
    const data = files['/c'].content;
    const chunkSize = 1024;
    let offset = 0;
    const stream = setInterval(() => {
      if (offset >= data.length) {
        clearInterval(stream);
        res.end();
      } else {
        res.write(data.slice(offset, offset + chunkSize));
        offset += chunkSize;
      }
    }, 50);
    return;
  }

  const file = files[pathname];
  if (file) {
    res.writeHead(200, {
      'Content-Type': file.contentType,
      'Content-Length': Buffer.byteLength(file.content),
    });
    res.end(file.content);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

export function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`Test server started on http://localhost:${PORT}`);
      resolve(PORT);
    });
    server.on('error', reject);
  });
}

export function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(() => resolve());
    server.on('error', reject);
  });
}
