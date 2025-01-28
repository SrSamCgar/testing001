// Core Variables
let currentLanguage = 'es';
let currentTheme = 'light';
let currentWorker = null;
let currentIndex = 0;
let currentInspectionData = {};
let currentItemStatus = null;
let lastCaptureTime = 0;
let inspectionStartTime = null;
let inspectionEndTime = null;
//declarada al inicio para evitar errores
async function handleImageProcessing(file) {
    if (!file) {
        console.error('No file provided');
        return null;
    }

    const photoPreview = document.getElementById('photoPreview');
    const spinner = document.getElementById('imageLoadingSpinner');

    try {
        if (spinner) spinner.style.display = 'block';
        if (photoPreview) photoPreview.classList.add('processing');

        // Process and compress the image
        const processedImage = await compressImage(file);

        // Update UI
        if (photoPreview) {
            photoPreview.src = processedImage;
            photoPreview.style.display = 'block';
            photoPreview.classList.remove('processing');
        }

        return processedImage;

    } catch (error) {
        console.error('Error processing image:', error);
        showNotification('Error al procesar la imagen', 'error');
        return null;
    } finally {
        if (spinner) spinner.style.display = 'none';
        if (photoPreview) photoPreview.classList.remove('processing');
    }
}
//event listeners
function initializeLoginButtons() {
    const loginBtn = document.querySelector('.btn:not(.btn-secondary)');
    const demoBtn = document.querySelector('.btn.btn-secondary');
    
    if(loginBtn) loginBtn.addEventListener('click', login);
    if(demoBtn) demoBtn.addEventListener('click', startDemoMode);
}
// Configuration Data
const workers = {
    '1234': { id: '003', name: 'Juan Ramon', password: 'abcd1234', role: 'user', inspections: [], status: 'active' },
    '5678': { id: '004', name: 'Maria Lopez', password: 'maria5678', role: 'user', inspections: [], status: 'inactive' },
    '9876': { id: '005', name: 'Carlos Perez', password: 'carlos9876', role: 'auditor', inspections: [], status: 'active' },
    '4321': { id: '006', name: 'Ana Garcia', password: 'ana4321', role: 'auditor', inspections: [], status: 'inactive' },
    '9999': { id: '001', name: 'Admin User', password: 'admin123', role: 'admin', inspections: [], status: 'active' },
    '1111': { id: '007', name: 'Luis Fernandez', password: 'luis1111', role: 'admin', inspections: [], status: 'active' },
    '2222': { id: '008', name: 'Sofia Martinez', password: 'sofia2222', role: 'admin', inspections: [], status: 'inactive' },
    '3333': { id: '009', name: 'Pedro Gomez', password: 'pedro3333', role: 'admin', inspections: [], status: 'active' }
};

const trucks = {
    'T001': { id: 'T001', model: 'Kenworth T680', year: 2020, driver: 'Carlos Perez' },
    'T002': { id: 'T002', model: 'Freightliner Cascadia', year: 2019, driver: 'Ana Lopez' },
    'T003': { id: 'T003', model: 'Volvo VNL 760', year: 2021, driver: 'Luis Martinez' },
    'T004': { id: 'T004', model: 'International LT625', year: 2018, driver: 'Sofia Ramirez' },
    'T005': { id: 'T005', model: 'Peterbilt 579', year: 2022, driver: 'Miguel Hernandez' }
};

// Lista de items de inspección
const inspectionItems = [
    { 
        id: 'tires', 
        name: { en: 'Tires', es: 'Llantas' }, 
        icon: '🚗', 
        description: { 
            en: 'Check for proper inflation, no visible damage, and sufficient tread depth.', 
            es: 'Verifique que estén correctamente infladas, sin daños visibles y con suficiente profundidad de dibujo.' 
        },
        requiredPhotos: 1  // Se requieren 4 fotos (una por cada llanta)
    },
    { 
        id: 'mirrors', 
        name: { en: 'Rearview Mirrors', es: 'Espejos Retrovisores' }, 
        icon: '🪞', 
        description: { 
            en: 'Ensure both mirrors are properly aligned, clean, and free from damage.', 
            es: 'Asegúrese de que ambos espejos estén correctamente alineados, limpios y sin daños.' 
        },
        requiredPhotos: 0  // Se requieren 2 fotos (espejo izquierdo y derecho)
    },
    { 
        id: 'license_plates', 
        name: { en: 'License Plates', es: 'Placas Delantera y Trasera' }, 
        icon: '🔖', 
        description: { 
            en: 'Confirm that both plates are securely attached and clearly visible.', 
            es: 'Confirme que ambas placas estén firmemente sujetas y sean claramente visibles.' 
        },
        requiredPhotos: 0  // Se requieren 2 fotos (placa delantera y trasera)
    },
    { 
        id: 'cleanliness', 
        name: { en: 'Cleanliness', es: 'Limpieza' }, 
        icon: '🧼', 
        description: { 
            en: 'Ensure the vehicle is clean, both exterior and interior.', 
            es: 'Asegúrese de que el vehículo esté limpio, tanto exterior como interior.' 
        },
	requiredPhotos: 0 //unica foto central pasillo
    },
    { 
        id: 'scratches', 
        name: { en: 'Exterior Scratches', es: 'Rayones del Exterior' }, 
        icon: '🔍', 
        description: { 
            en: 'Check for any visible scratches or dents on the exterior.', 
            es: 'Verifique si hay rayones o abolladuras visibles en el exterior.' 
        },
        requiredPhotos: 0  // Se requieren 3 fotos (lateral izquierdo, derecho y frontal)
    },
    { 
        id: 'headlights_taillights', 
        name: { en: 'Headlights and Taillights', es: 'Faros Delanteros y Traseros' }, 
        icon: '💡', 
        description: { 
            en: 'Ensure they are not broken or foggy and are functioning properly.', 
            es: 'Asegúrese de que no estén rotos u opacos y que funcionen correctamente.' 
        },
        requiredPhotos: 0  // Se requieren 2 fotos (faros delanteros y traseros)
    },
    { 
        id: 'compartments', 
        name: { en: 'Compartments', es: 'Gavetas' }, 
        icon: '🗄️', 
        description: { 
            en: 'Check the compartments for cleanliness and general condition.', 
            es: 'Verifique la limpieza y el estado general de las gavetas.' 
        },
        requiredPhotos: 0  // Se requieren 2 fotos (lado izquierdo y derecho)
    }
];

// Notification Messages
const notificationMessages = {
    welcome: { en: 'Welcome', es: 'Bienvenido' },
    invalidWorker: { en: 'Invalid Worker ID or Password', es: 'ID de Trabajador o Contraseña inválidos' },
    truckSelected: { en: 'Truck selected:', es: 'Camión seleccionado:' },
    invalidTruckId: { en: 'Invalid Truck ID', es: 'ID de Camión inválido' },
    imageProcessing: { en: 'Processing image...', es: 'Procesando imagen...' }
};

// Initialize Application
function initializeApp() {
    try {
        // Load saved data
        loadSavedData();
        
        // Initialize language and theme
        //initializeLanguage();
       // initializeTheme();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize mobile optimizations
        initializeMobileOptimizations();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error initializing application', 'error');
    }
}

