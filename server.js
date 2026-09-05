const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Разрешаем принимать данные из форм
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Отдаём статические файлы (HTML, CSS, картинки) из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Загружаем базу данных учеников
let studentsData = {};
try {
    const dataPath = path.join(__dirname, 'data', 'students.json');
    studentsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('✅ База данных загружена. Ученики:', Object.keys(studentsData));
} catch (e) {
    console.error('❌ ОШИБКА: Не удалось загрузить students.json.');
    process.exit(1);
}

// Маршрут для входа
app.post('/login', (req, res) => {
    const { phone, password } = req.body;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    for (const key in studentsData) {
        const cleanKey = key.replace(/[^0-9+]/g, '');
        if (cleanKey === cleanPhone) {
            const s = studentsData[key];
            if (s.password !== password) {
                return res.status(401).json({ success: false, message: 'Неверный пароль' });
            }
            return res.json({
                success: true,
                key: key,
                student: {
                    tolk_link: s.tolk_link,
                    hw_link: s.hw_link,
                    video_link: s.video_link,
                    notes_link: s.notes_link,
                    review_link: s.review_link,
                    schedule_link: s.schedule_link,
                    schedule_html: s.schedule_html
                }
            });
        }
    }
    res.status(401).json({ success: false, message: 'Неверный номер' });
});

// Маршрут для получения данных ученика
app.get('/student/:key', (req, res) => {
    let key = req.params.key;
    
    // Если ключ начинается с %2B, заменяем на +
    if (key.startsWith('%2B')) {
        key = '+' + key.substring(3);
    }

    // Проверяем: с плюсом или без
    if (studentsData[key]) {
        const s = studentsData[key];
        return res.json({
            tolk_link: s.tolk_link,
            hw_link: s.hw_link,
            video_link: s.video_link,
            notes_link: s.notes_link,
            review_link: s.review_link,
            schedule_link: s.schedule_link,
            schedule_html: s.schedule_html
        });
    }
    
    // Если не нашли с плюсом, пробуем без плюса
    const keyWithoutPlus = key.startsWith('+') ? key.substring(1) : key;
    if (studentsData[keyWithoutPlus]) {
        const s = studentsData[keyWithoutPlus];
        return res.json({
            tolk_link: s.tolk_link,
            hw_link: s.hw_link,
            video_link: s.video_link,
            notes_link: s.notes_link,
            review_link: s.review_link,
            schedule_link: s.schedule_link,
            schedule_html: s.schedule_html
        });
    }

    console.log('❌ Ключ не найден:', key);
    res.redirect('/register.html');
});

// Настройка загрузки фото
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const phone = req.body.phone || 'unknown';
        cb(null, `${phone}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

app.post('/upload-hw', upload.single('homework_photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
    console.log(`📥 ДЗ от ${req.body.phone}: ${req.file.filename}`);
    res.json({ success: true, message: 'Фото отправлено!' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});