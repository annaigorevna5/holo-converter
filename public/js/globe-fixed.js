console.log('🌍 ЗАПУСК ГЛОБУСА С МАРКЕРАМИ-ФЛАГАМИ');

let scene, camera, renderer, controls, globe;
let markers = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let hoveredMarker = null;
let infoTooltip = null;
let selectedMarker = null;
let isUserInteracting = false;
let hoverTimeout = null;
let tooltipVisible = false;

// Цвета флагов для маркеров
const flagColors = {
    'USD': 0xff0000, // США - красный
    'CAD': 0xff0000, // Канада - красный
    'MXN': 0x006847, // Мексика - зеленый
    'BRL': 0x009c3b, // Бразилия - зеленый
    'ARS': 0x75aadb, // Аргентина - голубой
    'CLP': 0xd52b1e, // Чили - красный
    'EUR': 0x003399, // Еврозона - синий
    'GBP': 0xc8102e, // Великобритания - красный
    'CHF': 0xff0000, // Швейцария - красный
    'RUB': 0xffffff, // Россия - белый
    'SEK': 0x006aa7, // Швеция - синий
    'NOK': 0xef2b2d, // Норвегия - красный
    'DKK': 0xc60c30, // Дания - красный
    'PLN': 0xdc143c, // Польша - красный
    'CZK': 0x11457e, // Чехия - синий
    'HUF': 0x436f4d, // Венгрия - зеленый
    'JPY': 0xbc002d, // Япония - красный
    'CNY': 0xde2910, // Китай - красный
    'INR': 0xff9933, // Индия - оранжевый
    'KRW': 0x003478, // Корея - синий
    'SGD': 0xed2939, // Сингапур - красный
    'AED': 0x009639, // ОАЭ - зеленый
    'THB': 0xa51931, // Таиланд - красный
    'TRY': 0xe30a17, // Турция - красный
    'IDR': 0xff0000, // Индонезия - красный
    'AUD': 0x00008b, // Австралия - синий
    'NZD': 0x00247d, // Новая Зеландия - синий
    'ZAR': 0x007a4d, // ЮАР - зеленый
    'EGP': 0xce1126, // Египет - красный
    'NGN': 0x008751, // Нигерия - зеленый
    'KZT': 0x00afca, // Казахстан - голубой
    'UAH': 0x0057b7, // Украина - синий
    'BYN': 0xce1700  // Беларусь - красный
};