function loadSavedData() {
    try {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) currentLanguage = savedLanguage;
        
        const savedTheme = localStorage.getItem('preferredTheme');
        if (savedTheme) {
            currentTheme = savedTheme;
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'block';
            loginScreen.classList.add('active');
        }
    });

    window.addEventListener('beforeunload', () => {
        try {
            localStorage.setItem('preferredLanguage', currentLanguage);
            localStorage.setItem('preferredTheme', currentTheme);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeApp);
// Authentication Functions
async function login() {
    try {
        const workerId = document.getElementById('workerId')?.value?.trim();
        const password = document.getElementById('workerPassword')?.value?.trim();

        if (!workerId || !password) {
            throw new Error('Please fill in both fields');
        }
	console.log('Data sent to API:', { workerId, password });

        const response = await fetch('api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerId, password }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Invalid credentials');
        }

        // Set current worker
        currentWorker = data.user;
        showNotification(`Welcome, ${currentWorker.name}!`, 'success');

        // Close modals and hide screens
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });

        // Update last login
        await fetch('/api/updateLastLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerId: currentWorker.id }),
        });

        // Navigate based on role
        if (currentWorker.role === 'admin') {
            showAdminDashboard();
        } else {
            showScreen('truckIdScreen');
        }
    } catch (error) {
        handleError(error, 'login');
    }
}
/*async function login() {
    try {
        const workerId = document.getElementById('workerId')?.value?.trim();
        const password = document.getElementById('workerPassword')?.value?.trim();

        if (!workerId || !password) {
            throw new Error('Please fill in both fields');
        }

        if (!workers[workerId] || workers[workerId].password !== password) {
            throw new Error('Invalid credentials');
        }

        // Set current worker
        currentWorker = workers[workerId];

        // Display welcome notification
        showNotification(`Welcome, ${currentWorker.name}!`, 'success');

        // Close modals and hide screens
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });

        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });

        // Navigate based on role
        if (currentWorker.role === 'admin') {
            showAdminDashboard();
        } else {
            showScreen('truckIdScreen');
        }
    } catch (error) {
        handleError(error, 'login');
    }
}*/
/*function login() {
    const workerId = document.getElementById('workerId')?.value?.trim();
    const password = document.getElementById('workerPassword')?.value?.trim();

    if (!workerId || !password) {
        showNotification('Please fill in both fields', 'error');
        return;
    }

    if (!workers[workerId] || workers[workerId].password !== password) {
        showNotification('Invalid credentials', 'error');
        return;
    }

    // Set current worker
    currentWorker = workers[workerId];
    showNotification(`Welcome, ${currentWorker.name}!`, 'success');

    // Close modals and hide screens
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
    });

    // Navigate based on role
    if (currentWorker.role === 'admin') {
        showAdminDashboard();
    } else {
        showScreen('truckIdScreen');
    }
}*/

function startDemoMode() {
    currentWorker = { 
        id: '000', 
        name: 'Demo User', 
        role: 'user',
        inspections: []
    };

    showNotification('Demo mode started', 'success');
    resetScreens();
    showScreen('truckIdScreen');
}

// Screen Management
function showScreen(screenId) {
    // Close modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
    });

    // Show selected screen
    const selectedScreen = document.getElementById(screenId);
    if (selectedScreen) {
        selectedScreen.style.display = 'block';
        selectedScreen.classList.add('active');
        
        // Update screen-specific content
        if (screenId === 'adminScreen') {
            updateAdminStats();
            updateRecentInspections();
        }
    }

    // Update mobile optimizations
    updateScreenForMobile(screenId);
}

// Mobile Screen Optimization
function updateScreenForMobile(screenId) {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    screen.style.overflow = 'auto';
    screen.style.webkitOverflowScrolling = 'touch';

    const navButtons = screen.querySelector('.nav-buttons');
    if (navButtons) {
        screen.style.paddingBottom = `${navButtons.offsetHeight + 16}px`;
    }
}

function resetScreens() {
    currentInspectionData = {};
    currentIndex = 0;
    currentItemStatus = null;
    
    const photoPreview = document.getElementById('photoPreview');
    const commentBox = document.getElementById('commentBox');
    
    if (photoPreview) {
        photoPreview.style.display = 'none';
        photoPreview.src = '';
    }
    
    if (commentBox) {
        commentBox.value = '';
    }
}

// Language and Theme Management
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
    const btnSpans = document.querySelectorAll('#languageToggleBtn span');
    btnSpans.forEach(span => {
        span.style.display = span.getAttribute('data-lang') === currentLanguage ? 'inline' : 'none';
    });
    updateLanguage();
    localStorage.setItem('preferredLanguage', currentLanguage);
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('preferredTheme', currentTheme);
}
// New functions for settings
function updateDefaultLanguage(lang) {
    localStorage.setItem('defaultLanguage', lang);
    showNotification('Default language updated', 'success');
}

