console.log('=== HOLO CONVERTER ===');
console.log('Запускаю сервер...');

const http = require('http');
const fs = require('fs');
const path = require('path');

// путь к папке public
const PUBLIC_DIR = path.join(__dirname, 'public');
console.log('Папка public:', PUBLIC_DIR);

// Проверяем что папка существует
if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('ОШИБКА: Папка public не существует!');
    console.log('Создаю папку public...');
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Запускаем сервер
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    let filePath = PUBLIC_DIR + req.url;
    if (filePath.endsWith('/')) filePath += 'index.html';
    
    console.log('Ищу файл:', filePath);
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.log('Файл не найден:', error.message);
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <h1>404 - Файл не найден</h1>
                <p>Искали: ${req.url}</p>
                <p>Полный путь: ${filePath}</p>
                <p>Папка public: ${PUBLIC_DIR}</p>
                <hr>
                <p>Файлы в public:</p>
                <pre>${fs.readdirSync(PUBLIC_DIR).join('\n')}</pre>
            `);
        } else {
            res.writeHead(200);
            res.end(content);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║     СЕРВЕР ЗАПУЩЕН!                 ║
    ║     http://localhost:${PORT}          ║
    ║                                     ║
    ║     Папка: ${__dirname} ║
    ╚══════════════════════════════════════╝
    `);
    
    // Покажем что в папке
    console.log('Содержимое public:');
    try {
        const files = fs.readdirSync(PUBLIC_DIR);
        files.forEach(file => console.log('  - ' + file));
    } catch (err) {
        console.log('Не могу прочитать папку:', err.message);
    }
});