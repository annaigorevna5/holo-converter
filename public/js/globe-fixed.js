console.log('🌍 ЗАПУСК ГЛОБУСА С ИСПРАВЛЕННОЙ МОБИЛЬНОЙ ВЕРСИЕЙ');

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
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Флаг для определения мобильного устройства
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
console.log('📱 Мобильное устройство:', isMobile);

// Цвета флагов для маркеров
const flagColors = {
    'USD': 0xff0000, 'CAD': 0xff0000, 'MXN': 0x006847, 'BRL': 0x009c3b,
    'ARS': 0x75aadb, 'CLP': 0xd52b1e, 'EUR': 0x003399, 'GBP': 0xc8102e,
    'CHF': 0xff0000, 'RUB': 0xffffff, 'SEK': 0x006aa7, 'NOK': 0xef2b2d,
    'DKK': 0xc60c30, 'PLN': 0xdc143c, 'CZK': 0x11457e, 'HUF': 0x436f4d,
    'JPY': 0xbc002d, 'CNY': 0xde2910, 'INR': 0xff9933, 'KRW': 0x003478,
    'SGD': 0xed2939, 'AED': 0x009639, 'THB': 0xa51931, 'TRY': 0xe30a17,
    'IDR': 0xff0000, 'AUD': 0x00008b, 'NZD': 0x00247d, 'ZAR': 0x007a4d,
    'EGP': 0xce1126, 'NGN': 0x008751, 'KZT': 0x00afca, 'UAH': 0x0057b7,
    'BYN': 0xce1700
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

// Хранилище для больших hitboxes на мобильных
let mobileHitboxes = [];

function initHoloGlobe() {
    console.log('1. Инициализация глобуса с исправленными маркерами...');
    console.log('📱 Режим:', isMobile ? 'Мобильный' : 'Десктоп');
    
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    const container = canvas.parentElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    
    // Очищаем предыдущие маркеры и хитбоксы
    markers.forEach(marker => scene && scene.remove(marker));
    mobileHitboxes.forEach(box => scene && scene.remove(box));
    markers = [];
    mobileHitboxes = [];
    
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
                if (!isUserInteracting && !selectedMarker) {
                    controls.autoRotate = true;
                }
            }, 2000);
        });
    }
    
    // Взаимодействие - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ МОБИЛЬНЫХ
    setupInteractivity(canvas);
    
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
    const geometry = new THREE.SphereGeometry(1, 64, 64); // Уменьшена детализация для производительности
    
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
        max-width: 320px;
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
    
    if (controls && controls.autoRotate) {
        controls.autoRotate = false;
    }
    
    const tooltipWidth = 320; // Фиксированная ширина
    const tooltipHeight = infoTooltip.offsetHeight || 200;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let posX = x + 20;
    let posY = y - 10;
    
    // Корректировка позиции, чтобы не выходить за границы экрана
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
    
    requestAnimationFrame(() => {
        infoTooltip.style.opacity = '1';
    });
}

function hideTooltip() {
    if (!infoTooltip || !tooltipVisible) return;
    
    tooltipVisible = false;
    infoTooltip.style.opacity = '0';
    
    setTimeout(() => {
        if (infoTooltip && !tooltipVisible) {
            infoTooltip.style.display = 'none';
            
            // Возвращаем автоповорот только если нет выбранного маркера
            if (controls && !selectedMarker) {
                setTimeout(() => {
                    if (!selectedMarker && !tooltipVisible) {
                        controls.autoRotate = true;
                    }
                }, 1000);
            }
        }
    }, 200);
}

function createFlagMarkers() {
    console.log('Создаю маркеры-флаги...');
    
    markers.forEach(marker => scene.remove(marker));
    markers = [];
    
    currencyData.forEach((curr, index) => {
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
            isSelected: false,
            position: new THREE.Vector3(x, y, z)
        };
        
        scene.add(marker);
        markers.push(marker);
        
        // Создаем большой невидимый хитбокс для мобильных устройств
        if (isMobile) {
            createMobileHitbox(marker, x, y, z);
        }
        
        // Анимация появления с задержкой
        setTimeout(() => {
            animateMarkerAppearance(marker);
        }, index * 30);
    });
}

function createMobileHitbox(marker, x, y, z) {
    // Создаем большую невидимую сферу для лучшего тапа
    const hitboxGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
        visible: false,
        transparent: true,
        opacity: 0
    });
    
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.set(x, y, z);
    hitbox.userData = {
        type: 'hitbox',
        marker: marker,
        code: marker.userData.code
    };
    
    scene.add(hitbox);
    mobileHitboxes.push(hitbox);
    marker.userData.hitbox = hitbox;
}