function updateThemePreference(theme) {
    localStorage.setItem('defaultTheme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    showNotification('Theme preference updated', 'success');
}

function updateLanguage() {
    document.querySelectorAll('[data-lang]').forEach(el => {
        el.style.display = el.getAttribute('data-lang') === currentLanguage ? 'inline' : 'none';
    });
    
    // Keep status button visibility
    document.querySelectorAll('.status-btn span').forEach(span => {
        if (span.getAttribute('data-lang') === currentLanguage) {
            span.style.display = 'inline';
        } else {
            span.style.display = 'none';
        }
    });
}
//  showSettings function
function showSettings() {
    toggleSidebar();
    showScreen('settingsScreen');
    
    // Load saved preferences
    const savedLang = localStorage.getItem('defaultLanguage') || 'en';
    const savedTheme = localStorage.getItem('defaultTheme') || 'light';
    
    document.getElementById('defaultLanguage').value = savedLang;
    document.getElementById('themePreference').value = savedTheme;
}
// Inspection Management
function startInspection() {
	inspectionStartTime = new Date();
    const truckId = document.getElementById('truckId').value.trim();

    if (!trucks[truckId]) {
        showNotification('Invalid truck ID', 'error');
        return;
    }

    const truck = trucks[truckId];
    showNotification(`Truck selected: ${truck.model}, ${truck.year}`, 'success');
    resetInspection();
    showScreen('inspectionScreen');
    updateInspectionDisplay();
    updateProgressBar();
}

function resetInspection() {
    currentIndex = 0;
    currentInspectionData = {};
    currentItemStatus = null;
    
    const elements = {
        photoPreview: document.getElementById('photoPreview'),
        commentBox: document.getElementById('commentBox'),
        charCount: document.getElementById('charCount')
    };
    
    if (elements.photoPreview) {
        elements.photoPreview.style.display = 'none';
        elements.photoPreview.src = '';
    }
    
    if (elements.commentBox) {
        elements.commentBox.value = '';
    }
    
    if (elements.charCount) {
        elements.charCount.textContent = '0/150';
    }
  cleanupImages();
}
function updateInspectionDisplay() {
    const item = inspectionItems[currentIndex];
    if (!item) {
        console.error('Invalid inspection index');
        return;
    }

    // Retrieve current data for this item or set defaults
    const currentData = currentInspectionData[item.id] || { comment: '', photos: [], status: null };

    // Update UI elements
    document.getElementById('currentName').textContent = `${item.icon} ${item.name[currentLanguage]}`;
    document.getElementById('currentDescription').textContent = item.description[currentLanguage];

    // Update comment box
    const commentBox = document.getElementById('commentBox');
    if (commentBox) {
        commentBox.value = currentData.comment || '';
    }
    updateCharCount();

    // Update photo preview
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        // Always clear the previous photo first
        photoPreview.src = '';
        photoPreview.style.display = 'none';

        // Only show a photo if we have photos for this specific item
        if (currentData.photos && currentData.photos.length > 0) {
            photoPreview.src = currentData.photos[currentData.photos.length - 1];
            photoPreview.style.display = 'block';
        }
    }

    // Reset all status buttons and highlight the saved one if exists
    document.querySelectorAll('.status-btn').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.status === currentData.status) {
            button.classList.add('active');
        }
    });

    // Validate next button if necessary
    validateNextButton(currentData.comment?.length || 0, 30, 150);
}
// Add overall condition
function calculateOverallCondition(inspectionData) {
    const items = Object.values(inspectionData);
    const totalItems = items.length;
    let criticalCount = 0;
    let warningCount = 0;
    
    items.forEach(item => {
        if (item.status === 'critical') criticalCount++;
        if (item.status === 'warning') warningCount++;
    });
    
    // Calculate percentage:
    // Each critical issue reduces by 20%
    // Each warning reduces by 10%
    const baseScore = 100;
    const criticalDeduction = criticalCount * 20;
    const warningDeduction = warningCount * 10;
    
    let overallScore = baseScore - criticalDeduction - warningDeduction;
    overallScore = Math.max(0, Math.min(100, overallScore)); // Keep between 0-100
    
    return {
        score: overallScore,
        criticalCount,
        warningCount
    };
}
//session manager
const SessionManager = {
    timeout: 30 * 60 * 1000, // 30 minutes
    timer: null,

    startSession: () => {
        SessionManager.resetTimer();
        document.addEventListener('mousemove', SessionManager.resetTimer);
        document.addEventListener('keypress', SessionManager.resetTimer);
    },

    resetTimer: () => {
        clearTimeout(SessionManager.timer);
        SessionManager.timer = setTimeout(() => {
            showNotification('Session expired. Please login again.', 'warning');
            backToLogin();
        }, SessionManager.timeout);
    },

    endSession: () => {
        clearTimeout(SessionManager.timer);
        document.removeEventListener('mousemove', SessionManager.resetTimer);
        document.removeEventListener('keypress', SessionManager.resetTimer);
    }
};
//Loading states
function setLoadingState(isLoading, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalText = element.innerText;
    
    if (isLoading) {
        element.disabled = true;
        element.innerHTML = '<span class="loading-spinner"></span> Loading...';
    } else {
        element.disabled = false;
        element.innerText = originalText;
    }
}
//validate input
function validateInput(value, type) {
    const patterns = {
        workerId: /^\d{4,6}$/,
        password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/,
        truckId: /^[A-Z]\d{3}$/
    };

    return patterns[type]?.test(value) || false;
}
//Storage management
const StorageManager = {
    save: async (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            handleError(error, 'StorageManager.save');
            return false;
        }
    },
    
    get: async (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            handleError(error, 'StorageManager.get');
            return null;
        }
    }
};
/*function updateInspectionDisplay() {
    const item = inspectionItems[currentIndex];
    if (!item) {
        console.error('Invalid inspection index');
        return;
    }

    // Retrieve current data for this item or set defaults
    const currentData = currentInspectionData[item.id] || { comment: '', photos: [], status: null };

    // Update UI elements
    document.getElementById('currentName').textContent = `${item.icon} ${item.name[currentLanguage]}`;
    document.getElementById('currentDescription').textContent = item.description[currentLanguage];

    // Update comment box
    const commentBox = document.getElementById('commentBox');
    if (commentBox) {
        commentBox.value = currentData.comment || '';
    }
    updateCharCount();

    // Reset all status buttons and highlight the saved one if exists
    document.querySelectorAll('.status-btn').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.status === currentData.status) {
            button.classList.add('active');
        }
    });

    // Validate next button if necessary
    validateNextButton(currentData.comment?.length || 0, 30, 150);
}*/
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = ((currentIndex + 1) / inspectionItems.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
}
function setItemStatus(status) {
    // Set the current status
    currentItemStatus = status;

    // Get all status buttons and the clicked one
    const buttons = document.querySelectorAll('.status-btn');
    const clickedButton = document.querySelector(`.status-btn[data-status="${status}"]`);

    // Remove active class from all buttons
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Add active class to clicked button
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // Save item state in currentInspectionData
    const item = inspectionItems[currentIndex];
    if (!currentInspectionData[item.id]) {
        currentInspectionData[item.id] = {};
    }
    
    currentInspectionData[item.id] = {
        ...currentInspectionData[item.id],
        status: status,
        comment: document.getElementById('commentBox')?.value || '',
        photo: document.getElementById('photoPreview')?.src || null
    };

    // Update character count and validate next button
    updateCharCount();
}
/*function setItemStatus(status, event) {
    // Set the current status
    currentItemStatus = status;

    // Get the clicked button
    const btn = event.currentTarget;
    if (!btn) {
        console.error('El botón clicado es undefined.');
        return;
    }

    // Remove active class from all buttons
    document.querySelectorAll('.status-btn').forEach(button => {
        button.classList.remove('active');
    });

    // Add active class to clicked button
    btn.classList.add('active');

    // Save item state in currentInspectionData
    const item = inspectionItems[currentIndex];
    if (!currentInspectionData[item.id]) {
        currentInspectionData[item.id] = {};
    }
    
    currentInspectionData[item.id] = {
        ...currentInspectionData[item.id],
        status: status,
        comment: document.getElementById('commentBox').value || '',
        photo: document.getElementById('photoPreview').src || null
    };

    // Update character count and validate next button
    updateCharCount();
}*/

// Add event listeners to status buttons
document.querySelectorAll('.status-btn').forEach(button => {
    button.addEventListener('click', function() {
        const status = this.getAttribute('data-status');
        setItemStatus(status);
    });
});
/*document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.status-btn').forEach(button => {
        button.addEventListener('click', function(event) {
            const status = this.getAttribute('data-status');
            setItemStatus(status, event);
        });
    });
});*/

function initializeStatusButtons() {
    document.querySelectorAll('.status-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const status = this.getAttribute('data-status');
            setItemStatus(status);
        });
    });
}