// Список валют с координатами столиц
const currencyData = [
    // Северная Америка
    { code: 'USD', lat: 38.8977, lng: -77.0365, flag: '🇺🇸', country: 'USA', name: 'US Dollar', city: 'Washington DC', region: 'North America' },
    { code: 'CAD', lat: 45.4215, lng: -75.6972, flag: '🇨🇦', country: 'Canada', name: 'Canadian Dollar', city: 'Ottawa', region: 'North America' },
    { code: 'MXN', lat: 19.4326, lng: -99.1332, flag: '🇲🇽', country: 'Mexico', name: 'Mexican Peso', city: 'Mexico City', region: 'North America' },
    
    // Южная Америка
    { code: 'BRL', lat: -15.8267, lng: -47.9218, flag: '🇧🇷', country: 'Brazil', name: 'Brazilian Real', city: 'Brasilia', region: 'South America' },
    { code: 'ARS', lat: -34.6037, lng: -58.3816, flag: '🇦🇷', country: 'Argentina', name: 'Argentine Peso', city: 'Buenos Aires', region: 'South America' },
    { code: 'CLP', lat: -33.4489, lng: -70.6693, flag: '🇨🇱', country: 'Chile', name: 'Chilean Peso', city: 'Santiago', region: 'South America' },
    
    // Европа
    { code: 'EUR', lat: 52.5200, lng: 13.4050, flag: '🇪🇺', country: 'Euro Zone', name: 'Euro', city: 'Berlin', region: 'Europe' },
    { code: 'GBP', lat: 51.5074, lng: -0.1278, flag: '🇬🇧', country: 'UK', name: 'British Pound', city: 'London', region: 'Europe' },
    { code: 'CHF', lat: 46.9480, lng: 7.4474, flag: '🇨🇭', country: 'Switzerland', name: 'Swiss Franc', city: 'Bern', region: 'Europe' },
    { code: 'RUB', lat: 55.7558, lng: 37.6173, flag: '🇷🇺', country: 'Russia', name: 'Russian Ruble', city: 'Moscow', region: 'Europe' },
    { code: 'SEK', lat: 59.3293, lng: 18.0686, flag: '🇸🇪', country: 'Sweden', name: 'Swedish Krona', city: 'Stockholm', region: 'Europe' },
    { code: 'NOK', lat: 59.9139, lng: 10.7522, flag: '🇳🇴', country: 'Norway', name: 'Norwegian Krone', city: 'Oslo', region: 'Europe' },
    { code: 'DKK', lat: 55.6761, lng: 12.5683, flag: '🇩🇰', country: 'Denmark', name: 'Danish Krone', city: 'Copenhagen', region: 'Europe' },
    { code: 'PLN', lat: 52.2297, lng: 21.0122, flag: '🇵🇱', country: 'Poland', name: 'Polish Złoty', city: 'Warsaw', region: 'Europe' },
    { code: 'CZK', lat: 50.0755, lng: 14.4378, flag: '🇨🇿', country: 'Czech Republic', name: 'Czech Koruna', city: 'Prague', region: 'Europe' },
    { code: 'HUF', lat: 47.4979, lng: 19.0402, flag: '🇭🇺', country: 'Hungary', name: 'Hungarian Forint', city: 'Budapest', region: 'Europe' },
    
    // Азия
    { code: 'JPY', lat: 35.6762, lng: 139.6503, flag: '🇯🇵', country: 'Japan', name: 'Japanese Yen', city: 'Tokyo', region: 'Asia' },
    { code: 'CNY', lat: 39.9042, lng: 116.4074, flag: '🇨🇳', country: 'China', name: 'Chinese Yuan', city: 'Beijing', region: 'Asia' },
    { code: 'INR', lat: 28.6139, lng: 77.2090, flag: '🇮🇳', country: 'India', name: 'Indian Rupee', city: 'New Delhi', region: 'Asia' },
    { code: 'KRW', lat: 37.5665, lng: 126.9780, flag: '🇰🇷', country: 'South Korea', name: 'Korean Won', city: 'Seoul', region: 'Asia' },
    { code: 'SGD', lat: 1.3521, lng: 103.8198, flag: '🇸🇬', country: 'Singapore', name: 'Singapore Dollar', city: 'Singapore', region: 'Asia' },
    { code: 'AED', lat: 24.4539, lng: 54.3773, flag: '🇦🇪', country: 'UAE', name: 'UAE Dirham', city: 'Abu Dhabi', region: 'Asia' },
    { code: 'THB', lat: 13.7563, lng: 100.5018, flag: '🇹🇭', country: 'Thailand', name: 'Thai Baht', city: 'Bangkok', region: 'Asia' },
    { code: 'TRY', lat: 39.9334, lng: 32.8597, flag: '🇹🇷', country: 'Turkey', name: 'Turkish Lira', city: 'Ankara', region: 'Asia' },
    { code: 'IDR', lat: -6.2088, lng: 106.8456, flag: '🇮🇩', country: 'Indonesia', name: 'Indonesian Rupiah', city: 'Jakarta', region: 'Asia' },
    
    // Океания
    { code: 'AUD', lat: -35.2809, lng: 149.1300, flag: '🇦🇺', country: 'Australia', name: 'Australian Dollar', city: 'Canberra', region: 'Oceania' },
    { code: 'NZD', lat: -41.2865, lng: 174.7762, flag: '🇳🇿', country: 'New Zealand', name: 'New Zealand Dollar', city: 'Wellington', region: 'Oceania' },
    
    // Африка
    { code: 'ZAR', lat: -25.7461, lng: 28.1881, flag: '🇿🇦', country: 'South Africa', name: 'South African Rand', city: 'Pretoria', region: 'Africa' },
    { code: 'EGP', lat: 30.0444, lng: 31.2357, flag: '🇪🇬', country: 'Egypt', name: 'Egyptian Pound', city: 'Cairo', region: 'Africa' },
    { code: 'NGN', lat: 9.0765, lng: 7.3986, flag: '🇳🇬', country: 'Nigeria', name: 'Nigerian Naira', city: 'Abuja', region: 'Africa' },
    
    // СНГ
    { code: 'KZT', lat: 51.1694, lng: 71.4491, flag: '🇰🇿', country: 'Kazakhstan', name: 'Kazakhstani Tenge', city: 'Astana', region: 'CIS' },
    { code: 'UAH', lat: 50.4501, lng: 30.5234, flag: '🇺🇦', country: 'Ukraine', name: 'Ukrainian Hryvnia', city: 'Kyiv', region: 'CIS' },
    { code: 'BYN', lat: 53.9045, lng: 27.5615, flag: '🇧🇾', country: 'Belarus', name: 'Belarusian Ruble', city: 'Minsk', region: 'CIS' }
];