function createCountryFlagMarker(x, y, z, currencyCode) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    const color = flagColors[currencyCode] || 0x00aaff;
    
    // 1. Флагшток
    const poleGeometry = new THREE.CylinderGeometry(0.003, 0.005, 0.08, 6);
    const poleMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.8
    });
    
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = -0.04;
    group.add(pole);
    
    // 2. Основание флага
    const flagGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.01);
    const flagMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        shininess: 30,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0
    });
    
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.y = 0.02;
    group.add(flag);
    
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
    
    // 4. Свечение
    const glowGeometry = new THREE.SphereGeometry(0.04, 12, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.02;
    group.add(glow);
    
    // 5. Основание
    const baseGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.02, 6);
    const baseMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.7
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.08;
    group.add(base);
    
    // Направляем маркер от центра Земли
    const direction = new THREE.Vector3(x, y, z).normalize();
    group.lookAt(direction.multiplyScalar(2));
    group.rotateX(Math.PI / 2);
    
    // Сохраняем ссылки
    group.markerParts = {
        flag: flag,
        pole: pole,
        text: text,
        glow: glow,
        base: base
    };
    
    return group;
}

function animateMarkerAppearance(marker) {
    const startScale = 0;
    const endScale = 1;
    const duration = 300;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const scale = startScale + (endScale - startScale) * progress;
        
        marker.scale.set(scale, scale, scale);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

function animateMarkers() {
    const time = Date.now() * 0.001;
    
    markers.forEach(marker => {
        if (marker.markerParts) {
            // Очень легкая общая пульсация
            if (marker.markerParts.glow) {
                const gentlePulse = Math.sin(time * 0.3 + marker.userData.code.length) * 0.05 + 0.15;
                marker.markerParts.glow.material.opacity = gentlePulse;
            }
            
            // Анимация при наведении
            if (marker.userData.isHovered) {
                const wave = Math.sin(time * 8) * 0.03;
                if (marker.markerParts.flag) {
                    marker.markerParts.flag.rotation.z = wave;
                }
                
                if (marker.markerParts.glow) {
                    marker.markerParts.glow.material.opacity = 0.3;
                }
            }
        }
    });
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ НАСТРОЙКИ ИНТЕРАКТИВНОСТИ
function setupInteractivity(canvas) {
    console.log('Настраиваю интерактивность для', isMobile ? 'мобильных устройств' : 'десктопа');
    
    let lastTouchTime = 0;
    let lastHoverTime = 0;
    const hoverDelay = isMobile ? 100 : 200;
    let tapCount = 0;
    let lastTapTime = 0;
    const doubleTapDelay = 300;
    let isTouchMoving = false;
    
    // Очищаем предыдущие события
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('click', handleMouseClick);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    
    // Общая функция для получения координат события
    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (event.type.includes('touch')) {
            if (event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else if (event.changedTouches.length > 0) {
                clientX = event.changedTouches[0].clientX;
                clientY = event.changedTouches[0].clientY;
            } else {
                return null;
            }
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        
        return { clientX, clientY };
    }
    
    // Функция для поиска пересечений с оптимизацией
    function findIntersects(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        // Для лучшей производительности проверяем только маркеры и хитбоксы
        const allObjects = [...markers, ...mobileHitboxes];
        return raycaster.intersectObjects(allObjects, false);
    }
    
    // Функция получения маркера из объекта пересечения
    function getMarkerFromObject(object) {
        if (!object) return null;
        
        // Если это хитбокс, возвращаем связанный маркер
        if (object.userData.type === 'hitbox') {
            return object.userData.marker;
        }
        
        // Если это сам маркер
        if (object.userData.type === 'currency') {
            return object;
        }
        
        // Ищем родительский маркер
        let current = object.parent;
        while (current) {
            if (current.userData && current.userData.type === 'currency') {
                return current;
            }
            current = current.parent;
        }
        
        return null;
    }
    
    // Обработка одиночного тапа/клика
    function handleSingleTap(marker, clientX, clientY) {
        // Снимаем выделение с предыдущего маркера
        if (selectedMarker && selectedMarker !== marker) {
            resetMarkerSelection(selectedMarker);
        }
        
        // Выделяем новый маркер
        if (selectedMarker !== marker) {
            setMarkerSelected(marker);
            selectedMarker = marker;
            
            if (controls) {
                controls.autoRotate = false;
            }
            
            selectCurrency(marker.userData);
            showCurrencyTooltip(clientX, clientY, marker.userData, true);
            
            // На мобильных скрываем тултип через 4 секунды
            if (isMobile) {
                setTimeout(() => {
                    if (selectedMarker === marker) {
                        hideTooltip();
                    }
                }, 4000);
            }
        } else {
            // Повторный клик на тот же маркер - снимаем выделение
            resetMarkerSelection(marker);
            selectedMarker = null;
            hideTooltip();
            
            if (controls && !isUserInteracting) {
                setTimeout(() => {
                    controls.autoRotate = true;
                }, 1000);
            }
        }
    }
    
    // Обработка двойного тапа
    function handleDoubleTap(marker) {
        console.log('Двойной тап на маркер:', marker.userData.code);
        
        // Приближение к маркеру
        if (controls) {
            const markerPosition = marker.userData.position.clone();
            const lookAtPosition = markerPosition.clone().multiplyScalar(0.8);
            
            const startTarget = controls.target.clone();
            const startPosition = camera.position.clone();
            
            const duration = 600;
            const startTime = Date.now();
            
            function animateCamera() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                controls.target.lerpVectors(startTarget, lookAtPosition, easeProgress);
                camera.position.lerpVectors(startPosition, 
                    new THREE.Vector3(
                        lookAtPosition.x * 1.5,
                        lookAtPosition.y + 0.3,
                        lookAtPosition.z * 1.5 + 1.8
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
    
    // Touch события
    function handleTouchStart(event) {
        event.preventDefault();
        
        isTouchMoving = false;
        const pos = getEventPosition(event);
        if (!pos) return;
        
        // Проверяем, есть ли пересечение с маркером
        const intersects = findIntersects(pos.clientX, pos.clientY);
        
        if (intersects.length > 0) {
            const marker = getMarkerFromObject(intersects[0].object);
            if (marker) {
                // Предотвращаем вращение при тапе на маркер
                isUserInteracting = true;
                if (controls) {
                    controls.enabled = false;
                }
                
                // Устанавливаем наведение
                if (hoveredMarker && hoveredMarker !== marker) {
                    resetMarkerHover(hoveredMarker);
                }
                setMarkerHover(marker);
                hoveredMarker = marker;
                
                // Показываем краткий тултип на мобильных
                showMobileTooltip(pos.clientX, pos.clientY, marker.userData);
            } else {
                // Тап не на маркер - разрешаем вращение
                if (controls) {
                    controls.enabled = true;
                }
                isUserInteracting = true;
            }
        } else {
            // Тап не на маркер - разрешаем вращение
            if (controls) {
                controls.enabled = true;
            }
            isUserInteracting = true;
        }
        
        dragStartX = pos.clientX;
        dragStartY = pos.clientY;
        
        // Обработка двойного тапа
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTapTime;
        
        if (tapCount === 0 || timeDiff > doubleTapDelay) {
            tapCount = 1;
        } else if (timeDiff <= doubleTapDelay) {
            tapCount = 2;
        }
        
        lastTapTime = currentTime;
    }
    
    function handleTouchMove(event) {
        event.preventDefault();
        
        if (!isUserInteracting) return;
        
        const pos = getEventPosition(event);
        if (!pos) return;
        
        // Определяем, было ли движение (для отличия тапа от свайпа)
        const dx = Math.abs(pos.clientX - dragStartX);
        const dy = Math.abs(pos.clientY - dragStartY);
        
        if (dx > 5 || dy > 5) {
            isTouchMoving = true;
            hideTooltip();
            
            if (hoveredMarker) {
                resetMarkerHover(hoveredMarker);
                hoveredMarker = null;
            }
        }
        
        // Если вращение разрешено
        if (controls && controls.enabled) {
            controls.enabled = true;
        }
    }
    
    function handleTouchEnd(event) {
        event.preventDefault();
        
        const pos = getEventPosition(event);
        if (!pos) return;
        
        // Если было движение, не обрабатываем как тап
        if (isTouchMoving) {
            isTouchMoving = false;
            setTimeout(() => {
                isUserInteracting = false;
                if (controls && !selectedMarker) {
                    controls.enabled = true;
                    setTimeout(() => {
                        if (!isUserInteracting) {
                            controls.autoRotate = true;
                        }
                    }, 2000);
                }
            }, 100);
            return;
        }
        
        // Находим маркер под пальцем
        const intersects = findIntersects(pos.clientX, pos.clientY);
        
        if (intersects.length > 0) {
            const marker = getMarkerFromObject(intersects[0].object);
            if (marker) {
                // Обработка двойного тапа
                if (tapCount === 2) {
                    handleDoubleTap(marker);
                    tapCount = 0;
                } else {
                    // Одиночный тап
                    setTimeout(() => {
                        if (tapCount === 1) {
                            handleSingleTap(marker, pos.clientX, pos.clientY);
                            tapCount = 0;
                        }
                    }, doubleTapDelay);
                }
            }
        } else {
            // Тап вне маркера
            if (selectedMarker) {
                resetMarkerSelection(selectedMarker);
                selectedMarker = null;
                hideTooltip();
            }
        }
        
        // Включаем автоповорот если нет выбранного маркера
        setTimeout(() => {
            isUserInteracting = false;
            if (controls && !selectedMarker) {
                controls.enabled = true;
                setTimeout(() => {
                    if (!isUserInteracting && !selectedMarker) {
                        controls.autoRotate = true;
                    }
                }, 2000);
            }
        }, 200);
    }
    
    // Mouse события
    function handleMouseMove(event) {
        if (isUserInteracting) return;
        
        const pos = getEventPosition(event);
        if (!pos) return;
        
        const intersects = findIntersects(pos.clientX, pos.clientY);
        
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        if (hoveredMarker && (!intersects.length || getMarkerFromObject(intersects[0].object) !== hoveredMarker)) {
            resetMarkerHover(hoveredMarker);
            hoveredMarker = null;
            hideTooltip();
            canvas.style.cursor = 'grab';
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
                        showCurrencyTooltip(pos.clientX, pos.clientY, hoveredMarker.userData, false);
                    }
                }, hoverDelay);
            }
        } else {
            canvas.style.cursor = 'grab';
        }
    }
    
    function handleMouseClick(event) {
        if (isUserInteracting) return;
        
        const pos = getEventPosition(event);
        if (!pos) return;
        
        const intersects = findIntersects(pos.clientX, pos.clientY);
        
        if (intersects.length > 0) {
            const marker = getMarkerFromObject(intersects[0].object);
            if (marker) {
                handleSingleTap(marker, pos.clientX, pos.clientY);
            }
        } else {
            // Клик вне маркера
            if (selectedMarker) {
                resetMarkerSelection(selectedMarker);
                selectedMarker = null;
                hideTooltip();
                
                if (controls && !isUserInteracting) {
                    setTimeout(() => {
                        controls.autoRotate = true;
                    }, 1000);
                }
            }
        }
    }
    
    function handleMouseLeave() {
        if (hoveredMarker) {
            resetMarkerHover(hoveredMarker);
            hoveredMarker = null;
        }
        hideTooltip();
        canvas.style.cursor = 'grab';
        
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
    }
    
    // Назначаем события в зависимости от устройства
    if (isMobile) {
        console.log('📱 Использую touch события для мобильного');
        
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Предотвращаем контекстное меню
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
    } else {
        console.log('🖱️ Использую mouse события для десктопа');
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleMouseClick);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        
        canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                isUserInteracting = true;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                isUserInteracting = false;
                canvas.style.cursor = 'grab';
            }
        });
    }
    
    // Инициализируем курсор
    canvas.style.cursor = isMobile ? 'default' : 'grab';
}

