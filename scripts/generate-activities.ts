#!/usr/bin/env ts-node
/**
 * Activity Generation Script
 * Analyzes specs and generates rich activity data with file content analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { Database } from 'sqlite3';
import * as crypto from 'crypto';

interface Spec {
  id: string;
  hierarchical_id?: string;
  title: string;
  type: 'epic' | 'feature' | 'task';
  status: string;
  parent?: string;
  created: string;
  updated: string;
  children?: string;
  pull_requests?: string;
  commits?: string;
  context_file?: string;
  effort?: string;
  risk?: string;
  estimated_hours: number;
  actual_hours: number;
}

interface Activity {
  spec_id: string;
  hierarchical_id?: string;
  activity_type: string;
  title: string;
  description: string;
  content_preview?: string;
  metadata: any;
  spec_path?: string;
  context_path?: string;
  created_at: string;
  spec_snapshot?: any;
}

interface FileContent {
  spec?: string;
  context?: string;
  hasDiscussion: boolean;
  hasReview: boolean;
  hasImplementation: boolean;
  hasAcceptanceCriteria: boolean;
  hasDeliverables: boolean;
}

class ActivityGenerator {
  private db: Database;
  private specsDir: string;
  private activities: Activity[] = [];
  private fileCache: Map<string, FileContent> = new Map();

  constructor(databasePath: string, specsDirectory: string) {
    this.db = new Database(databasePath);
    this.specsDir = specsDirectory;
  }

  /**
   * Convert hierarchical ID to file system path
   * E01-F01-T05 -> E01/F01/T05
   */
  private hierarchicalIdToPath(hierarchicalId: string): string {
    const parts = hierarchicalId.split('-');
    return parts.join('/');
  }

  /**
   * Read and analyze spec files
   */
  private async analyzeSpecFiles(hierarchicalId: string): Promise<FileContent> {
    if (this.fileCache.has(hierarchicalId)) {
      return this.fileCache.get(hierarchicalId)!;
    }

    const specPath = this.hierarchicalIdToPath(hierarchicalId);
    const fullSpecPath = path.join(this.specsDir, specPath, 'spec.md');
    const fullContextPath = path.join(this.specsDir, specPath, 'context.md');

    const result: FileContent = {
      hasDiscussion: false,
      hasReview: false,
      hasImplementation: false,
      hasAcceptanceCriteria: false,
      hasDeliverables: false
    };

    // Read spec.md if exists
    if (fs.existsSync(fullSpecPath)) {
      try {
        result.spec = fs.readFileSync(fullSpecPath, 'utf8');
        const specContent = result.spec.toLowerCase();
        
        // Analyze content for activity indicators
        result.hasDiscussion = specContent.includes('discussion') || 
                               specContent.includes('question') || 
                               specContent.includes('clarification') ||
                               specContent.includes('## open questions');
        
        result.hasReview = specContent.includes('review') || 
                          specContent.includes('approved') || 
                          specContent.includes('feedback') ||
                          specContent.includes('## review notes');
        
        result.hasImplementation = specContent.includes('implementation') || 
                                   specContent.includes('```') || // Code blocks
                                   specContent.includes('development') ||
                                   specContent.includes('## technical approach');
        
        result.hasAcceptanceCriteria = specContent.includes('acceptance criteria') ||
                                       specContent.includes('## acceptance') ||
                                       specContent.includes('- [ ]'); // Checkboxes
        
        result.hasDeliverables = specContent.includes('deliverable') ||
                                specContent.includes('## output') ||
                                specContent.includes('## artifacts');
      } catch (error) {
        console.warn(`Could not read spec file: ${fullSpecPath}`);
      }
    }

    // Read context.md if exists
    if (fs.existsSync(fullContextPath)) {
      try {
        result.context = fs.readFileSync(fullContextPath, 'utf8');
      } catch (error) {
        console.warn(`Could not read context file: ${fullContextPath}`);
      }
    }

    this.fileCache.set(hierarchicalId, result);
    return result;
  }

  /**
   * Extract content preview from spec/context files
   */
  private getContentPreview(content: string | undefined, maxLength: number = 200): string | undefined {
    if (!content) return undefined;
    
    // Remove markdown headers and clean up
    const cleaned = content
      .replace(/^#+\s+.*$/gm, '') // Remove headers
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate activity type based on comprehensive analysis
   */
  private async generateActivityFromSpec(spec: Spec, previousState?: Spec): Promise<Activity[]> {
    const activities: Activity[] = [];
    const fileContent = spec.hierarchical_id ? await this.analyzeSpecFiles(spec.hierarchical_id) : null;
    const specPath = spec.hierarchical_id ? `specs/${this.hierarchicalIdToPath(spec.hierarchical_id)}/spec.md` : null;
    const contextPath = spec.hierarchical_id ? `specs/${this.hierarchicalIdToPath(spec.hierarchical_id)}/context.md` : null;

    // Detect spec creation (new specs)
    const createdDate = new Date(spec.created);
    const updatedDate = new Date(spec.updated);
    const ageHours = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    if (ageHours < 24) {
      activities.push({
        spec_id: spec.id,
        hierarchical_id: spec.hierarchical_id,
        activity_type: 'spec_created',
        title: 'New Spec Created',
        description: `New ${spec.type} "${spec.title}" has been created`,
        content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
        metadata: {
          spec_type: spec.type,
          parent: spec.parent,
          effort: spec.effort,
          risk: spec.risk
        },
        spec_path: specPath,
        context_path: contextPath,
        created_at: spec.created,
        spec_snapshot: spec
      });
    }

    // Detect spec review
    if (fileContent?.hasReview) {
      activities.push({
        spec_id: spec.id,
        hierarchical_id: spec.hierarchical_id,
        activity_type: 'spec_reviewed',
        title: 'Spec Reviewed',
        description: `Spec "${spec.title}" has been reviewed and feedback provided`,
        content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
        metadata: { has_feedback: true },
        spec_path: specPath,
        context_path: contextPath,
        created_at: spec.updated,
        spec_snapshot: spec
      });
    }

    // Detect discussions
    if (fileContent?.hasDiscussion) {
      activities.push({
        spec_id: spec.id,
        hierarchical_id: spec.hierarchical_id,
        activity_type: 'spec_discussion',
        title: 'Active Discussion',
        description: `Discussion ongoing for "${spec.title}" - questions and clarifications being addressed`,
        content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
        metadata: { has_open_questions: true },
        spec_path: specPath,
        context_path: contextPath,
        created_at: spec.updated,
        spec_snapshot: spec
      });
    }

    // Detect spec split (has children)
    if (spec.children && spec.children !== '[]') {
      try {
        const childrenArray = typeof spec.children === 'string' 
          ? (spec.children.startsWith('[') ? JSON.parse(spec.children) : spec.children.split(','))
          : spec.children;
        if (Array.isArray(childrenArray) && childrenArray.length > 0) {
          activities.push({
            spec_id: spec.id,
            hierarchical_id: spec.hierarchical_id,
            activity_type: 'spec_split',
            title: 'Spec Split',
            description: `Spec "${spec.title}" has been split into ${childrenArray.length} subtasks`,
            metadata: { 
              children_count: childrenArray.length,
              children: childrenArray
            },
            spec_path: specPath,
            context_path: contextPath,
            created_at: spec.updated,
            spec_snapshot: spec
          });
        }
      } catch (e) {
        // Invalid children format, skip
      }
    }

    // Detect implementation status changes
    switch (spec.status) {
      case 'in_progress':
        activities.push({
          spec_id: spec.id,
          hierarchical_id: spec.hierarchical_id,
          activity_type: fileContent?.hasImplementation ? 'spec_implementation_progress' : 'spec_implementation_started',
          title: fileContent?.hasImplementation ? 'Implementation Progress' : 'Implementation Started',
          description: fileContent?.hasImplementation 
            ? `Progress update on "${spec.title}" implementation`
            : `Implementation of "${spec.title}" has begun`,
          content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
          metadata: {
            estimated_hours: spec.estimated_hours,
            actual_hours: spec.actual_hours,
            progress_percentage: spec.estimated_hours > 0 
              ? Math.round((spec.actual_hours / spec.estimated_hours) * 100)
              : 0
          },
          spec_path: specPath,
          context_path: contextPath,
          created_at: spec.updated,
          spec_snapshot: spec
        });
        break;

      case 'completed':
        activities.push({
          spec_id: spec.id,
          hierarchical_id: spec.hierarchical_id,
          activity_type: 'spec_implemented',
          title: 'Spec Implemented',
          description: `"${spec.title}" has been successfully implemented and completed`,
          content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
          metadata: {
            total_hours: spec.actual_hours,
            efficiency: spec.estimated_hours > 0 
              ? Math.round((spec.actual_hours / spec.estimated_hours) * 100)
              : null
          },
          spec_path: specPath,
          context_path: contextPath,
          created_at: spec.updated,
          spec_snapshot: spec
        });
        break;

      case 'blocked':
        activities.push({
          spec_id: spec.id,
          hierarchical_id: spec.hierarchical_id,
          activity_type: 'spec_blocked',
          title: 'Spec Blocked',
          description: `"${spec.title}" is blocked and needs attention`,
          content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
          metadata: { risk: spec.risk },
          spec_path: specPath,
          context_path: contextPath,
          created_at: spec.updated,
          spec_snapshot: spec
        });
        break;
    }

    // Detect PR/Commit links
    if (spec.pull_requests && spec.pull_requests !== '[]') {
      try {
        const prs = typeof spec.pull_requests === 'string' 
          ? (spec.pull_requests.startsWith('[') ? JSON.parse(spec.pull_requests) : spec.pull_requests.split(','))
          : spec.pull_requests;
        if (Array.isArray(prs) && prs.length > 0) {
          activities.push({
            spec_id: spec.id,
            hierarchical_id: spec.hierarchical_id,
            activity_type: 'pr_linked',
            title: 'Pull Request Linked',
            description: `${prs.length} pull request(s) linked to "${spec.title}"`,
            metadata: { pull_requests: prs },
            spec_path: specPath,
            context_path: contextPath,
            created_at: spec.updated,
            spec_snapshot: spec
          });
        }
      } catch (e) {
        // Invalid PR format, skip
      }
    }

    if (spec.commits && spec.commits !== '[]') {
      try {
        const commits = typeof spec.commits === 'string' 
          ? (spec.commits.startsWith('[') ? JSON.parse(spec.commits) : spec.commits.split(','))
          : spec.commits;
        if (Array.isArray(commits) && commits.length > 0) {
          activities.push({
            spec_id: spec.id,
            hierarchical_id: spec.hierarchical_id,
            activity_type: 'commit_linked',
            title: 'Commits Linked',
            description: `${commits.length} commit(s) linked to "${spec.title}"`,
            metadata: { commits: commits },
            spec_path: specPath,
            context_path: contextPath,
            created_at: spec.updated,
            spec_snapshot: spec
          });
        }
      } catch (e) {
        // Invalid commit format, skip
      }
    }

    // Detect context updates
    if (fileContent?.context) {
      activities.push({
        spec_id: spec.id,
        hierarchical_id: spec.hierarchical_id,
        activity_type: 'context_updated',
        title: 'Context Updated',
        description: `Context documentation updated for "${spec.title}"`,
        content_preview: this.getContentPreview(fileContent.context),
        metadata: {},
        spec_path: specPath,
        context_path: contextPath,
        created_at: spec.updated,
        spec_snapshot: spec
      });
    }

    // If no specific activity detected, generate a generic update
    if (activities.length === 0 && ageHours >= 24) {
      activities.push({
        spec_id: spec.id,
        hierarchical_id: spec.hierarchical_id,
        activity_type: 'spec_updated',
        title: 'Spec Updated',
        description: `Spec "${spec.title}" has been updated`,
        content_preview: fileContent ? this.getContentPreview(fileContent.spec) : undefined,
        metadata: {},
        spec_path: specPath,
        context_path: contextPath,
        created_at: spec.updated,
        spec_snapshot: spec
      });
    }

    return activities;
  }

  /**
   * Generate activities from all specs in database
   */
  async generateAllActivities(): Promise<Activity[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM specs ORDER BY updated DESC`,
        async (err, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          console.log(`📊 Processing ${rows.length} specs...`);
          
          for (const spec of rows) {
            const specActivities = await this.generateActivityFromSpec(spec);
            this.activities.push(...specActivities);
          }

          // Sort by created_at descending
          this.activities.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          resolve(this.activities);
        }
      );
    });
  }

  /**
   * Save activities to database
   */
  async saveToDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Clear existing activities (for demo - in production, you'd want to merge)
        this.db.run('DELETE FROM spec_activities', (err) => {
          if (err && !err.message.includes('no such table')) {
            console.warn('Could not clear existing activities:', err.message);
          }
        });

        // Prepare insert statement
        const stmt = this.db.prepare(`
          INSERT INTO spec_activities (
            spec_id, hierarchical_id, activity_type, title, description,
            content_preview, metadata, spec_path, context_path, created_at, spec_snapshot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Insert each activity
        for (const activity of this.activities) {
          stmt.run(
            activity.spec_id,
            activity.hierarchical_id,
            activity.activity_type,
            activity.title,
            activity.description,
            activity.content_preview,
            JSON.stringify(activity.metadata),
            activity.spec_path,
            activity.context_path,
            activity.created_at,
            JSON.stringify(activity.spec_snapshot)
          );
        }

        stmt.finalize((err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Saved ${this.activities.length} activities to database`);
            resolve();
          }
        });
      });
    });
  }

  /**
   * Export activities to JSON file
   */
  async exportToJson(outputPath: string): Promise<void> {
    const output = {
      generated_at: new Date().toISOString(),
      total_activities: this.activities.length,
      activities: this.activities,
      summary: this.generateSummary()
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`📁 Exported to ${outputPath}`);
  }

  /**
   * Generate activity summary statistics
   */
  private generateSummary(): any {
    const typeCounts: Record<string, number> = {};
    const specCounts: Record<string, number> = {};
    
    for (const activity of this.activities) {
      typeCounts[activity.activity_type] = (typeCounts[activity.activity_type] || 0) + 1;
      specCounts[activity.hierarchical_id || activity.spec_id] = 
        (specCounts[activity.hierarchical_id || activity.spec_id] || 0) + 1;
    }

    return {
      by_type: typeCounts,
      most_active_specs: Object.entries(specCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([spec, count]) => ({ spec, activity_count: count }))
    };
  }

  close(): void {
    this.db.close();
  }
}

// Main execution
async function main() {
  const databasePath = process.argv[2] || 'backend/db/specs.sqlite';
  const specsDirectory = process.argv[3] || 'specs';
  const outputPath = process.argv[4] || 'activity-data.json';

  console.log('🚀 Activity Generation Started');
  console.log(`📂 Database: ${databasePath}`);
  console.log(`📁 Specs directory: ${specsDirectory}`);
  console.log(`💾 Output: ${outputPath}`);
  console.log('');

  const generator = new ActivityGenerator(databasePath, specsDirectory);

  try {
    const activities = await generator.generateAllActivities();
    
    console.log(`\n📋 Generated ${activities.length} total activities`);
    
    // Show sample activities
    console.log('\n🔍 Sample Activities:');
    activities.slice(0, 10).forEach((activity, index) => {
      console.log(`\n${index + 1}. ${activity.title} (${activity.activity_type})`);
      console.log(`   📝 ${activity.description}`);
      if (activity.content_preview) {
        console.log(`   📄 Preview: ${activity.content_preview.substring(0, 80)}...`);
      }
      if (activity.spec_path) console.log(`   📎 Spec: ${activity.spec_path}`);
      if (activity.context_path) console.log(`   📎 Context: ${activity.context_path}`);
      console.log(`   🕒 ${new Date(activity.created_at).toLocaleString()}`);
    });

    // Save to database if migration has been run
    try {
      await generator.saveToDatabase();
    } catch (dbError) {
      console.warn('⚠️  Could not save to database (migration may not be run yet):', dbError.message);
    }

    // Export to JSON
    await generator.exportToJson(outputPath);

    console.log('\n✨ Activity generation complete!');

  } catch (error) {
    console.error('❌ Error generating activities:', error);
    process.exit(1);
  } finally {
    generator.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default ActivityGenerator;