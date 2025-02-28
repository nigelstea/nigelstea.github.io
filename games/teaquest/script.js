// Game Variables
let scene, camera, renderer, controls;
let teaLeaves = [];
let leavesCollected = 0;
let teasServed = 0;
let score = 0;
let brewingTime = 3000;
let playerSpeed = 0.2;
let kettle;
let waterSources = [];
let customer; // Static customer

let inventory = {
    black: 0,
    green: 0,
    herbal: 0,
    water: 0,
    tea: {
        'Yorkshire Gold': 0,
        'Green Tea': 0,
        'Herbal Infusion': 0,
        'Blended Tea': 0,
        'Total': 0
    }
};

const teaRecipes = {
    'Yorkshire Gold': { black: 3, green: 0, herbal: 0 },
    'Green Tea': { black: 0, green: 3, herbal: 0 },
    'Herbal Infusion': { black: 0, green: 0, herbal: 3 },
    'Blended Tea': { black: 2, green: 1, herbal: 1 }
};

// Game State
let gameStarted = false;

// Initialize the Game
function init() {
    // Only initialize if the game hasn't started yet
    if (gameStarted) {
        return;
    }
    gameStarted = true;

    // Hide Main Menu
    document.getElementById('mainMenu').style.display = 'none';
    // Show game overlays
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('recipesPanel').style.display = 'block';

    // Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Create Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 25);

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Append the renderer's DOM element only once
    document.body.appendChild(renderer.domElement);

    // Add OrbitControls for camera movement
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Add Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-5, 10, 5);
    scene.add(directionalLight);

    // Add Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    scene.add(ground);

    // Initialize Objects
    createPlayer();
    setupControls();
    createTeaLeaves(30);
    createWaterSources();
    createKettle();
    createCustomer(); // Create static customer

    // Set up Raycaster
    raycaster = new THREE.Raycaster();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);

    // Respawn Leaves Interval
    setInterval(respawnLeaves, 5000); // Every 5 seconds

    // Start Animation Loop
    animate();
}

// Player Variables
let player;
let keysPressed = {};

// Create Player
function createPlayer() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);
    scene.add(player);
}

// Set Up Controls
function setupControls() {
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key.toLowerCase()] = false;
    });
}

// Create Tea Leaves
const leafTypes = ['black', 'green', 'herbal'];
const leafColors = {
    black: 0x654321,
    green: 0x008000,
    herbal: 0xFFA500
};

function createTeaLeaves(quantity) {
    for (let i = 0; i < quantity; i++) {
        const type = leafTypes[Math.floor(Math.random() * leafTypes.length)];
        const leafGeometry = new THREE.DodecahedronGeometry(0.5);
        const leafMaterial = new THREE.MeshLambertMaterial({ color: leafColors[type] });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.userData.type = type;

        leaf.position.set(
            (Math.random() - 0.5) * 90,
            0.5,
            (Math.random() - 0.5) * 90
        );

        scene.add(leaf);
        teaLeaves.push(leaf);
    }
}

// Respawn Tea Leaves
function respawnLeaves() {
    const currentLeaves = teaLeaves.length;
    if (currentLeaves < 30) {
        createTeaLeaves(30 - currentLeaves);
    }
}

// Create Water Sources (Pond)
function createWaterSources() {
    const pondGeometry = new THREE.CircleGeometry(5, 32);
    const pondMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-20, 0.01, -20);
    pond.userData.type = 'waterSource';
    pond.userData.collected = false;
    scene.add(pond);
    waterSources.push(pond);
}

// Create Kettle
function createKettle() {
    const kettleGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    const kettleMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    kettle = new THREE.Mesh(kettleGeometry, kettleMaterial);
    kettle.position.set(20, 1, -20);
    kettle.userData.type = 'kettle';
    scene.add(kettle);
}

// Create Static Customer
function createCustomer() {
    const customerGeometry = new THREE.BoxGeometry(2, 4, 2);
    const customerMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // Gold color
    customer = new THREE.Mesh(customerGeometry, customerMaterial);
    customer.position.set(0, 2, -30);
    customer.userData.type = 'customer';
    customer.userData.cooldown = false;
    scene.add(customer);
}

// Handle Window Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update Inventory Display
function updateInventoryDisplay() {
    document.getElementById('blackCount').innerText = inventory.black;
    document.getElementById('greenCount').innerText = inventory.green;
    document.getElementById('herbalCount').innerText = inventory.herbal;
    document.getElementById('waterCount').innerText = inventory.water;
    document.getElementById('teaCount').innerText = inventory.tea.Total;
    document.getElementById('ygTeaCount').innerText = inventory.tea['Yorkshire Gold'];
    document.getElementById('greenTeaCount').innerText = inventory.tea['Green Tea'];
    document.getElementById('herbalTeaCount').innerText = inventory.tea['Herbal Infusion'];
    document.getElementById('blendedTeaCount').innerText = inventory.tea['Blended Tea'];
}

