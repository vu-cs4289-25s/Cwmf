// utils/themeBank.js

const themeBank = [
    "Things a pirate would say",
    "Things a superhero would say before saving someone",
    "Rejected movie titles",
    "Bad excuses for being late",
    "Things you shouldn't say on a first date",
    "Terrible business ideas",
    "Rejected ice cream flavors",
    "Things a cat would say if it could talk",
    "Slogans for a terrible restaurant",
    "Things Graham Hemingway would say in lecture",
    "Things you wouldn't want to hear from your doctor",
    "Bad advice to give a college freshman",
    "Things aliens would say about humans",
    "Ridiculous names for a pet",
    "Worst responses to 'I love you'",
    "Signs your roommate is actually a supervillain",
    "Bad reasons to call tech support",
    "Strange things to find in your backpack",
    "Weird things to say at a job interview",
    "Terrible opening lines for a novel",
    "Things not to say to a police officer",
    "Worst ways to start a presentation",
    "Unlikely celebrity presidential campaign slogans",
    "Strange things to see on a road trip",
    "Unusual uses for common household items",
    "Things Graham Hemingway would say in lecture",
    "Excuses Hemingway would accept for late assignments",
    "Ways Hemingway would start a class",
    "Things Hemingway would do if you're late to a meeting",
    "Hemingway's thoughts on your code",
    "Feedback Hemingway would give on your project",
    "Hemingway's programming tips",
    "Things you'd find in Hemingway's office",
    "Questions Hemingway would ask in an interview",
    "How Hemingway would explain React to a 5-year-old",
    "Hemingway's favorite coding phrases",
    "Excuses for why your code doesn't work that Hemingway has heard",
    "Things Hemingway mutters while grading assignments",
    "How Hemingway would respond to 'It works on my machine'",
    "Hemingway's reactions to Stack Overflow answers",
    "Things Hemingway would say during debugging",
    "Hemingway's thoughts on your variable naming choices",
    "Things Hemingway would say during a code review",
    "Hemingway's advice for surviving your computer science degree",
    "Rejected superhero names",
    "Weird things to whisper in someone's ear"
];

// Get a random theme from the bank
export const getRandomTheme = () => {
    const randomIndex = Math.floor(Math.random() * themeBank.length);
    return themeBank[randomIndex];
};

// Get all themes for selection
export const getAllThemes = () => {
    return themeBank;
};

// Default theme if nothing is selected
export const getDefaultTheme = () => {
    return "Things a pirate would say";
};