async function nextItem() {
    console.log('nextItem fue llamado');

    // Obtener el ítem actual y detalles necesarios
    const item = inspectionItems[currentIndex];
    const requiredPhotos = item.requiredPhotos ?? 1; // Fotos requeridas, por defecto 1
    const currentPhotos = currentInspectionData[item.id]?.photos || []; // Fotos actuales
    const comment = document.getElementById('commentBox')?.value.trim() || ''; // Comentario del inspector

    console.log('Current inspection item:', JSON.stringify(item, null, 2));
    console.log('Required photos:', requiredPhotos);
    console.log('Current photos count:', currentPhotos.length);

    // Caso especial: Si no se requieren fotos, avanzar directamente
    if (requiredPhotos === 0) {
        console.log(`El ítem "${item.name[currentLanguage]}" no requiere fotos, avanzando...`);
        currentInspectionData[item.id] = {
            ...currentInspectionData[item.id],
            comment: comment,
            status: currentItemStatus,
            timestamp: new Date().toISOString(),
            aiComment: 'No se requiere análisis de IA para este ítem.',
        };
        advanceToNextItem();
        return;
    }

    // Validar si se han cargado las fotos requeridas antes de avanzar
    if (currentPhotos.length < requiredPhotos) {
        const missingPhotos = requiredPhotos - currentPhotos.length;
        console.warn(`Faltan ${missingPhotos} fotos para completar este ítem.`);
        showNotification(`Faltan ${missingPhotos} fotos para completar este ítem.`, 'error');
        return;
    }

    // Guardar los datos del ítem actual
    currentInspectionData[item.id] = {
        ...currentInspectionData[item.id],
        comment: comment,
        status: currentItemStatus,
        timestamp: new Date().toISOString(),
    };

    // Procesar las fotos y comentarios con OpenAI si aplica
    if (currentPhotos.length > 0 && comment.length >= 30) {
        console.log('Llamando a OpenAI con fotos cargadas y comentario válido.');
        try {
            showNotification('Procesando imágenes con OpenAI...');

            // Llamada a la función para analizar fotos
            const aiComment = await analyzePhotoWithOpenAI(currentPhotos);

            // Validar y formatear el comentario de IA
            if (Array.isArray(aiComment)) {
                console.log('AI Comment recibido como array:', aiComment);
                const formattedAIComment = aiComment.map((comment, index) => `Imagen ${index + 1}: ${comment}`).join('\n');
                currentInspectionData[item.id].aiComment = formattedAIComment;
            } else if (typeof aiComment === 'string') {
                console.log('AI Comment recibido como string:', aiComment);
                currentInspectionData[item.id].aiComment = aiComment;
            } else {
                console.error('Formato inesperado del comentario de AI:', aiComment);
                currentInspectionData[item.id].aiComment = 'Error: Formato inesperado del comentario de AI.';
            }

            console.log(`AI Comment added for ${item.name[currentLanguage]}:`, currentInspectionData[item.id].aiComment);
            showNotification('Análisis de OpenAI completado.');
        } catch (error) {
            console.error('Error al procesar con OpenAI:', error);
            showNotification('Error al procesar las imágenes con OpenAI.', 'error');
            currentInspectionData[item.id].aiComment = 'Error al procesar las imágenes con OpenAI.';
        }
    } else {
        console.log('No hay suficientes fotos o el comentario es insuficiente, se omite el envío a OpenAI.');
        currentInspectionData[item.id].aiComment = 'No hay suficientes fotos o comentario válido.';
    }

    // Avanzar al siguiente ítem o completar la inspección
    if (currentIndex < inspectionItems.length - 1) {
        currentIndex++;
        console.log(`Avanzando al siguiente ítem: ${inspectionItems[currentIndex].name[currentLanguage]}`);
        updateInspectionDisplay();
        updateProgressBar();
        currentItemStatus = null; // Reiniciar el estado del ítem actual
    } else {
        console.log('Inspección completada.');
        completeInspection();
    }
}
function advanceToNextItem() {
    if (currentIndex < inspectionItems.length - 1) {
        console.log('Avanzando al siguiente ítem.');
        currentIndex++;
        updateInspectionDisplay();
        updateProgressBar();
        currentItemStatus = null; // Resetear el estado para el siguiente ítem
        document.getElementById('photoPreview').style.display = 'none'; // Ocultar vista previa de foto
        document.getElementById('photoPreview').src = ''; // Limpiar el src de la foto
    } else {
        console.log('Inspección completada.');
        completeInspection();
    }
}

function previousItem() {
    if (currentIndex > 0) {
        currentIndex--;
        updateInspectionDisplay();
        updateProgressBar();
        currentItemStatus = null;
    } else {
        showNotification('This is the first item', 'warning');
    }
}
function generateInspectionPDF(inspection) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        console.error('jsPDF library not loaded');
        showNotification('Error: PDF generation library not available', 'error');
        return;
    }

    try {
        const doc = new jsPDF();

        // Header with styling
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('FleetGuard Inspection Report', 20, 20);

        // Reset text color for body
        doc.setTextColor(0, 0, 0);
        let y = 40;
        doc.setFontSize(12);

        // Basic Info Section
        const truck = trucks[inspection.truckId];
        const basicInfo = [
            `Inspector: ${inspection.worker}`,
            `Vehicle ID: ${inspection.truckId}`,
            `Model: ${truck ? truck.model : 'N/A'}`,
            `Year: ${truck ? truck.year : 'N/A'}`,
            `Date: ${inspection.date}`,
        ];

        basicInfo.forEach(info => {
            doc.text(info, 20, y);
            y += 10;
        });
        y += 10;

	//overall metric
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text('Overall Vehicle Condition', 20, y);
	y += 10;
	
	doc.setFontSize(12);
	doc.setFont('helvetica', 'normal');
	const condition = inspection.overallCondition;
	const conditionText = [
	    `Overall Score: ${condition.score.toFixed(1)}%`,
	    `Critical Issues: ${condition.criticalCount}`,
	    `Warning Issues: ${condition.warningCount}`
	];
	
	conditionText.forEach(text => {
	    doc.text(text, 20, y);
	    y += 10;
	});
	y += 10;
        // Inspection Items Section
        Object.entries(inspection.data).forEach(([key, value]) => {
            const item = inspectionItems.find(i => i.id === key);
            if (!item) return;

            if (y > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                y = 20;
            }

            // Item Header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${item.name[currentLanguage]} - Status: ${value.status.toUpperCase()}`, 20, y);
            y += 10;

            // Inspector Comments
            if (value.comment) {
                const commentLines = doc.splitTextToSize(`Inspector Comments: ${value.comment}`, 170);
                doc.text(commentLines, 20, y);
                y += commentLines.length * 6;
            }

            // AI Comments
            if (value.aiComment) {
                const aiCommentLines = doc.splitTextToSize(`AI Analysis: ${value.aiComment}`, 170);
                doc.text(aiCommentLines, 20, y);
                y += aiCommentLines.length * 6;
            }

            // Photos
            if (value.photos && value.photos.length > 0) {
                value.photos.forEach((photo, index) => {
                    if (y + 70 > doc.internal.pageSize.getHeight() - 20) {
                        doc.addPage();
                        y = 20;
                    }

                    try {
                        doc.addImage(photo, 'JPEG', 20, y, 50, 50);
                        y += 55;
                    } catch (error) {
                        console.error(`Error adding image for photo ${index + 1}:`, error);
                        doc.text(`Error: Unable to add image ${index + 1}`, 20, y);
                        y += 10;
                    }
                });
            }

            y += 10; // Add spacing between items
        });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, doc.internal.pageSize.getHeight() - 15);

        // Save PDF
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
        doc.save(`FleetGuard_Inspection_${inspection.truckId}_${timestamp}.pdf`);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF report', 'error');
        return false;
    }
}

async function completeInspection() {
	inspectionEndTime = new Date();
    const duration = (inspectionEndTime - inspectionStartTime) / 1000; // in seconds
    const truckId = document.getElementById('truckId').value.trim();
    
    // Create inspection record
	const inspectionRecord = {
	    worker: currentWorker.name,
	    truckId: truckId,
	    date: new Date().toLocaleString(),
	    duration: duration,
	    data: { ...currentInspectionData },
	    overallCondition: calculateOverallCondition(currentInspectionData)
	};

    // Add to records array
    if (!Array.isArray(window.records)) {
        window.records = [];
    }
    window.records.push(inspectionRecord);

    // Save to localStorage
    try {
        localStorage.setItem('inspectionRecords', JSON.stringify(window.records));
        await generateInspectionPDF(inspectionRecord);
        showNotification('Inspection completed and PDF generated', 'success');
    } catch (error) {
        console.error('Error completing inspection:', error);
        showNotification('Error generating PDF', 'error');
    }

    // Show records screen
    showScreen('recordsScreen');
    displayRecords();
cleanupImages();
}