// Brew Tea Function
function brewTea(teaName) {
    const recipe = teaRecipes[teaName];
    // Check if player has enough leaves and water
    const hasIngredients = Object.keys(recipe).every(type => inventory[type] >= recipe[type]);
    if (hasIngredients && inventory.water > 0) {
        // Check if player is near the kettle
        if (distanceBetween(player.position, kettle.position) < 5) {
            // Deduct ingredients
            Object.keys(recipe).forEach(type => {
                inventory[type] -= recipe[type];
            });
            inventory.water--;
            updateInventoryDisplay();
            // Simulate brewing time
            document.getElementById('brewStatus').innerText = `Boiling water in the kettle...`;
            setTimeout(() => {
                document.getElementById('brewStatus').innerText = `Brewing ${teaName}...`;
                setTimeout(() => {
                    inventory.tea[teaName]++;
                    inventory.tea.Total++;
                    updateInventoryDisplay();
                    document.getElementById('brewStatus').innerText = `${teaName} is ready!`;
                }, brewingTime);
            }, 2000); // Time to boil water
        } else {
            document.getElementById('brewStatus').innerText = 'You need to be near the kettle to brew tea.';
        }
    } else {
        document.getElementById('brewStatus').innerText = `Not enough ingredients or water for ${teaName}.`;
    }
}

// Give Tea to Customer
function giveTeaToCustomer() {
    if (inventory.tea.Total > 0) {
        // Deduct one tea from the total and from any available type
        for (const teaType in inventory.tea) {
            if (teaType !== 'Total' && inventory.tea[teaType] > 0) {
                inventory.tea[teaType]--;
                break;
            }
        }
        inventory.tea.Total--;
        updateInventoryDisplay();
        teasServed++;
        score += 10;
        document.getElementById('customersServed').innerText = teasServed;
        document.getElementById('score').innerText = score;
        document.getElementById('brewStatus').innerText = `You served tea to the customer!`;
    } else {
        document.getElementById('brewStatus').innerText = `You don't have any tea to serve.`;
    }
}

// Buy Upgrades Function
function buyUpgrade(type) {
    if (type === 'speed' && score >= 50) {
        score -= 50;
        playerSpeed += 0.05;
        document.getElementById('score').innerText = score;
        document.getElementById('brewStatus').innerText = 'Player speed increased!';
    } else if (type === 'brewSpeed' && score >= 70) {
        score -= 70;
        brewingTime = Math.max(500, brewingTime - 500);
        document.getElementById('score').innerText = score;
        document.getElementById('brewStatus').innerText = 'Brewing speed increased!';
    } else {
        document.getElementById('brewStatus').innerText = 'Not enough points or invalid upgrade.';
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Player movement
    if (keysPressed['w'] || keysPressed['arrowup']) {
        player.position.z -= playerSpeed;
    }
    if (keysPressed['s'] || keysPressed['arrowdown']) {
        player.position.z += playerSpeed;
    }
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        player.position.x -= playerSpeed;
    }
    if (keysPressed['d'] || keysPressed['arrowright']) {
        player.position.x += playerSpeed;
    }

    // Keep player within bounds
    player.position.x = THREE.MathUtils.clamp(player.position.x, -49, 49);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -49, 49);

    // Update camera and controls
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 15;
    controls.target.set(player.position.x, player.position.y, player.position.z);
    controls.update();

    // Check for collisions with tea leaves
    teaLeaves.forEach((leaf, index) => {
        if (distanceBetween(player.position, leaf.position) < 1) {
            // Collect the leaf
            inventory[leaf.userData.type]++;
            updateInventoryDisplay();
            scene.remove(leaf);
            teaLeaves.splice(index, 1);
            leavesCollected++;
            document.getElementById('leavesCollected').innerText = leavesCollected;
        }
    });

    // Collect water automatically when near water source
    waterSources.forEach((waterSource) => {
        if (distanceBetween(player.position, waterSource.position) < 5) {
            if (!waterSource.userData.collected) {
                inventory.water++;
                updateInventoryDisplay();
                waterSource.userData.collected = true;
                setTimeout(() => {
                    waterSource.userData.collected = false; // Allow collecting again after 1 second
                }, 1000); // Reduced cooldown to 1 second
            }
        }
    });

    // Interact with customer
    if (distanceBetween(player.position, customer.position) < 3) {
        if (!customer.userData.cooldown) {
            giveTeaToCustomer();
            customer.userData.cooldown = true;
            setTimeout(() => {
                customer.userData.cooldown = false; // Prevent immediate re-serving
            }, 1000);
        }
    }

    renderer.render(scene, camera);
}

// Calculate Distance Between Two Points
function distanceBetween(point1, point2) {
    const dx = point1.x - point2.x;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dz * dz);
}

// Handle Main Menu Buttons
document.getElementById('playButton').addEventListener('click', () => {
    init();
});

document.getElementById('homeButton').addEventListener('click', () => {
    window.location.href = 'https://nigelstea.github.io/';
});

document.getElementById('settingsButton').addEventListener('click', () => {
    alert('What settings are there to change? This game is already perfect!');
});

// No need to call init() here; it will be called when the Play button is clicked.