const exchangeRatesDemo = {
    USD: 1.0, EUR: 0.92, GBP: 0.79, JPY: 149.5, CNY: 7.28, CAD: 1.36, AUD: 1.53, CHF: 0.88,
    MXN: 17.5, BRL: 4.95, RUB: 92.8, INR: 83.2, KRW: 1310.0, ZAR: 18.9, SEK: 10.8, NOK: 10.5,
    DKK: 6.88, PLN: 4.12, CZK: 22.5, HUF: 365.0, SGD: 1.35, THB: 36.5, TRY: 32.8, AED: 3.67,
    ARS: 815.0, CLP: 910.0, IDR: 15600.0, EGP: 30.9, NGN: 1500.0, NZD: 1.65, KZT: 450.0,
    UAH: 36.5, BYN: 3.25
};

function initHoloGlobe() {
    console.log('1. Инициализация глобуса с маркерами-флагами...');
    
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    const container = canvas.parentElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e2a);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Земля
    createEarth();
    
    // Тултип
    createInfoTooltip();
    
    // Маркеры-флаги
    createFlagMarkers();
    
    // Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.minDistance = 1.5;
        controls.maxDistance = 6;
        controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        controls.addEventListener('start', () => {
            isUserInteracting = true;
            hideTooltip();
            controls.autoRotate = false;
        });
        
        controls.addEventListener('end', () => {
            isUserInteracting = false;
            setTimeout(() => {
                if (!isUserInteracting) {
                    controls.autoRotate = true;
                }
            }, 2000);
        });
    }
    
    // Взаимодействие
    setupInteractivity(canvas);
    
    // Легенда
    createRegionalLegend();
    
    // Скрываем загрузку
    setTimeout(() => {
        const loading = document.getElementById('globeLoading');
        if (loading) loading.style.display = 'none';
    }, 1500);
    
    // Анимация
    function animate() {
        requestAnimationFrame(animate);
        
        // Анимация маркеров
        animateMarkers();
        
        if (controls) controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    // Ресайз
    window.addEventListener('resize', onWindowResize);
    
    console.log(`✅ Глобус запущен с ${markers.length} маркерами-флагами`);
}

function createEarth() {
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
        () => console.log('✅ Текстура Земли загружена'),
        undefined,
        (err) => {
            console.warn('Не удалось загрузить текстуру:', err);
            createFallbackTexture();
        }
    );
    
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        shininess: 10,
        specular: new THREE.Color(0x333333)
    });
    
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
}

function createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1a5fb4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const continents = [
        { name: 'North America', color: '#2ecc71', points: [[200,100],[250,80],[300,90],[320,110],[310,140],[280,160],[240,170],[200,150],[180,130],[190,110]] },
        { name: 'South America', color: '#27ae60', points: [[280,170],[300,200],[290,230],[260,240],[230,220],[220,190],[250,180]] },
        { name: 'Europe', color: '#e74c3c', points: [[500,100],[520,110],[540,105],[560,115],[550,130],[530,140],[510,135],[500,120]] },
        { name: 'Africa', color: '#f39c12', points: [[520,140],[560,150],[580,180],[570,210],[540,220],[520,200],[510,170],[520,140]] },
        { name: 'Asia', color: '#d35400', points: [[600,80],[700,90],[750,110],[780,140],[770,180],[720,190],[680,170],[630,150],[610,120],[600,80]] },
        { name: 'Australia', color: '#8e44ad', points: [[750,220],[780,230],[790,250],[770,260],[740,240],[740,220]] }
    ];
    
    continents.forEach(continent => {
        ctx.fillStyle = continent.color;
        ctx.beginPath();
        ctx.moveTo(continent.points[0][0], continent.points[0][1]);
        for (let i = 1; i < continent.points.length; i++) {
            ctx.lineTo(continent.points[i][0], continent.points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    globe.material.map = texture;
    globe.material.needsUpdate = true;
}

function createInfoTooltip() {
    const oldTooltip = document.getElementById('globeTooltip');
    if (oldTooltip) oldTooltip.remove();
    
    infoTooltip = document.createElement('div');
    infoTooltip.id = 'globeTooltip';
    infoTooltip.style.cssText = `
        position: fixed;
        background: rgba(10, 15, 40, 0.98);
        border: 2px solid #00aaff;
        border-radius: 12px;
        padding: 15px;
        color: white;
        font-family: 'Exo 2', sans-serif;
        max-width: 300px;
        min-width: 280px;
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: none;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease-out;
    `;
    
    document.body.appendChild(infoTooltip);
}

function showTooltip(x, y, content) {
    if (!infoTooltip) return;
    
    infoTooltip.innerHTML = content;
    tooltipVisible = true;
    
    if (controls) {
        controls.autoRotate = false;
    }
    
    const tooltipWidth = infoTooltip.offsetWidth || 300;
    const tooltipHeight = infoTooltip.offsetHeight || 200;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let posX = x + 20;
    let posY = y - 10;
    
    if (posX + tooltipWidth > windowWidth - 20) {
        posX = x - tooltipWidth - 20;
    }
    
    if (posY + tooltipHeight > windowHeight - 20) {
        posY = windowHeight - tooltipHeight - 20;
    }
    
    if (posY < 20) {
        posY = 20;
    }
    
    if (posX < 20) {
        posX = 20;
    }
    
    infoTooltip.style.left = posX + 'px';
    infoTooltip.style.top = posY + 'px';
    infoTooltip.style.display = 'block';
    
    setTimeout(() => {
        infoTooltip.style.opacity = '1';
    }, 10);
}

function hideTooltip() {
    if (!infoTooltip || !tooltipVisible) return;
    
    tooltipVisible = false;
    infoTooltip.style.opacity = '0';
    
    setTimeout(() => {
        if (infoTooltip && !tooltipVisible) {
            infoTooltip.style.display = 'none';
            
            if (controls && !isUserInteracting) {
                setTimeout(() => {
                    if (!isUserInteracting && !tooltipVisible) {
                        controls.autoRotate = true;
                    }
                }, 1000);
            }
        }
    }, 200);
}

// ФУНКЦИЯ СОЗДАНИЯ МАРКЕРОВ-ФЛАГОВ
function createFlagMarkers() {
    console.log('Создаю маркеры-флаги...');
    
    markers.forEach(marker => scene.remove(marker));
    markers = [];
    
    currencyData.forEach((curr, index) => {
        setTimeout(() => {
            const lat = curr.lat;
            const lng = curr.lng;
            
            // Конвертация географических координат в 3D
            const phi = (90 - lat) * (Math.PI / 180);  
            const theta = (lng + 180) * (Math.PI / 180);  
            const radius = 1.02;
            const x = -radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            
            // Создаем маркер с флагом
            const marker = createCountryFlagMarker(x, y, z, curr.code);
            
            const color = flagColors[curr.code] || 0x00aaff;
            
            marker.userData = {
                type: 'currency',
                code: curr.code,
                flag: curr.flag,
                country: curr.country,
                name: curr.name,
                city: curr.city,
                region: curr.region,
                color: color,
                originalColor: color,
                exchangeRate: exchangeRatesDemo[curr.code] || 1,
                isHovered: false,
                isSelected: false
            };
            
            scene.add(marker);
            markers.push(marker);
            
            // Анимация появления
            animateMarkerAppearance(marker);
            
        }, index * 30);
    });
}

function createCountryFlagMarker(x, y, z, currencyCode) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    const color = flagColors[currencyCode] || 0x00aaff;
    
    // 1. Основание флага 
    const flagBaseGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.01);
    const flagBaseMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        shininess: 30
    });
    
    const flagBase = new THREE.Mesh(flagBaseGeometry, flagBaseMaterial);
    flagBase.position.y = 0.02;
    group.add(flagBase);
    
    // 2. Флагшток 
    const poleGeometry = new THREE.CylinderGeometry(0.003, 0.005, 0.1, 8);
    const poleMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.8
    });
    
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = -0.05;
    pole.rotation.x = Math.PI;
    group.add(pole);
    
    // 3. Код валюты 
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 64;
    textCanvas.height = 32;
    const textCtx = textCanvas.getContext('2d');
    
    textCtx.fillStyle = '#ffffff';
    textCtx.font = 'bold 20px Arial';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText(currencyCode, 32, 16);
    
    const textTexture = new THREE.CanvasTexture(textCanvas);
    const textGeometry = new THREE.PlaneGeometry(0.04, 0.02);
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.set(0, 0.02, 0.006);
    group.add(text);
    
    // 4. Подсветка флага
    const glowGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.02;
    group.add(glow);
    
    // 5. Основание маркера
    const baseGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.02, 8);
    const baseMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.7
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.09;
    group.add(base);
    
    // Направляем маркер от центра Земли
    const direction = new THREE.Vector3(x, y, z).normalize();
    group.lookAt(direction.multiplyScalar(2));
    group.rotateX(Math.PI / 2);
    
    // Сохраняем ссылки
    group.markerParts = {
        flag: flagBase,
        pole: pole,
        text: text,
        glow: glow,
        base: base
    };
    
    return group;
}