function validateNextButton(charCount, minCharLimit, maxCharLimit) {
    const nextButton = document.getElementById('nextButton');

    // Verificar si el ítem actual tiene fotos suficientes
    const item = inspectionItems[currentIndex];
    const requiredPhotos = item?.requiredPhotos || 0;
    const currentPhotos = currentInspectionData[item.id]?.photos?.length || 0;

    // Validar si se cumplen todas las condiciones
    const isValid = 
        charCount >= minCharLimit && 
        charCount <= maxCharLimit && 
        currentItemStatus !== null && 
        currentPhotos >= requiredPhotos;

    // Actualizar estado del botón
    if (isValid) {
        nextButton.classList.remove('disabled');
        nextButton.disabled = false;
    } else {
        nextButton.classList.add('disabled');
        nextButton.disabled = true;
    }
}
function updateCharCount() {
    const commentBox = document.getElementById('commentBox');
    const charCountDisplay = document.getElementById('charCount');

    if (!commentBox || !charCountDisplay) {
        console.error('Required elements not found in DOM.');
        return;
    }

    const charCount = commentBox.value.length;
    const minCharLimit = 30;
    const maxCharLimit = 150;

    // Mostrar el conteo de caracteres
    charCountDisplay.textContent = `${charCount}/${maxCharLimit}`;
    charCountDisplay.style.color = charCount < minCharLimit ? 'red' : 'green';

    // Validar el botón "Next Item"
    validateNextButton(charCount, minCharLimit, maxCharLimit);
}
// Image Processing and Camera Functions
async function openCamera() {
    const item = inspectionItems[currentIndex];
    const requiredPhotos = item.requiredPhotos || 0;

    // Si no se requieren fotos, notificar y avanzar al siguiente ítem
    if (requiredPhotos === 0) {
        showNotification(`El ítem \"${item.name[currentLanguage]}\" no requiere fotos.`, 'info');
        return;
    }
 	// Inicializar el array de fotos si no existe
    if (!currentInspectionData[item.id]) {
        currentInspectionData[item.id] = { photos: [] };
    } else if (!currentInspectionData[item.id].photos) {
        currentInspectionData[item.id].photos = [];
    }

    // Verificar si ya tenemos todas las fotos requeridas
    if (currentInspectionData[item.id].photos.length >= requiredPhotos) {
        showNotification('Ya se han tomado todas las fotos requeridas.', 'warning');
        return;
    }
    // Evitar múltiples aperturas rápidas de la cámara
    if (Date.now() - lastCaptureTime < 1000) {
        console.log('Preventing multiple rapid camera opens');
        return;
    }

    lastCaptureTime = Date.now();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = true; // Permitir seleccionar múltiples fotos

    input.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);

        if (!files.length) {
            console.log('No se seleccionaron archivos');
            return;
        }

        // Asegurarse de inicializar el array de fotos
        if (!currentInspectionData[item.id]) {
            currentInspectionData[item.id] = { photos: [] };
        } else if (!Array.isArray(currentInspectionData[item.id].photos)) {
            currentInspectionData[item.id].photos = [];
        }

        for (let file of files) {
            try {
                // Validar el tamaño de la imagen
                if (file.size > 10 * 1024 * 1024) {
                    showNotification('La imagen es demasiado grande. Máximo 10MB.', 'error');
                    continue;
                }

                // Procesar la imagen usando handleImageProcessing
		    const processedImage = await handleImageProcessing(file);
		    if (!processedImage) {
		        showNotification('Error al procesar la imagen', 'error');
		        return;
		    }
                // Guarda la imagen procesada en el ítem actual
                currentInspectionData[item.id].photos.push(processedImage);

                showNotification('Foto procesada y cargada exitosamente.', 'success');

                // Actualiza la vista previa de la foto
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.src = processedImage;
                    photoPreview.style.display = 'block';
                }

            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                showNotification('Error al procesar la imagen.', 'error');
            }
        }

        // Validar si se alcanzó la cantidad de fotos requerida
        const currentPhotos = currentInspectionData[item.id].photos.length;
        if (currentPhotos >= requiredPhotos) {
            showNotification('Se han cargado todas las fotos requeridas.', 'success');
        } else {
            showNotification(
                `Faltan ${requiredPhotos - currentPhotos} fotos.`,
                'warning'
            );
        }
    });

    input.click();
}

