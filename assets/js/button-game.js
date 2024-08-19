let emojiPool = [];
let moneyCount = 0;
let currentRecipe = [];
let rareButtonPurchased = false;
let legendaryButtonPurchased = false;

document.addEventListener('DOMContentLoaded', () => {
    loadEmojiPool().then(() => {
        loadMoneyCount();
        loadPets(); // Load saved pets
        document.getElementById('collectButton').addEventListener('click', collectEmoji);
        document.getElementById('craftButton').addEventListener('click', craftItem);
        document.getElementById('shopItems').addEventListener('click', handleShopPurchase);
        document.getElementById('trashcan').addEventListener('mousedown', handleTrashcanHold);
        generateRandomRecipe();
        updateInventory();
    });
});

async function loadEmojiPool() {
    try {
        const response = await fetch('assets/json/emojiPool.json');
        if (!response.ok) throw new Error('Failed to load emoji pool');
        emojiPool = await response.json();
    } catch (error) {
        console.error('Error loading emoji pool:', error);
    }
}

function handleTrashcanHold(event) {
    let holdTime = 0;
    const interval = setInterval(() => {
        holdTime += 100;
        if (holdTime >= 1000) {
            clearInterval(interval);
            if (confirm('Are you sure you want to reset your game?')) {
                resetGame();
            }
        }
    }, 100);

    document.addEventListener('mouseup', function stopHold() {
        clearInterval(interval);
        document.removeEventListener('mouseup', stopHold);
    });
}

function resetGame() {
    localStorage.clear();
    location.reload(); // Reload the page to apply the reset
}

function addPetToScreen(emoji, name = '', savedX = '50%', savedY = '50%') {
    const pet = document.createElement('div');
    pet.className = 'pet';
    pet.innerText = `${emoji} ${name}`;
    pet.style.top = savedY;
    pet.style.left = savedX;
    document.body.appendChild(pet);

    pet.addEventListener('mousedown', function(event) {
        event.preventDefault(); // Prevent text selection
        let shiftX = event.clientX - pet.getBoundingClientRect().left;
        let shiftY = event.clientY - pet.getBoundingClientRect().top;

        function onMouseMove(event) {
            pet.style.left = event.pageX - shiftX + 'px';
            pet.style.top = event.pageY - shiftY + 'px';

            // Prevent the pet from being dragged off-screen
            if (parseInt(pet.style.left) < 0) pet.style.left = '0px';
            if (parseInt(pet.style.top) < 0) pet.style.top = '0px';
            if (parseInt(pet.style.left) > window.innerWidth - pet.offsetWidth) {
                pet.style.left = `${window.innerWidth - pet.offsetWidth}px`;
            }
            if (parseInt(pet.style.top) > window.innerHeight - pet.offsetHeight) {
                pet.style.top = `${window.innerHeight - pet.offsetHeight}px`;
            }
        }

        document.addEventListener('mousemove', onMouseMove);

        pet.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            const trashcan = document.getElementById('trashcan');
            const trashRect = trashcan.getBoundingClientRect();
            const petRect = pet.getBoundingClientRect();

            // Collision detection for trashcan
            if (
                petRect.right > trashRect.left &&
                petRect.left < trashRect.right &&
                petRect.bottom > trashRect.top &&
                petRect.top < trashRect.bottom
            ) {
                pet.remove();
                deletePet(emoji, name);
            } else {
                savePet(emoji, name, pet.style.left, pet.style.top); // Save the new position
            }

            pet.onmouseup = null;
        };

        pet.ondragstart = function() {
            return false;
        };
    });
}

function deletePet(emoji, name) {
    let pets = JSON.parse(localStorage.getItem('pets')) || [];
    pets = pets.filter(pet => !(pet.emoji === emoji && pet.name === name));
    localStorage.setItem('pets', JSON.stringify(pets));
}

