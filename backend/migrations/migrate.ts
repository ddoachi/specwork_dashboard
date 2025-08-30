#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { Database } from 'sqlite3';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

class MigrationRunner {
  private db: Database;
  private migrationsDir: string;

  constructor(databasePath: string, migrationsDir: string) {
    this.db = new Database(databasePath);
    this.migrationsDir = migrationsDir;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create migrations tracking table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS migrations (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async getAppliedMigrations(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id FROM migrations ORDER BY id',
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.id));
        }
      );
    });
  }

  async getAllMigrations(): Promise<Migration[]> {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(filename => {
      const id = path.basename(filename, '.sql');
      const sql = fs.readFileSync(path.join(this.migrationsDir, filename), 'utf8');
      return { id, filename, sql };
    });
  }

  async applyMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        this.db.exec(migration.sql, (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(new Error(`Failed to apply migration ${migration.id}: ${err.message}`));
            return;
          }

          this.db.run(
            'INSERT INTO migrations (id, filename) VALUES (?, ?)',
            [migration.id, migration.filename],
            (insertErr) => {
              if (insertErr) {
                this.db.run('ROLLBACK');
                reject(new Error(`Failed to record migration ${migration.id}: ${insertErr.message}`));
                return;
              }

              this.db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  reject(new Error(`Failed to commit migration ${migration.id}: ${commitErr.message}`));
                } else {
                  resolve();
                }
              });
            }
          );
        });
      });
    });
  }

  async run(): Promise<void> {
    try {
      await this.init();
      
      const [appliedMigrations, allMigrations] = await Promise.all([
        this.getAppliedMigrations(),
        this.getAllMigrations()
      ]);

      const pendingMigrations = allMigrations.filter(
        migration => !appliedMigrations.includes(migration.id)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations.');
        return;
      }

      console.log(`Applying ${pendingMigrations.length} migration(s)...`);

      for (const migration of pendingMigrations) {
        console.log(`Applying migration: ${migration.filename}`);
        await this.applyMigration(migration);
        console.log(`✓ Applied: ${migration.filename}`);
      }

      console.log('All migrations applied successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      this.db.close();
    }
  }
}

// Main execution
async function main() {
  const databasePath = process.env.DB_PATH || '../db/specs.sqlite';
  const migrationsDir = process.argv[2] || __dirname;

  const runner = new MigrationRunner(databasePath, migrationsDir);
  await runner.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Migration runner failed:', error);
    process.exit(1);
  });
}