/*async function openCamera() {
    const item = inspectionItems[currentIndex];
    const requiredPhotos = item.requiredPhotos || 0;

    // Si no se requieren fotos, notificar y avanzar al siguiente ítem
    if (requiredPhotos === 0) {
        showNotification(`El ítem "${item.name[currentLanguage]}" no requiere fotos.`, 'info');
        advanceToNextItem();
        return;
    }

    // Evitar múltiples aperturas rápidas de la cámara
    if (Date.now() - lastCaptureTime < 1000) {
        console.log('Preventing multiple rapid camera opens');
        return;
    }

    lastCaptureTime = Date.now();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = true; // Permitir seleccionar múltiples fotos

    input.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);

        if (!files.length) {
            console.log('No se seleccionaron archivos');
            return;
        }

        // Asegurarse de inicializar el array de fotos
        if (!currentInspectionData[item.id]) {
            currentInspectionData[item.id] = { photos: [] };
        } else if (!Array.isArray(currentInspectionData[item.id].photos)) {
            currentInspectionData[item.id].photos = [];
        }

        for (let file of files) {
            try {
                // Validar el tamaño de la imagen
                if (file.size > 10 * 1024 * 1024) {
                    showNotification('La imagen es demasiado grande. Máximo 10MB.', 'error');
                    continue;
                }

                // Procesar y redimensionar la imagen
                const resizedImage = await resizeImage(file);
                currentInspectionData[item.id].photos.push(resizedImage);

                showNotification('Foto cargada exitosamente.', 'success');
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                showNotification('Error al procesar la imagen.', 'error');
            }
        }

        // Mostrar la última foto cargada en la vista previa
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            const lastPhoto = currentInspectionData[item.id].photos.slice(-1)[0];
            photoPreview.src = lastPhoto;
            photoPreview.style.display = 'block';
        }

        // Validar si se alcanzó la cantidad de fotos requerida
        const currentPhotos = currentInspectionData[item.id].photos.length;
        if (currentPhotos >= requiredPhotos) {
            showNotification('Se han cargado todas las fotos requeridas.', 'success');
        } else {
            showNotification(
                `Faltan ${requiredPhotos - currentPhotos} fotos.`,
                'warning'
            );
        }
    });

    input.click();
}*/
async function compressImage(file, maxWidth = 1280, maxHeight = 960, quality = 0.6) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to WebP if supported
                const mimeType = 'image/webp';
                const compressedImage = canvas.toDataURL(mimeType, quality);
                
                // Clean up
                canvas.width = 0;
                canvas.height = 0;
                URL.revokeObjectURL(img.src);
                resolve(compressedImage);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function cleanupImages() {
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        URL.revokeObjectURL(photoPreview.src);
        photoPreview.src = '';
    }
}
function downloadPDF(index) {
    const records = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
    const record = records[index];
    
    if (!record) {
        showNotification('Error: Record not found', 'error');
        return;
    }
    
    generateInspectionPDF(record);
}
// Function to display records
function displayRecords(page = 1) {
    const recordsContainer = document.getElementById('recordsContainer');
    if (!recordsContainer) return;
    
    // Get all records
    let records = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
    
    // Filter records based on user role
    if (currentWorker.role !== 'admin') {
        records = records.filter(record => record.worker === currentWorker.name);
    }

    // Handle search and filters if they exist (for admin view)
    if (currentWorker.role === 'admin') {
        const searchTerm = document.getElementById('recordSearchInput')?.value?.toLowerCase();
        const statusFilter = document.getElementById('recordFilterStatus')?.value;
        
        if (searchTerm) {
            records = records.filter(record => 
                record.worker.toLowerCase().includes(searchTerm) ||
                record.truckId.toLowerCase().includes(searchTerm)
            );
        }
        
        if (statusFilter && statusFilter !== 'all') {
            records = records.filter(record => 
                Object.values(record.data).some(item => item.status === statusFilter)
            );
        }
    }

    // Sort records by date (newest first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination (only for admin view)
    const recordsPerPage = 10;
    let paginatedRecords = records;
    let totalPages = 1;
    
    if (currentWorker.role === 'admin') {
        totalPages = Math.ceil(records.length / recordsPerPage);
        const startIndex = (page - 1) * recordsPerPage;
        paginatedRecords = records.slice(startIndex, startIndex + recordsPerPage);
        
        // Update pagination controls if they exist
        const pageInfo = document.getElementById('pageInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (pageInfo) pageInfo.textContent = `Page ${page} of ${totalPages}`;
        if (prevPage) prevPage.disabled = page === 1;
        if (nextPage) nextPage.disabled = page === totalPages;
    }

    recordsContainer.innerHTML = '';

    if (paginatedRecords.length === 0) {
        recordsContainer.innerHTML = `
            <p class="text-center">
                <span data-lang="en">No inspection records found.</span>
                <span data-lang="es">No se encontraron registros de inspección.</span>
            </p>
        `;
        return;
    }

    paginatedRecords.forEach((record) => {
        let criticalCount = 0;
        let warningCount = 0;

        Object.values(record.data).forEach(item => {
            if (item.status === 'critical') criticalCount++;
            if (item.status === 'warning') warningCount++;
        });

        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';

        // Different layouts for admin and user views
        if (currentWorker.role === 'admin') {
            recordItem.innerHTML = `
                <div class="record-details">
                    <strong>${record.worker}</strong>
                    <div class="record-metadata">
                        <span class="record-timestamp">${new Date(record.date).toLocaleString()}</span>
                        ${criticalCount > 0 ? 
                            `<span class="record-status status-critical">${criticalCount} Critical</span>` : 
                            ''}
                        ${warningCount > 0 ? 
                            `<span class="record-status status-warning">${warningCount} Warning</span>` : 
                            ''}
                    </div>
                    <div>Truck ID: ${record.truckId}</div>
                </div>
                <div class="record-actions">
                    <button class="btn btn-secondary" onclick="viewRecordDetails('${record.truckId}')">
                        <span data-lang="en">Details</span>
                        <span data-lang="es">Detalles</span>
                    </button>
                    <button class="btn btn-secondary" onclick="downloadPDF('${record.truckId}')">PDF</button>
                </div>
            `;
        } else {
            // Simpler view for regular users
            recordItem.innerHTML = `
                <div>
                    <p><strong>${record.truckId} - ${record.date}</strong></p>
                    <div class="record-metadata">
                        ${criticalCount > 0 ? 
                            `<span class="record-status status-critical">${criticalCount} Critical</span>` : 
                            ''}
                        ${warningCount > 0 ? 
                            `<span class="record-status status-warning">${warningCount} Warning</span>` : 
                            ''}
                    </div>
                </div>
                <button class="btn" onclick="downloadPDF('${record.truckId}')">PDF</button>
            `;
        }

        recordsContainer.appendChild(recordItem);
    });
    
    // Update language display
    updateLanguage();
}
// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('recordSearchInput')?.addEventListener('input', 
        debounce(() => displayRecords(1), 300));
    document.getElementById('recordFilterStatus')?.addEventListener('change', 
        () => displayRecords(1));
    document.getElementById('prevPage')?.addEventListener('click', 
        () => displayRecords(--currentPage));
    document.getElementById('nextPage')?.addEventListener('click', 
        () => displayRecords(++currentPage));
});
/*function displayRecords() {
    const recordsContainer = document.getElementById('recordsContainer');
    if (!recordsContainer) return;
    
    recordsContainer.innerHTML = '';
    
    const records = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
    
    if (records.length === 0) {
        recordsContainer.innerHTML = `
            <p>
                <span data-lang="en">No inspection records found.</span>
                <span data-lang="es">No se encontraron registros de inspección.</span>
            </p>
        `;
        return;
    }
    records.forEach((record, index) => {
        let criticalCount = 0;
        let warningCount = 0;

        Object.values(record.data).forEach(item => {
            if (item.status === 'critical') criticalCount++;
            if (item.status === 'warning') warningCount++;
        });

        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';

        recordItem.innerHTML = `
            <div>
                <p><strong>${record.worker}</strong></p>
                <p>${record.truckId} - ${record.date}</p>
                <div class="record-metadata">
                    ${criticalCount > 0 ? 
                        `<span class="record-status status-critical">${criticalCount} Critical</span>` : 
                        ''}
                    ${warningCount > 0 ? 
                        `<span class="record-status status-warning">${warningCount} Warning</span>` : 
                        ''}
                </div>
            </div>
            <button class="btn" onclick="downloadPDF(${index})">PDF</button>
        `;

        recordsContainer.appendChild(recordItem);
    });
    
    // Update language display
    updateLanguage();
}*/
async function resizeImage(file, maxWidth = 1280, maxHeight = 960, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64
                resolve(canvas.toDataURL('image/jpeg', quality));
            };

            img.onerror = () => reject(new Error('Error loading image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
    });
}
async function analyzePhotoWithOpenAI(base64Images) {
    console.log('Starting analyzePhotoWithOpenAI function...');

    const item = inspectionItems[currentIndex];

    if (!item) {
        console.error('No current inspection item found!');
        return 'Error: No current inspection item found';
    }

    const componentName = item.name[currentLanguage];
    console.log('Current inspection item:', JSON.stringify(item, null, 2));
    console.log('Component name:', componentName);
    console.log('Base64 images count:', base64Images.length);

    // Verificar si el ítem no requiere fotos
    if (item.requiredPhotos === 0) {
        console.log(`No photo analysis required for component: ${componentName}`);
        return `Component: ${componentName}\nStatus: No photo analysis required`;
    }

    if (!Array.isArray(base64Images) || base64Images.length === 0) {
        console.error('No images provided for analysis');
        return `Error: No images provided for analysis for ${componentName}`;
    }

    // Listas predefinidas de estados y problemas
    const validStatuses = [
        "Condición óptima",
        "Leve desgaste",
        "Desgaste moderado",
        "Requiere reparación menor",
        "Requiere reparación urgente",
        "No funcional"
    ];

    const validIssues = [
        "No presenta problemas",
        "Daño cosmético menor",
        "Daño estructural",
        "Problema funcional",
        "Conexión floja",
        "Falta de ajuste adecuado",
        "Acumulación de suciedad"
    ];

    try {
        const responses = await Promise.allSettled(
            base64Images.map(async (base64Image, index) => {
                const payload = {
                    prompt: componentName,
                    image: base64Image.split(',')[1], // Base64 sin el prefijo
                };

                console.log(`Payload enviado al backend para imagen ${index + 1}:`, JSON.stringify(payload, null, 2));

                const response = await fetch('/api/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                console.log(`Response status for image ${index + 1}:`, response.status);

                if (!response.ok) {
                    const errorDetails = await response.text();
                    console.error(`HTTP error for image ${index + 1}:`, response.status, errorDetails);
                    throw new Error(`HTTP error: ${response.status} - ${errorDetails}`);
                }

                const data = await response.json();
                console.log(`Response data for image ${index + 1}:`, JSON.stringify(data, null, 2));

                if (data.refusal) {
                    console.warn(`Refusal for image ${index + 1}:`, data.refusal);
                    return `Refusal for image ${index + 1}: ${data.refusal}`;
                }

                if (data.result?.component && data.result?.status) {
                    const status = data.result.status;
                    const issues = data.result.issues || [];

                    // Validar el estado y los problemas
                    if (!validStatuses.includes(status)) {
                        console.error(`Invalid status received for image ${index + 1}:`, status);
                        return `Error: Invalid status received for image ${index + 1}`;
                    }

                    const invalidIssues = issues.filter(issue => !validIssues.includes(issue));
                    if (invalidIssues.length > 0) {
                        console.error(`Invalid issues received for image ${index + 1}:`, invalidIssues);
                        return `Error: Invalid issues received for image ${index + 1}`;
                    }

                    return `Component: ${data.result.component}\nStatus: ${status}\nIssues: ${issues.join(', ') || 'Ninguno'}`;
                } else {
                    console.error(`Invalid response format for image ${index + 1}:`, JSON.stringify(data, null, 2));
                    return `Error: Invalid response format for image ${index + 1}`;
                }
            })
        );

        const processedResponses = responses.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`Error processing image ${index + 1}:`, result.reason);
                return `Error processing image ${index + 1}: ${result.reason.message}`;
            }
        });

        console.log('All responses processed:', JSON.stringify(processedResponses, null, 2));
        return processedResponses.join('\n');
    } catch (error) {
        console.error('Unexpected error analyzing photos:', error);
        return 'Error analyzing photos';
    }
}

