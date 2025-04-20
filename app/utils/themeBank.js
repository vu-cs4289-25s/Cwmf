// utils/themeBank.js

const themeBank = [
    "Terrible names for a pirate ship",
    "Thing you'd call the person sitting next to you",
    "Rejected movie titles",
    "Bad restaurant names",
    "Terrible names for a tech startup",
    "Rejected ice cream flavors",
    "Terrible names for a superhero",
    "Slogans for a terrible restaurant",
    "Name Hemingway would give to a programming langauge",
    "Terrible names for a TV show",
    "Terrible name for a new military weapon",
    "New trendy acoronym for the kids with swag to use",
    "Aconyms for common daily activites",
    "Terrible villain names",
    "What Hemingway would be called if he was a super hero",
    "Names for a trendy fashion brand",
    "Weird name for a vehicle",
    "Rejected superhero names",
    "Weird things to whisper in someone's ear",
    "Worst names for a pet dog",
    "Worst names for a pet cat",
    "Rejected astronaut mission codenames",
    "Terrible titles for a self-help book",
    "Things you shouldn't name your firstborn child",
    "Rejected health insurance company jingles",
    "Worst possible names for a funeral home",
    "Ridiculous names for medieval weapons",
    "Terrible slogans for a dentist's office",
    "Rejected brand names for cold medicine",
    "Terrible names for a rock band",
    "Inadvisable tattoo ideas",
    "Names for imaginary diseases",
    "Rejected Olympic sports",
    "Unusual things to collect as a hobby",
    "Terrible campaign slogans",
    "Worst possible WiFi network names",
    "Rejected names for breakfast cereals",
    "Unusual things to whisper to houseplants",
    "Terrible names for a clown",
    "What a toddler would name a spaceship",
    "Terrible slogans for an airline",
    "Rejected holiday traditions",
    "Worst possible names for a law firm",
];

/**
 * Get a random theme from the bank, avoiding previously used themes
 * @param {Array} usedThemeIndices - Array of indices of themes that have already been used
 * @returns {Object} - An object with the theme and its index
 */
export const getRandomTheme = (usedThemeIndices = []) => {
    // Convert usedThemeIndices to a Set for faster lookups
    const usedSet = new Set(usedThemeIndices);

    // Get available indices (excluding used ones)
    const availableIndices = [];
    for (let i = 0; i < themeBank.length; i++) {
        if (!usedSet.has(i)) {
            availableIndices.push(i);
        }
    }

    // If all themes have been used or there's an error, reset and use any theme
    if (availableIndices.length === 0) {
        const randomIndex = Math.floor(Math.random() * themeBank.length);
        return {
            theme: themeBank[randomIndex],
            index: randomIndex
        };
    }

    // Pick a random theme from the available ones
    const randomAvailableIndex = Math.floor(Math.random() * availableIndices.length);
    const selectedThemeIndex = availableIndices[randomAvailableIndex];

    return {
        theme: themeBank[selectedThemeIndex],
        index: selectedThemeIndex
    };
};

// Get all themes for selection
export const getAllThemes = () => {
    return themeBank;
};

// Default theme if nothing is selected
export const getDefaultTheme = () => {
    return "Things a pirate would say";
};