let emojiPool = [];
let coinCount = 0;
let currentRecipe = [];

// Load data and initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadEmojiPool().then(() => {
        loadCoinCount();  // Load coin count from local storage
        document.getElementById('collectButton').addEventListener('click', collectEmoji);
        document.getElementById('craftButton').addEventListener('click', craftItem);
        
        generateRandomRecipe();  // Generate and display the initial recipe
        updateInventory();       // Update the inventory display
    });
});

function loadEmojiPool() {
    return fetch('assets/json/emojiPool.json')
        .then(response => response.json())
        .then(data => emojiPool = data)
        .catch(error => console.error('Error loading emoji pool:', error));
}

function collectEmoji() {
    const emoji = getRandomEmoji();
    displayEmoji(emoji);
    saveToInventory(emoji);
    triggerFallingAnimation(emoji);  // Trigger the falling animation
    updateInventory();  // Update the inventory display after collecting an emoji
}

function getRandomEmoji() {
    const totalWeight = emojiPool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.floor(Math.random() * totalWeight);

    for (let item of emojiPool) {
        if (rand < item.weight) {
            return item;
        }
        rand -= item.weight;
    }

    // Fallback in case something goes wrong
    return emojiPool[0];
}

function displayEmoji(emoji) {
    document.getElementById('emojiDisplay').innerText = `You collected: ${emoji.emoji} (${emoji.rarity})`;
}

function saveToInventory(emoji) {
    let inventory = JSON.parse(localStorage.getItem('emojiInventory')) || {};
    if (inventory[emoji.emoji]) {
        inventory[emoji.emoji].count += 1;
    } else {
        inventory[emoji.emoji] = { count: 1, rarity: emoji.rarity };
    }
    localStorage.setItem('emojiInventory', JSON.stringify(inventory));
}

function updateInventory() {
    const inventory = JSON.parse(localStorage.getItem('emojiInventory')) || {};
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';

    for (const [emoji, data] of Object.entries(inventory)) {
        let listItem = document.createElement('div');
        listItem.innerText = `${emoji}: ${data.count} (${data.rarity})`;
        inventoryList.appendChild(listItem);
    }
}

function generateRandomRecipe() {
    const recipeSize = Math.floor(Math.random() * 3) + 2; // Recipe requires 2-4 different emojis
    const selectedEmojis = [];

    for (let i = 0; i < recipeSize; i++) {
        const randomIndex = Math.floor(Math.random() * emojiPool.length);
        const selectedEmoji = emojiPool[randomIndex];
        selectedEmojis.push({ emoji: selectedEmoji.emoji, count: Math.floor(Math.random() * 3) + 1 });
    }

    currentRecipe = selectedEmojis;
    displayRecipe();
}

function displayRecipe() {
    const recipeList = document.getElementById('recipeList');
    recipeList.innerHTML = ''; // Clear existing recipe

    currentRecipe.forEach(item => {
        const listItem = document.createElement('div');
        listItem.innerText = `${item.emoji} x${item.count}`;
        recipeList.appendChild(listItem);
    });
}

function craftItem() {
    const inventory = JSON.parse(localStorage.getItem('emojiInventory')) || {};
    let canCraft = true;

    currentRecipe.forEach(item => {
        if (!inventory[item.emoji] || inventory[item.emoji].count < item.count) {
            canCraft = false;
        }
    });

    if (canCraft) {
        currentRecipe.forEach(item => {
            inventory[item.emoji].count -= item.count;
            if (inventory[item.emoji].count <= 0) {
                delete inventory[item.emoji];
            }
        });

        localStorage.setItem('emojiInventory', JSON.stringify(inventory));
        coinCount++;
        saveCoinCount();  // Save updated coin count to local storage
        document.getElementById('coinCount').innerText = `Coins: ${coinCount}`;
        generateRandomRecipe(); // Generate a new recipe
        updateInventory();      // Update the inventory display
    } else {
        alert('You do not have the required emojis to craft this recipe.');
    }
}

function loadCoinCount() {
    const storedCoins = localStorage.getItem('coinCount');
    if (storedCoins) {
        coinCount = parseInt(storedCoins, 10);
    }
    document.getElementById('coinCount').innerText = `Coins: ${coinCount}`;
}

function saveCoinCount() {
    localStorage.setItem('coinCount', coinCount);
}

function wipeInventory() {
    localStorage.removeItem('emojiInventory');
    document.getElementById('inventoryList').innerHTML = '';
    document.getElementById('emojiDisplay').innerText = 'Inventory wiped!';
    updateInventory();
}

function triggerFallingAnimation(emoji) {
    const fallingEmoji = document.createElement('div');
    fallingEmoji.className = 'falling-emoji';
    fallingEmoji.innerText = emoji.emoji;
    
    // Generate a random x-position between 0% and 100% of the viewport width
    const randomX = Math.random() * 100;
    fallingEmoji.style.left = `${randomX}%`;

    document.body.appendChild(fallingEmoji);

    fallingEmoji.addEventListener('animationend', () => {
        fallingEmoji.remove();
    });
}
