import * as fs from 'fs';
import * as handlebars from 'handlebars';

// Register Handlebars helpers
handlebars.registerHelper('percentage', (completed: number, total: number) => {
  return ((completed / total) * 100).toFixed(1);
});

handlebars.registerHelper('progressBar', (percentage: number) => {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
});

handlebars.registerHelper('statusIcon', (status: string) => {
  const icons: Record<string, string> = {
    'completed': '✅',
    'in_progress': '🚧',
    'in-progress': '🚧', // Handle both formats
    'draft': '📋',
    'blocked': '🚫'
  };
  return icons[status] || '';
});

function generateIndex() {
  // Load spec data
  const specData = JSON.parse(fs.readFileSync('specs-data.json', 'utf-8'));
  
  // Calculate additional stats
  const totalSpecs = specData.stats.total_epics + 
                    specData.stats.total_features + 
                    specData.stats.total_tasks;
  
  const completedCount = specData.stats.completed.length;
  const progressPercentage = totalSpecs > 0 ? (completedCount / totalSpecs) * 100 : 0;
  
  // Add calculated values
  specData.calculated = {
    totalSpecs,
    completedCount,
    progressPercentage: progressPercentage.toFixed(1),
    progressBar: '█'.repeat(Math.round(progressPercentage / 5)) + 
                 '░'.repeat(20 - Math.round(progressPercentage / 5)),
    lastUpdated: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
  };
  
  // Load template
  const templatePath = 'templates/index.template.md';
  const template = fs.readFileSync(templatePath, 'utf-8');
  
  // Compile and generate
  const compiled = handlebars.compile(template);
  const output = compiled(specData);
  
  // Write index.md
  fs.writeFileSync('specs/index.md', output);
  console.log('✅ index.md generated successfully');
  console.log(`   Total specs: ${totalSpecs}`);
  console.log(`   Completed: ${completedCount}`);
  console.log(`   Progress: ${progressPercentage.toFixed(1)}%`);
}

// Run if called directly
if (require.main === module) {
  generateIndex();
}

export { generateIndex };