// Admin Dashboard Functions
function showAdminDashboard() {
    showScreen('adminScreen');
    document.getElementById('menuToggleBtn').style.display = 'block';
    updateAdminStats();
    updateRecentInspections();
}

function updateAdminStats() {
    if (!window.records) window.records = [];
    
    const stats = {
        totalInspections: window.records.length,
        criticalCount: 0,
        activeVehicles: new Set()
    };

    window.records.forEach(record => {
        stats.activeVehicles.add(record.truckId);
        
        const hasCritical = Object.values(record.data).some(
            item => item.status === 'critical'
        );
        if (hasCritical) stats.criticalCount++;
    });

    // Update UI
    document.getElementById('totalInspections').textContent = stats.totalInspections;
    document.getElementById('criticalIssues').textContent = stats.criticalCount;
    document.getElementById('activeVehicles').textContent = stats.activeVehicles.size;
}

function updateRecentInspections() {
    const tableBody = document.getElementById('recentInspectionsTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const recentInspections = window.records?.slice(-5).reverse() || [];

    recentInspections.forEach(inspection => {
        const hasCritical = Object.values(inspection.data).some(
            item => item.status === 'critical'
        );
        const hasWarning = Object.values(inspection.data).some(
            item => item.status === 'warning'
        );
        
        const status = hasCritical ? 'Critical' : hasWarning ? 'Warning' : 'OK';
        const statusColor = hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : '#10b981';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${inspection.date}</td>
            <td>${inspection.worker}</td>
            <td>${inspection.truckId}</td>
            <td><span style="color: ${statusColor}; font-weight: bold;">${status}</span></td>
            <td>
                <button class="btn" onclick="viewInspectionDetails('${inspection.truckId}')">
                    View Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// User Management Functions
function showUserManagement() {
    toggleSidebar();
    showScreen('userManagementScreen');
    displayUsers();
}
function showMetrics() {
    updateMetricsDisplay();
    toggleSidebar();
    showScreen('metricsScreen');
    // Placeholder for future metrics initialization
    console.log('Metrics screen shown - ready for future implementation');
}
function displayUsers() {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    Object.entries(workers).forEach(([id, user]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td>${user.lastActivity || 'No activity'}</td>
            <td>${user.status}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser('${id}')">Edit</button>
                <button class="btn btn-secondary" onclick="toggleUserStatus('${id}')">
                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
function updateMetricsDisplay() {
    // Get all inspection records
    const records = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
    const fleetConditions = records.map(record => record.overallCondition?.score || 0);
    //calculate average overallcondition
    const averageCondition = fleetConditions.length > 0
    ? fleetConditions.reduce((acc, curr) => acc + curr, 0) / fleetConditions.length
    : 0;
    // Calculate average inspection time
    const timesWithDuration = records.filter(record => record.duration);
    const averageTime = timesWithDuration.length > 0
        ? timesWithDuration.reduce((acc, curr) => acc + curr.duration, 0) / timesWithDuration.length
        : 0;
        
    // Calculate times by inspector
    const inspectorTimes = {};
    timesWithDuration.forEach(record => {
        if (!inspectorTimes[record.worker]) {
            inspectorTimes[record.worker] = [];
        }
        inspectorTimes[record.worker].push(record.duration);
    });

    // Format time for display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Update the average time card
    const averageTimeDisplay = document.getElementById('averageTimeValue');
    if (averageTimeDisplay) {
        averageTimeDisplay.textContent = formatTime(averageTime);
    }
     // Update the overall condition card
    const fleetConditionDisplay = document.getElementById('fleetConditionValue');
    if (fleetConditionDisplay) {
    fleetConditionDisplay.textContent = `${averageCondition.toFixed(1)}%`;
    }
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart('inspectionTimesChart');
    if (existingChart) {
        existingChart.destroy();
    }

    // Create data for the chart
    const chartData = Object.entries(inspectorTimes).map(([inspector, times]) => ({
        inspector,
        averageTime: times.reduce((acc, curr) => acc + curr, 0) / times.length
    }));
    
    // Update the chart
    const ctx = document.getElementById('inspectionTimesChart');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.inspector),
                datasets: [{
                    label: 'Average Inspection Time (seconds)',
                    data: chartData.map(d => d.averageTime),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (seconds)'
                        }
                    }
                }
            }
        });
    }
    // Create fleet condition chart
    const fleetCtx = document.getElementById('fleetConditionChart');
	if (fleetCtx && window.Chart) {
	    new Chart(fleetCtx, {
	        type: 'line',
	        data: {
	            labels: records.map(r => new Date(r.date).toLocaleDateString()),
	            datasets: [{
	                label: 'Vehicle Condition %',
	                data: fleetConditions,
	                borderColor: '#3b82f6',
	                tension: 0.1
	            }]
	        },
	        options: {
	            responsive: true,
	            scales: {
	                y: {
	                    beginAtZero: true,
	                    max: 100
	                }
	            }
	        }
	    });
	  }

}
/*function updateMetricsDisplay() {
    // Get all inspection records
    const records = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
    
    // Calculate average inspection time
    const timesWithDuration = records.filter(record => record.duration);
    const averageTime = timesWithDuration.length > 0
        ? timesWithDuration.reduce((acc, curr) => acc + curr.duration, 0) / timesWithDuration.length
        : 0;
        
    // Calculate times by inspector
    const inspectorTimes = {};
    timesWithDuration.forEach(record => {
        if (!inspectorTimes[record.worker]) {
            inspectorTimes[record.worker] = [];
        }
        inspectorTimes[record.worker].push(record.duration);
    });

    // Format time for display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Update the average time card
    const averageTimeDisplay = document.getElementById('averageTimeValue');
    if (averageTimeDisplay) {
        averageTimeDisplay.textContent = formatTime(averageTime);
    }

    // Create data for the chart
    const chartData = Object.entries(inspectorTimes).map(([inspector, times]) => ({
        inspector,
        averageTime: times.reduce((acc, curr) => acc + curr, 0) / times.length
    }));

    // Update the chart
    const ctx = document.getElementById('inspectionTimesChart');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.inspector),
                datasets: [{
                    label: 'Average Inspection Time (seconds)',
                    data: chartData.map(d => d.averageTime),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (seconds)'
                        }
                    }
                }
            }
        });
    }
}*/
function showAddUserForm() {
    const userModal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const userForm = document.getElementById('userForm');
    
    modalTitle.textContent = 'Add User';
    userForm.reset();
    userModal.style.display = 'block';
}

function editUser(userId) {
    const user = workers[userId];
    if (!user) return;

    const elements = {
        modal: document.getElementById('userModal'),
        title: document.getElementById('modalTitle'),
        id: document.getElementById('userId'),
        name: document.getElementById('userName'),
        role: document.getElementById('userRole'),
        password: document.getElementById('userPassword')
    };

    elements.title.textContent = 'Edit User';
    elements.id.value = user.id;
    elements.name.value = user.name;
    elements.role.value = user.role;
    elements.password.value = user.password;
    elements.modal.style.display = 'block';
}

function handleUserSubmit(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
        id: userId,
        name: document.getElementById('userName').value,
        role: document.getElementById('userRole').value,
        password: document.getElementById('userPassword').value,
        status: 'active',
        lastActivity: new Date().toLocaleString()
    };

    workers[userId] = userData;
    closeUserModal();
    displayUsers();
    showNotification('User saved successfully', 'success');
}

