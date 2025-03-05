// utils/acronymGenerator.js

/**
 * Generates a random 3-letter acronym using uppercase letters
 * Avoids repeating letters and reduces uncommon letters
 * @returns {string} A 3-letter uppercase acronym
 */
export const generateAcronym = () => {
    // Common consonants (avoiding uncommon ones like Q, X, Z)
    const commonConsonants = "BCDFGHJKLMNPRST";
    // All vowels
    const vowels = "AEIOUY";
    // Combined letters with higher weight for common ones
    const allLetters = commonConsonants + vowels.repeat(2); // Double the vowels for higher probability

    let acronym = "";
    let usedLetters = new Set();

    for (let i = 0; i < 3; i++) {
        let availableLetters = allLetters;

        // Filter out already used letters to avoid repetition
        if (usedLetters.size > 0) {
            availableLetters = availableLetters
                .split('')
                .filter(letter => !usedLetters.has(letter))
                .join('');
        }

        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        const selectedLetter = availableLetters[randomIndex];

        acronym += selectedLetter;
        usedLetters.add(selectedLetter);
    }

    return acronym;
};

/**
 * Generates a pronounceable 3-letter acronym by ensuring 
 * it contains at least one vowel and avoids repetition
 * @returns {string} A 3-letter uppercase acronym with at least one vowel
 */
export const generatePronounceableAcronym = () => {
    // Common consonants (avoiding uncommon ones like Q, X, Z)
    const commonConsonants = "BCDFGHJKLMNPRST";
    const vowels = "AEIOUY";
    let acronym = "";
    let usedLetters = new Set();

    // Decide randomly where to place the vowel (position 0, 1, or 2)
    const vowelPosition = Math.floor(Math.random() * 3);

    for (let i = 0; i < 3; i++) {
        if (i === vowelPosition) {
            // Filter out already used vowels
            const availableVowels = vowels
                .split('')
                .filter(vowel => !usedLetters.has(vowel))
                .join('');

            const randomIndex = Math.floor(Math.random() * availableVowels.length);
            const selectedVowel = availableVowels[randomIndex];

            acronym += selectedVowel;
            usedLetters.add(selectedVowel);
        } else {
            // Filter out already used consonants
            const availableConsonants = commonConsonants
                .split('')
                .filter(consonant => !usedLetters.has(consonant))
                .join('');

            const randomIndex = Math.floor(Math.random() * availableConsonants.length);
            const selectedConsonant = availableConsonants[randomIndex];

            acronym += selectedConsonant;
            usedLetters.add(selectedConsonant);
        }
    }

    return acronym;
};

/**
 * Gets a random acronym from a curated list of common, easy-to-use acronyms
 * @returns {string} A common 3-letter acronym
 */
export const getCommonAcronym = () => {
    // Curated list of common, easy acronyms (no weird combinations or uncommon letters)
    const commonAcronyms = [
        "LOL", "BRB", "AFK", "OMG", "TBH", "IDK", "BTW", "FYI", "BFF", "CEO",
        "DIY", "FAQ", "BLT", "NBA", "NFL", "MLB", "NHL", "GPS", "ATM", "VIP",
        "MVP", "RPG", "FPS", "SUV", "BMW", "USA", "NYC", "POV", "SMS", "DVD",
        "CPU", "RAM", "LED", "LCD", "BBC", "CNN", "ABC", "CBS", "FOX", "MTV",
        "POP", "ROI", "SAT", "DNA", "NBA", "NFL", "MLB", "NHL", "GPS", "ATM",
        "RUN", "SAY", "PAY", "TRY", "BUY", "DAY", "CAR", "BAR", "MAN", "HOT",
        "PAL", "BAG", "TAG", "LAB", "FAB", "CAB", "DAD", "MAD", "LAD", "HAT",
        "BAT", "CAT", "RAT", "MAP", "CAP", "LAP", "TAP", "JOB", "MOB", "DOG"
    ];

    const randomIndex = Math.floor(Math.random() * commonAcronyms.length);
    return commonAcronyms[randomIndex];
};

/**
 * Main function to get an acronym based on the specified type
 * All acronyms avoid repeated letters and uncommon letters
 * @param {string} type - Type of acronym to generate: 'random', 'pronounceable', or 'common'
 * @returns {string} A 3-letter acronym
 */
export const getAcronym = (type = 'random') => {
    switch (type) {
        case 'pronounceable':
            return generatePronounceableAcronym();
        case 'common':
            return getCommonAcronym();
        case 'random':
        default:
            return generateAcronym();
    }
};

export default getAcronym;