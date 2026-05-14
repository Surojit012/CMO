const fs = require('fs');

let content = fs.readFileSync('components/OutreachPlanView.tsx', 'utf-8');

// Colors replacement mapping
const replacements = [
  [/bg-white(?!\/)/g, 'bg-white dark:bg-zinc-900'],
  [/bg-white\/80/g, 'bg-white/80 dark:bg-zinc-900/80'],
  [/bg-zinc-50/g, 'bg-zinc-50 dark:bg-zinc-800/50'],
  [/bg-zinc-100/g, 'bg-zinc-100 dark:bg-zinc-800'],
  [/bg-zinc-200/g, 'bg-zinc-200 dark:bg-zinc-700'],
  
  [/text-zinc-900/g, 'text-zinc-900 dark:text-zinc-100'],
  [/text-zinc-800/g, 'text-zinc-800 dark:text-zinc-200'],
  [/text-zinc-700/g, 'text-zinc-700 dark:text-zinc-300'],
  [/text-zinc-600/g, 'text-zinc-600 dark:text-zinc-400'],
  [/text-zinc-500/g, 'text-zinc-500 dark:text-zinc-400'],
  [/text-zinc-400/g, 'text-zinc-400 dark:text-zinc-500'],
  
  [/border-zinc-100/g, 'border-zinc-100 dark:border-white/5'],
  [/border-zinc-200/g, 'border-zinc-200 dark:border-white/10'],
  [/border-zinc-300/g, 'border-zinc-300 dark:border-white/20'],
  [/border-black\/5/g, 'border-black/5 dark:border-white/10'],
  
  [/ring-black\/5/g, 'ring-black/5 dark:ring-white/10'],
  [/ring-zinc-100/g, 'ring-zinc-100 dark:ring-white/5'],
  [/ring-zinc-200/g, 'ring-zinc-200 dark:ring-white/10'],
  
  // Specific sections like Viral Angles
  [/bg-gradient-to-br from-indigo-50 to-purple-50/g, 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30'],
  [/ring-indigo-100/g, 'ring-indigo-100 dark:ring-indigo-500/20'],
  [/text-indigo-900/g, 'text-indigo-900 dark:text-indigo-300'],
  [/text-indigo-950/g, 'text-indigo-950 dark:text-indigo-200'],
];

for (const [pattern, replacement] of replacements) {
  content = content.replace(pattern, replacement);
}

// Ensure no double dark: classes
content = content.replace(/dark:dark:/g, 'dark:');
content = content.replace(/dark:bg-zinc-900 dark:bg-zinc-900/g, 'dark:bg-zinc-900');
content = content.replace(/bg-white dark:bg-zinc-900\/10/g, 'bg-white/10'); // Fix any weird edge cases
content = content.replace(/bg-white dark:bg-zinc-900\/50/g, 'bg-white/50'); // Fix any weird edge cases

fs.writeFileSync('components/OutreachPlanView.tsx', content);
console.log('Successfully updated OutreachPlanView.tsx colors for dark mode.');