function animateMarkerAppearance(marker) {
    marker.scale.set(0, 0, 0);
    
    let scale = 0;
    const appearInterval = setInterval(() => {
        scale += 0.2;
        marker.scale.set(scale, scale, scale);
        
        if (scale >= 1) {
            clearInterval(appearInterval);
            marker.scale.set(1, 1, 1);
        }
    }, 20);
}

function animateMarkers() {
    const time = Date.now() * 0.001;
    
    markers.forEach(marker => {
        if (marker.userData.isHovered && marker.markerParts) {
            // Плавное покачивание флага при наведении
            const wave = Math.sin(time * 8) * 0.05;
            marker.markerParts.flag.rotation.z = wave;
            
            // Пульсация свечения
            const pulse = Math.sin(time * 10) * 0.1 + 0.3;
            if (marker.markerParts.glow) {
                marker.markerParts.glow.material.opacity = pulse;
            }
            
            // Легкое вращение
            marker.rotation.y += 0.005;
        }
        
        // Очень легкая общая пульсация
        if (marker.markerParts && marker.markerParts.glow && !marker.userData.isHovered && !marker.userData.isSelected) {
            const gentlePulse = Math.sin(time * 0.3 + marker.userData.code.length) * 0.05 + 0.2;
            marker.markerParts.glow.material.opacity = gentlePulse;
        }
    });
}

function setupInteractivity(canvas) {
    console.log('Настраиваю интерактивность...');
    
    let lastHoverTime = 0;
    const hoverDelay = 200;
    
    canvas.addEventListener('mousemove', (event) => {
        if (isUserInteracting) return;
        
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const allObjects = [];
        markers.forEach(marker => {
            allObjects.push(marker);
            marker.children.forEach(child => {
                allObjects.push(child);
            });
        });
        
        const intersects = raycaster.intersectObjects(allObjects, true);
        
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        if (hoveredMarker && (!intersects.length || getMarkerFromObject(intersects[0].object) !== hoveredMarker)) {
            resetMarkerHover(hoveredMarker);
            hoveredMarker = null;
            hideTooltip();
        }
        
        if (intersects.length > 0) {
            const newHoveredMarker = getMarkerFromObject(intersects[0].object);
            
            if (newHoveredMarker && newHoveredMarker !== hoveredMarker) {
                hoveredMarker = newHoveredMarker;
                setMarkerHover(hoveredMarker);
                canvas.style.cursor = 'pointer';
                
                const now = Date.now();
                lastHoverTime = now;
                
                hoverTimeout = setTimeout(() => {
                    if (lastHoverTime === now && hoveredMarker === newHoveredMarker && !isUserInteracting) {
                        showCurrencyTooltip(event.clientX, event.clientY, hoveredMarker.userData);
                    }
                }, hoverDelay);
            }
        } else {
            canvas.style.cursor = 'default';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (hoveredMarker) {
            resetMarkerHover(hoveredMarker);
            hoveredMarker = null;
        }
        hideTooltip();
        canvas.style.cursor = 'default';
        
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
    });
    
    // Клик по маркеру
    canvas.addEventListener('click', (event) => {
        if (isUserInteracting) return;
        
        if (!hoveredMarker) return;
        
        if (selectedMarker && selectedMarker !== hoveredMarker) {
            resetMarkerSelection(selectedMarker);
        }
        
        setMarkerSelected(hoveredMarker);
        selectedMarker = hoveredMarker;
        
        if (controls) {
            controls.autoRotate = false;
            isUserInteracting = true;
        }
        
        selectCurrency(hoveredMarker.userData);
        
        showCurrencyTooltip(event.clientX, event.clientY, hoveredMarker.userData, true);
    });
    
    canvas.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;
        
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const allObjects = [];
        markers.forEach(marker => {
            allObjects.push(marker);
            marker.children.forEach(child => {
                allObjects.push(child);
            });
        });
        
        const intersects = raycaster.intersectObjects(allObjects, true);
        
        if (!intersects.length && selectedMarker) {
            resetMarkerSelection(selectedMarker);
            selectedMarker = null;
            hideTooltip();
            
            if (controls) {
                setTimeout(() => {
                    if (!isUserInteracting) {
                        controls.autoRotate = true;
                    }
                }, 2000);
            }
        }
    });
}

