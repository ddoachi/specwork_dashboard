import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

interface SpecMetadata {
  id: string;
  title: string;
  type: 'epic' | 'feature' | 'task';
  parent?: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  children?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  pull_requests?: string[];
  commits?: string[];
}

interface SpecData {
  specs: Record<string, SpecMetadata>;
  stats: {
    total_epics: number;
    total_features: number;
    total_tasks: number;
    completed: string[];
    in_progress: string[];
    draft: string[];
    blocked: string[];
  };
  hierarchy: Record<string, any>;
}

async function parseAllSpecs(): Promise<SpecData> {
  const specFiles = await glob('specs/**/spec.md');
  const specs: Record<string, SpecMetadata> = {};
  const hierarchy: Record<string, any> = {};
  
  // Parse each spec file
  for (const file of specFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);
    
    // Extract directory structure for type-prefixed naming
    const dir = path.dirname(file);
    const parts = dir.split('/');
    const specId = parts[parts.length - 1]; // E01, F01, T01, etc.
    
    specs[specId] = {
      id: specId,
      title: data.title,
      type: data.type,
      parent: data.parent,
      status: data.status || 'draft',
      priority: data.priority || 'medium',
      created: data.created,
      updated: data.updated,
      children: data.children,
      estimated_hours: data.estimated_hours,
      actual_hours: data.actual_hours,
      pull_requests: data.pull_requests,
      commits: data.commits,
    };
    
    // Build hierarchy
    if (data.type === 'epic') {
      hierarchy[specId] = {
        ...specs[specId],
        features: {}
      };
    } else if (data.type === 'feature' && data.parent) {
      if (!hierarchy[data.parent]) {
        hierarchy[data.parent] = { 
          ...specs[data.parent],
          features: {} 
        };
      }
      hierarchy[data.parent].features[specId] = {
        ...specs[specId],
        tasks: {}
      };
    } else if (data.type === 'task' && data.parent) {
      // Find parent feature in hierarchy
      for (const epicId in hierarchy) {
        const epic = hierarchy[epicId];
        if (epic.features && epic.features[data.parent]) {
          epic.features[data.parent].tasks[specId] = specs[specId];
          break;
        }
      }
    }
  }
  
  // Calculate statistics
  const stats = {
    total_epics: Object.values(specs).filter(s => s.type === 'epic').length,
    total_features: Object.values(specs).filter(s => s.type === 'feature').length,
    total_tasks: Object.values(specs).filter(s => s.type === 'task').length,
    completed: Object.keys(specs).filter(id => specs[id].status === 'completed'),
    in_progress: Object.keys(specs).filter(id => specs[id].status === 'in_progress' || specs[id].status === 'in_progress'),
    draft: Object.keys(specs).filter(id => specs[id].status === 'draft'),
    blocked: Object.keys(specs).filter(id => specs[id].status === 'blocked'),
  };
  
  const specData: SpecData = { specs, stats, hierarchy };
  
  // Save to JSON file
  fs.writeFileSync('specs-data.json', JSON.stringify(specData, null, 2));
  
  return specData;
}

// Run if called directly
if (require.main === module) {
  parseAllSpecs()
    .then(() => console.log('✅ Specs parsed successfully'))
    .catch(console.error);
}

export { parseAllSpecs, SpecMetadata, SpecData };