function handleShopPurchase(event) {
    if (event.target.classList.contains('buyButton')) {
        const shopItem = event.target.closest('.shop-item');
        const itemType = shopItem.getAttribute('data-type');
        const itemPrice = parseInt(shopItem.getAttribute('data-price'));

        if (moneyCount >= itemPrice) {
            moneyCount -= itemPrice;
            saveMoneyCount();

            if (itemType === 'rare-button') {
                rareButtonPurchased = true;
                shopItem.querySelector('span').innerText += ' ⭐';
            } else if (itemType === 'legendary-button') {
                legendaryButtonPurchased = true;
                shopItem.querySelector('span').innerText += ' 🔥';
            } else if (itemType === 'pet') {
                const emoji = shopItem.querySelector('span').innerText.trim();
                const petName = prompt("Enter a name for your new pet:");
                if (petName) {
                    alert(`You bought a pet: ${emoji} ${petName}!`);
                    addPetToScreen(emoji, petName);
                    savePet(emoji, petName);
                }
            } else if (itemType === 'button-skin') {
                const skinClass = shopItem.getAttribute('data-skin-class');
                document.getElementById('collectButton').className = skinClass;
                localStorage.setItem('buttonSkin', skinClass); // Save the skin to localStorage
                alert('You applied a new button skin!');
            }
            updateMoneyDisplay();
        } else {
            alert('You do not have enough money to buy this item.');
        }
    }
}

function savePet(emoji, name, x = '50%', y = '50%') {
    let pets = JSON.parse(localStorage.getItem('pets')) || [];
    const existingPetIndex = pets.findIndex(pet => pet.emoji === emoji && pet.name === name);

    if (existingPetIndex !== -1) {
        // Update the position of the existing pet
        pets[existingPetIndex] = { emoji, name, x, y };
    } else {
        // Add a new pet
        pets.push({ emoji, name, x, y });
    }

    localStorage.setItem('pets', JSON.stringify(pets));
}

function loadPets() {
    const pets = JSON.parse(localStorage.getItem('pets')) || [];
    pets.forEach(pet => {
        addPetToScreen(pet.emoji, pet.name, pet.x, pet.y);
    });
}

function updateMoneyDisplay() {
    document.getElementById('coinCount').innerText = `Money: 💵 ${moneyCount}`;
}

function collectEmoji() {
    const emoji = getRandomEmoji();
    displayEmoji(emoji);
    saveToInventory(emoji);
    triggerFallingAnimation(emoji);
    updateInventory();
    displayRecipe();
}

function addMoney(amount) {
    moneyCount += amount;
    saveMoneyCount();
    updateMoneyDisplay();
    triggerFallingAnimation({ emoji: '💵' });  // Make the money emoji fall
}

function getRandomEmoji() {
    const totalWeight = emojiPool.reduce((sum, item) => {
        let weight = item.weight;
        if (legendaryButtonPurchased) {
            weight *= 0.1;  // Increase likelihood of legendary
        } else if (rareButtonPurchased) {
            weight *= 0.5;  // Increase likelihood of rare
        }
        return sum + weight;
    }, 0);

    let rand = Math.floor(Math.random() * totalWeight);

    for (let item of emojiPool) {
        let weight = item.weight;
        if (legendaryButtonPurchased) {
            weight *= 0.1;
        } else if (rareButtonPurchased) {
            weight *= 0.5;
        }
        if (rand < weight) {
            return item;
        }
        rand -= weight;
    }

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
    const inventory = JSON.parse(localStorage.getItem('emojiInventory')) || {};

    currentRecipe.forEach(item => {
        const ownedCount = inventory[item.emoji]?.count || 0;
        const listItem = document.createElement('div');
        listItem.innerText = `${item.emoji} x${item.count} [${ownedCount}]`;
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
        addMoney(1);  // Earn 1 money for crafting an item
        generateRandomRecipe(); // Generate a new recipe
        updateInventory();      // Update the inventory display
    } else {
        alert('You do not have the required emojis to craft this recipe.');
    }
}

function loadMoneyCount() {
    const storedMoney = localStorage.getItem('moneyCount');
    if (storedMoney) {
        moneyCount = parseInt(storedMoney, 10);
    }
    document.getElementById('coinCount').innerText = `Money: 💵 ${moneyCount}`;

    // Load the button skin from localStorage
    const storedSkin = localStorage.getItem('buttonSkin');
    if (storedSkin) {
        document.getElementById('collectButton').className = storedSkin;
    }
}

function saveMoneyCount() {
    localStorage.setItem('moneyCount', moneyCount);
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