function getMarkerFromObject(object) {
    let current = object;
    while (current && !current.userData.type) {
        current = current.parent;
    }
    return current && current.userData.type === 'currency' ? current : null;
}

function setMarkerHover(marker) {
    if (!marker || marker.userData.isHovered) return;
    
    marker.userData.isHovered = true;
    
    // Увеличение маркера при наведении
    marker.scale.set(1.4, 1.4, 1.4);
    
    if (marker.markerParts) {
        // Подсветка флага
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.emissive = new THREE.Color(marker.userData.color);
            marker.markerParts.flag.material.emissiveIntensity = 0.3;
            marker.markerParts.flag.material.opacity = 1;
        }
        
        // Усиление свечения
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.opacity = 0.4;
        }
        
        // Подсветка текста
        if (marker.markerParts.text) {
            marker.markerParts.text.material.opacity = 1;
        }
    }
}

function resetMarkerHover(marker) {
    if (!marker || !marker.userData.isHovered) return;
    
    marker.userData.isHovered = false;
    
    if (!marker.userData.isSelected) {
        marker.scale.set(1, 1, 1);
    }
    
    if (marker.markerParts) {
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.emissiveIntensity = 0;
            marker.markerParts.flag.material.opacity = 0.9;
            marker.markerParts.flag.rotation.z = 0;
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.opacity = 0.2;
        }
        
        if (marker.markerParts.text) {
            marker.markerParts.text.material.opacity = 0.9;
        }
    }
}

function setMarkerSelected(marker) {
    if (!marker) return;
    
    marker.userData.isSelected = true;
    
    // Выделение выбранного маркера
    marker.scale.set(1.5, 1.5, 1.5);
    
    if (marker.markerParts) {
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.color.set(0x00ffaa);
            marker.markerParts.flag.material.emissive = new THREE.Color(0x00ffaa);
            marker.markerParts.flag.material.emissiveIntensity = 0.5;
            marker.markerParts.flag.material.opacity = 1;
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.color.set(0x00ffaa);
            marker.markerParts.glow.material.opacity = 0.3;
        }
    }
    
    // Анимация пульсации
    let scale = 1.5;
    let direction = -0.015;
    if (marker.pulseInterval) clearInterval(marker.pulseInterval);
    
    marker.pulseInterval = setInterval(() => {
        scale += direction;
        if (scale <= 1.45) direction = 0.015;
        if (scale >= 1.55) direction = -0.015;
        marker.scale.set(scale, scale, scale);
    }, 60);
}

function resetMarkerSelection(marker) {
    if (!marker) return;
    
    marker.userData.isSelected = false;
    
    if (marker.pulseInterval) {
        clearInterval(marker.pulseInterval);
        delete marker.pulseInterval;
    }
    
    if (marker.userData.isHovered) {
        marker.scale.set(1.4, 1.4, 1.4);
    } else {
        marker.scale.set(1, 1, 1);
    }
    
    if (marker.markerParts) {
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.color.set(marker.userData.originalColor);
            marker.markerParts.flag.material.emissiveIntensity = marker.userData.isHovered ? 0.3 : 0;
            marker.markerParts.flag.material.opacity = marker.userData.isHovered ? 1 : 0.9;
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.color.set(marker.userData.originalColor);
            marker.markerParts.glow.material.opacity = marker.userData.isHovered ? 0.4 : 0.2;
        }
    }
}