function toggleUserStatus(userId) {
    if (!workers[userId]) return;
    
    workers[userId].status = workers[userId].status === 'active' ? 'inactive' : 'active';
    displayUsers();
    showNotification(
        `User ${workers[userId].status === 'active' ? 'activated' : 'deactivated'} successfully`,
        'success'
    );
}

function closeUserModal() {
    const userModal = document.getElementById('userModal');
    if (userModal) userModal.style.display = 'none';
}

// Sidebar Management
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('open');
    
    const menuBtn = document.getElementById('menuToggleBtn');
    if (menuBtn) {
        menuBtn.innerHTML = sidebar.classList.contains('open') ? '✕' : '☰';
    }
}
// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('customNotification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `custom-notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
// New function for handling back to login
function backToLogin() {
    if (confirm('Are you sure you want to logout?')) {
        currentWorker = null;
        // Hide admin menu
        const menuBtn = document.getElementById('menuToggleBtn');
        const sidebar = document.getElementById('adminSidebar');
        if (menuBtn) menuBtn.style.display = 'none';
        if (sidebar) sidebar.classList.remove('open');
        
        // Reset any open screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // Show login screen
        showScreen('loginScreen');
        
        // Clear any stored data
        localStorage.removeItem('currentWorker');
    }
}
// Initialize records screen events
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('recordSearchInput');
    const filterSelect = document.getElementById('recordFilterStatus');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            displayRecords(currentPage);
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            currentPage = 1;
            displayRecords(currentPage);
        });
    }
    
    // Initialize pagination buttons
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayRecords(currentPage);
        }
    });
    
    document.getElementById('nextPage')?.addEventListener('click', () => {
        const records = filterRecords();
        const totalPages = Math.ceil(records.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayRecords(currentPage);
        }
    });
});
function showInspectionRecords() {
    // First toggle the sidebar
    toggleSidebar();
    
    // Show the records screen
    showScreen('recordsScreen');
    
    // Reset to first page
    currentPage = 1;
    
    // Display the records
    displayRecords(currentPage);
    
    // Initialize any filters to default state
    const searchInput = document.getElementById('recordSearchInput');
    const filterSelect = document.getElementById('recordFilterStatus');
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = 'all';
}
/*function backToLogin() {
    if (confirm('Are you sure you want to logout?')) {
        currentWorker = null;
        showScreen('loginScreen');
    }
}*/
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validateInputs() {
    const workerId = document.getElementById('workerId').value.trim();
    const password = document.getElementById('workerPassword').value.trim();

    const workerIdPattern = /^\d{4,6}$/;
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/;

    if (!workerIdPattern.test(workerId)) {
        showNotification('Worker ID must contain 4-6 digits', 'error');
        return false;
    }

    if (!passwordPattern.test(password)) {
        showNotification('Password must contain letters and numbers, 6-12 characters', 'error');
        return false;
    }

    return true;
}

// Mobile Optimization Functions
function initializeMobileOptimizations() {
    setupTouchHandling();
    fixIOSIssues();
    handleOrientationChanges();
    setupScrolling();
}

function setupTouchHandling() {
    // Remove the existing event listeners for buttons, inputs, and selects
    document.querySelectorAll('button').forEach(element => {
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            element.click();
        });
    });

    // Add passive touch handlers
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
}

function fixIOSIssues() {
    // Fix input zoom
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }

    // Fix iOS input focus
    document.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            document.body.scrollTop = 0;
        }
    }, true);
}

function handleOrientationChanges() {
    window.addEventListener('orientationchange', () => {
        // Reset scroll position
        window.scrollTo(0, 0);
        
        // Update viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Recalculate layouts after orientation change
        setTimeout(() => {
            updateScreenForMobile(
                document.querySelector('.screen.active')?.id
            );
        }, 300);
    });
}

function setupScrolling() {
    // Enable smooth scrolling
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.overflow = 'auto';
        screen.style.webkitOverflowScrolling = 'touch';
        screen.addEventListener('scroll', handleScroll);
    });
}

function handleScroll(e) {
    const navButtons = document.querySelector('.nav-buttons');
    if (!navButtons) return;

    const scrollHeight = e.target.scrollHeight;
    const scrollTop = e.target.scrollTop;
    const clientHeight = e.target.clientHeight;

    // Show/hide navigation based on scroll position
    navButtons.classList.toggle(
        'nav-buttons-visible',
        scrollHeight - scrollTop === clientHeight
    );
}

// Error Handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An error occurred. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('Operation failed. Please try again.', 'error');
});

// Cache Management
const CacheManager = {
    set: async (key, data, expiry = 3600) => {
        try {
            const item = {
                data,
                timestamp: Date.now(),
                expiry
            };
            await localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },
    
    get: async (key) => {
        try {
            const item = JSON.parse(await localStorage.getItem(key));
            if (!item) return null;
            
            if (Date.now() - item.timestamp > item.expiry * 1000) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
};
document.addEventListener('DOMContentLoaded', function() {
    // Initialize buttons
    initializeStatusButtons();
    initializeLoginButtons(); // Add this line
    
    // Initial language update
    updateLanguage();
    
    // Initialize any other necessary components
    setupEventListeners();
});

//error handler
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    showNotification(`Error: ${error.message}`, 'error');
}
//funcion de filtro para la pantalla de admin
function filterUsers() {
  console.log("filterUsers function called. Functionality to be implemented.");
  // Aquí agregarás la lógica para filtrar usuarios en el futuro
}

// Export functions to window
Object.assign(window, {
    login,
    startDemoMode,
    showScreen,
    startInspection,
    previousItem,
    nextItem,
    openCamera,
    toggleLanguage,
    toggleTheme,
    showUserManagement,
    toggleSidebar
});