function showMobileTooltip(x, y, currencyData) {
    const content = `
        <div style="min-width: 250px; padding: 15px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <div style="font-size: 2rem;">${currencyData.flag}</div>
                <div>
                    <div style="font-size: 1.4rem; font-weight: bold; color: #00ccff;">
                        ${currencyData.code}
                    </div>
                    <div style="font-size: 0.9rem; color: #a0a0ff;">
                        ${currencyData.name}
                    </div>
                </div>
            </div>
            <div style="background: rgba(0,170,255,0.1); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                <div style="color: #ffffff; font-size: 1rem; margin-bottom: 5px;">
                    ${currencyData.country}
                </div>
                <div style="color: #a0a0ff; font-size: 0.9rem;">
                    ${currencyData.region}
                </div>
            </div>
            <div style="color: #00ffaa; font-size: 0.9rem; text-align: center; padding: 8px; background: rgba(0,255,170,0.1); border-radius: 6px; margin-bottom: 10px;">
                <i class="fas fa-hand-point-up"></i> Тапните для выбора
            </div>
            <div style="color: #8888cc; font-size: 0.8rem; text-align: center; padding: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                <i class="fas fa-expand-alt"></i> Двойной тап для приближения
            </div>
        </div>
    `;
    
    showTooltip(x, y, content);
}

