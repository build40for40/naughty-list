import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { seedStatements, bCorpRecords } from '../scripts/evidence.mjs';
import { evidenceStatements } from '../worker/imports.js';
import registry from '../data/companies.js';

// Execute real SQLite statements, with D1's binding/batch shape, rather than
// mocking query results. Transaction rollback is part of the import contract.
export function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_evidence.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_history.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0003_community.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...bindings) { values = bindings; return statement; },
        async all() { return { success: true, results: sqlite.prepare(sql).all(...values) }; },
        async first() { return sqlite.prepare(sql).get(...values) ?? null; },
        async run() { return { success: true, meta: sqlite.prepare(sql).run(...values) }; }
      };
      return statement;
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); }
  };
  return db;
}

export async function seededDatabase() {
  const db = database();
  const statements = [...seedStatements(), ...evidenceStatements('b-lab', bCorpRecords(), registry, crypto.randomUUID(), new Date('2026-11-04T12:00:00Z'))];
  await db.batch(statements.map(([sql, values]) => db.prepare(sql).bind(...values)));
  return db;
}