function showCurrencyTooltip(x, y, currencyData, isClick = false) {
    const rate = currencyData.exchangeRate;
    const usdRate = rate ? (1 / rate).toFixed(4) : 'N/A';
    
    const content = `
        <div style="min-width: 280px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="font-size: 2rem; margin-right: 12px;">${currencyData.flag}</div>
                <div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #00ccff;">
                        ${currencyData.code}
                    </div>
                    <div style="font-size: 0.9rem; color: #a0a0ff;">
                        ${currencyData.name}
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #8888cc; font-size: 0.9rem;">Страна:</span>
                    <span style="color: #ffffff; font-weight: bold;">${currencyData.country}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #8888cc; font-size: 0.9rem;">Столица:</span>
                    <span style="color: #ffffff;">${currencyData.city}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #8888cc; font-size: 0.9rem;">Регион:</span>
                    <span style="color: #ffffff;">${currencyData.region}</span>
                </div>
            </div>
            
            <div style="background: rgba(0,170,255,0.1); border-radius: 8px; padding: 12px; border-left: 3px solid #00aaff;">
                <div style="font-size: 0.9rem; color: #00ccff; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-chart-line"></i> Курс обмена к USD:
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <span style="color: #a0a0ff; font-size: 0.9rem;">1 ${currencyData.code} =</span>
                    <span style="font-size: 1.3rem; font-weight: bold; color: #00ffaa;">
                        ${rate ? rate.toFixed(4) : 'N/A'} USD
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #a0a0ff; font-size: 0.9rem;">1 USD =</span>
                    <span style="font-weight: bold; color: #ffffff; font-size: 1.1rem;">
                        ${usdRate} ${currencyData.code}
                    </span>
                </div>
            </div>
            
            ${isClick ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,170,255,0.3);">
                    <div style="color: #00ffaa; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-check-circle"></i> Валюта выбрана для конвертации
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-top: 12px; font-size: 0.75rem; color: #8888cc; text-align: center; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                <i class="fas fa-info-circle"></i> ${isClick ? 'Кликните вне маркера для отмены' : 'Кликните для выбора валюты'}
            </div>
        </div>
    `;
    
    showTooltip(x, y, content);
    
    if (isClick) {
        setTimeout(() => {
            if (selectedMarker === hoveredMarker) {
                hideTooltip();
            }
        }, 5000);
    }
}

function selectCurrency(currency) {
    console.log(`Выбрана валюта: ${currency.code} (${currency.country})`);
    
    updateCurrencyDisplay(currency);
    
    if (window.HoloApp && window.HoloApp.setToCurrency) {
        window.HoloApp.setToCurrency(currency.code);
    }
    
    showToast(`Выбрана валюта: ${currency.code} (${currency.country})`);
}

function updateCurrencyDisplay(currency) {
    const display = document.getElementById('toCurrencyDisplay');
    if (display) {
        const flag = display.querySelector('.currency-flag');
        const code = display.querySelector('.currency-code');
        const name = display.querySelector('.currency-name');
        const input = document.getElementById('toCurrency');
        
        if (flag) flag.textContent = currency.flag;
        if (code) code.textContent = currency.code;
        if (name) name.textContent = `${currency.name} (${currency.country})`;
        if (input) input.value = currency.code;
    }
}

function createRegionalLegend() {
    const container = document.querySelector('.globe-container');
    if (!container) return;
    
    const oldLegend = document.getElementById('legend');
    if (oldLegend) oldLegend.remove();
    
    const oldToggle = document.querySelector('.globe-legend-toggle');
    if (oldToggle) oldToggle.remove();
    
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'legendToggle';
    toggleBtn.className = 'globe-legend-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-layer-group"></i>';
    toggleBtn.title = 'Показать/скрыть легенду валют';
    
    const legend = document.createElement('div');
    legend.id = 'legend';
    legend.className = 'globe-legend';
    legend.style.cssText = `
        position: absolute;
        top: 80px;
        left: 20px;
        background: rgba(10, 15, 40, 0.98);
        border: 2px solid #00aaff;
        border-radius: 15px;
        padding: 20px;
        color: white;
        width: 350px;
        max-height: 500px;
        overflow-y: auto;
        backdrop-filter: blur(15px);
        z-index: 99;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        display: none;
    `;
    
    container.appendChild(toggleBtn);
    container.appendChild(legend);
    
    toggleBtn.addEventListener('click', () => {
        const isVisible = legend.style.display === 'block';
        legend.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            updateRegionalLegendContent();
        }
    });
    
    updateRegionalLegendContent();
}