function setMarkerHover(marker) {
    if (!marker || marker.userData.isHovered || marker.userData.isSelected) return;
    
    marker.userData.isHovered = true;
    
    // Легкое увеличение
    marker.scale.set(1.2, 1.2, 1.2);
    
    if (marker.markerParts) {
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.emissiveIntensity = 0.2;
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.opacity = 0.3;
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
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.opacity = 0.15;
        }
    }
}

function setMarkerSelected(marker) {
    if (!marker || marker.userData.isSelected) return;
    
    // Снимаем выделение с предыдущего маркера
    if (selectedMarker && selectedMarker !== marker) {
        resetMarkerSelection(selectedMarker);
    }
    
    marker.userData.isSelected = true;
    marker.userData.isHovered = false;
    
    // Выделение
    marker.scale.set(1.3, 1.3, 1.3);
    
    if (marker.markerParts) {
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.color.set(0x00ffaa);
            marker.markerParts.flag.material.emissive.set(0x00ffaa);
            marker.markerParts.flag.material.emissiveIntensity = 0.4;
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.color.set(0x00ffaa);
            marker.markerParts.glow.material.opacity = 0.25;
        }
    }
    
    // Анимация пульсации
    let scale = 1.3;
    let direction = 0.01;
    const minScale = 1.25;
    const maxScale = 1.35;
    
    if (marker.pulseInterval) clearInterval(marker.pulseInterval);
    
    marker.pulseInterval = setInterval(() => {
        scale += direction;
        if (scale <= minScale) direction = 0.01;
        if (scale >= maxScale) direction = -0.01;
        marker.scale.set(scale, scale, scale);
    }, 50);
}

function resetMarkerSelection(marker) {
    if (!marker || !marker.userData.isSelected) return;
    
    marker.userData.isSelected = false;
    
    if (marker.pulseInterval) {
        clearInterval(marker.pulseInterval);
        delete marker.pulseInterval;
    }
    
    marker.scale.set(1, 1, 1);
    
    if (marker.markerParts) {
        if (marker.markerParts.flag) {
            marker.markerParts.flag.material.color.set(marker.userData.originalColor);
            marker.markerParts.flag.material.emissiveIntensity = 0;
        }
        
        if (marker.markerParts.glow) {
            marker.markerParts.glow.material.color.set(marker.userData.originalColor);
            marker.markerParts.glow.material.opacity = 0.15;
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
    
    if (isClick && isMobile) {
        setTimeout(() => {
            if (selectedMarker && selectedMarker.userData.code === currencyData.code) {
                hideTooltip();
            }
        }, 4000);
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
        
        // Обновляем символ валюты
        const symbol = document.getElementById('inputCurrencySymbol');
        if (symbol && window.HoloApp && window.HoloApp.getCurrencySymbol) {
            const fromCurrency = document.getElementById('fromCurrency')?.value || 'USD';
            symbol.textContent = window.HoloApp.getCurrencySymbol(fromCurrency);
        }
    }
    
    // Выполняем конвертацию
    if (window.HoloApp && window.HoloApp.convertCurrency) {
        const amount = parseFloat(document.getElementById('amountInput')?.value) || 1000;
        const fromCurrency = document.getElementById('fromCurrency')?.value || 'USD';
        window.HoloApp.convertCurrency(amount, fromCurrency, currency.code);
    }
}

function showToast(message) {
    // Используем существующую систему тостов или создаем простую
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 170, 255, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-family: 'Exo 2', sans-serif;
        font-size: 0.9rem;
        z-index: 10001;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: fadeInUp 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle" style="font-size: 1.1rem;"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
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
        } else {
            console.error('Three.js не загружен!');
            // Показываем сообщение об ошибке
            const loading = document.getElementById('globeLoading');
            if (loading) {
                loading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #ff4757; font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>Ошибка загрузки 3D глобуса</div>
                    <div class="loading-sub">Пожалуйста, обновите страницу</div>
                `;
            }
        }
    }, 500);
});

// Экспорт для глобального доступа
window.HoloGlobe = { 
    init: initHoloGlobe,
    selectCurrency: selectCurrency,
    getCurrencyData: () => currencyData,
    isMobile: isMobile,
    cleanup: function() {
        // Очистка ресурсов
        if (renderer) {
            renderer.dispose();
        }
        markers = [];
        mobileHitboxes = [];
    }
};