function updateRegionalLegendContent() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    const regions = {};
    currencyData.forEach(currency => {
        if (!regions[currency.region]) {
            regions[currency.region] = [];
        }
        regions[currency.region].push(currency);
    });
    
    let legendHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="margin:0 0 15px 0;color:#00ccff;border-bottom:1px solid rgba(0,170,255,0.3);padding-bottom:10px;">
                <i class="fas fa-globe-americas"></i> Валюты по регионам
            </h4>
            <div style="font-size: 0.9rem; color: #a0a0ff; margin-bottom: 15px;">
                <i class="fas fa-lightbulb"></i> Наведите на флаг для информации<br>
                <i class="fas fa-mouse-pointer"></i> Кликните для выбора валюты
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
                <div style="background: rgba(0,170,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                    <i class="fas fa-coins"></i> ${currencyData.length} валют
                </div>
                <div style="background: rgba(0,255,170,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                    <i class="fas fa-globe"></i> ${Object.keys(regions).length} регионов
                </div>
            </div>
        </div>
        
        <div style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
    `;
    
    Object.keys(regions).forEach(region => {
        const regionCurrencies = regions[region];
        const regionColor = getRegionColor(region);
        
        legendHTML += `
            <div class="region-section" style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(0,170,255,0.2);">
                    <div style="width: 12px; height: 12px; background: ${regionColor}; border-radius: 50%; margin-right: 10px;"></div>
                    <div style="font-weight: bold; color: #00ccff; font-size: 1.1rem;">${region}</div>
                    <div style="margin-left: auto; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">
                        ${regionCurrencies.length} валют
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    ${regionCurrencies.map(currency => `
                        <div class="legend-currency" 
                             data-currency="${currency.code}"
                             style="display: flex; align-items: center; padding: 8px;
                                    background: rgba(255, 255, 255, 0.05); border-radius: 6px; cursor: pointer;
                                    transition: all 0.3s; border-left: 3px solid #${(flagColors[currency.code] || 0x00aaff).toString(16)};">
                            <div style="font-size: 1.2rem; margin-right: 10px; width: 30px; text-align: center;">
                                ${currency.flag}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #ffffff; font-size: 0.95rem;">
                                    ${currency.code}
                                </div>
                                <div style="font-size: 0.75rem; color: #a0a0ff;">
                                    ${currency.country}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    legendHTML += `
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(0,170,255,0.3);">
            <div style="color: #8888cc; font-size: 0.8rem; text-align: center;">
                <i class="fas fa-sync-alt"></i> Курсы обновляются каждые 5 минут
            </div>
        </div>
    `;
    
    legend.innerHTML = legendHTML;
    
    const currencyElements = legend.querySelectorAll('.legend-currency');
    currencyElements.forEach(el => {
        el.addEventListener('click', function() {
            const currencyCode = this.getAttribute('data-currency');
            selectCurrencyFromLegend(currencyCode);
        });
        
        el.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(0, 170, 255, 0.15)';
            this.style.transform = 'translateX(3px)';
            
            const currencyCode = this.getAttribute('data-currency');
            const marker = markers.find(m => m.userData.code === currencyCode);
            if (marker && !marker.userData.isHovered) {
                setMarkerHover(marker);
            }
        });
        
        el.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.05)';
            this.style.transform = 'translateX(0)';
            
            const currencyCode = this.getAttribute('data-currency');
            const marker = markers.find(m => m.userData.code === currencyCode);
            if (marker && !marker.userData.isHovered) {
                resetMarkerHover(marker);
            }
        });
    });
}

function getRegionColor(region) {
    const colors = {
        'North America': '#ff0000',
        'South America': '#00cc88',
        'Europe': '#0033cc',
        'Asia': '#ff6600',
        'Oceania': '#00008b',
        'Africa': '#008751',
        'CIS': '#00afca'
    };
    return colors[region] || '#00aaff';
}

function selectCurrencyFromLegend(currencyCode) {
    const currency = currencyData.find(c => c.code === currencyCode);
    if (currency) {
        selectCurrency(currency);
        
        const marker = markers.find(m => m.userData.code === currencyCode);
        if (marker) {
            setMarkerSelected(marker);
            
            if (controls) {
                const markerPosition = marker.position.clone();
                const lookAtPosition = markerPosition.clone().multiplyScalar(0.8);
                
                controls.autoRotate = false;
                
                const startTarget = controls.target.clone();
                const startPosition = camera.position.clone();
                
                const duration = 1000;
                const startTime = Date.now();
                
                function animateCamera() {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    
                    controls.target.lerpVectors(startTarget, lookAtPosition, easeProgress);
                    camera.position.lerpVectors(startPosition, 
                        new THREE.Vector3(
                            lookAtPosition.x * 1.5,
                            lookAtPosition.y + 0.5,
                            lookAtPosition.z * 1.5 + 2
                        ), 
                        easeProgress
                    );
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                    }
                }
                
                animateCamera();
            }
        }
    }
}

function showToast(message) {
    if (window.HoloApp && window.HoloApp.showToast) {
        window.HoloApp.showToast(message);
        return;
    }
    
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle" style="color: #00ffaa;"></i>
            <div>${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
    `;
    document.body.appendChild(container);
    return container;
}

function onWindowResize() {
    const container = document.querySelector('.globe-container');
    if (!container || !camera || !renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            initHoloGlobe();
        }
    }, 1500);
});

window.HoloGlobe = { 
    init: initHoloGlobe,
    selectCurrency: selectCurrencyFromLegend,
    getCurrencyData: () => currencyData
};