import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Operator-only CLI using the existing Cloudflare auth profile, never a public
// moderation endpoint. Identifiers are validated before entering SQL.
const args = process.argv.slice(2);
const remote = args.includes('--remote');
const positional = args.filter(arg => arg !== '--remote' && arg !== '--local');
const [action, brand, user, reason] = positional;
let sql;
if (action === 'queue' && positional.length === 1) {
  sql = "SELECT company_id,window_start,created_at,status FROM community_review_flags WHERE status='pending' ORDER BY created_at;";
} else if (action === 'reviewed' && positional.length === 3 && /^[a-z0-9-]{1,100}$/.test(brand) && /^\d+$/.test(user)) {
  sql = `UPDATE community_review_flags SET status='reviewed' WHERE company_id='${brand}' AND window_start=${user};`;
} else if (['exclude', 'restore'].includes(action) && positional.length === 4 && /^[a-z0-9-]{1,100}$/.test(brand) && /^user_[a-zA-Z0-9]+$/.test(user) &&
  (action === 'exclude' ? ['spam', 'automation', 'coordinated_manipulation'].includes(reason) : reason === 'review_correction')) {
  sql = `INSERT INTO community_moderation(id,company_id,user_id,action,reason,created_at)
    SELECT '${crypto.randomUUID()}',company_id,user_id,'${action}','${reason}','${new Date().toISOString()}'
    FROM community_votes WHERE company_id='${brand}' AND user_id='${user}';
    UPDATE community_votes SET excluded=${action === 'exclude' ? 1 : 0} WHERE company_id='${brand}' AND user_id='${user}';`;
} else {
  throw new Error('Use queue; reviewed <brand> <window>; exclude <brand> <user_id> <spam|automation|coordinated_manipulation>; restore <brand> <user_id> review_correction. Default: local. Add --remote for production.');
}
const staging = mkdtempSync(join(tmpdir(), 'naughty-list-moderation-'));
try {
  const file = join(staging, 'moderation.sql');
  writeFileSync(file, sql);
  execFileSync('npm', ['run', 'wrangler', '--', 'd1', 'execute', 'naughty-list', remote ? '--remote' : '--local', '--file', file], { stdio: 'inherit' });
} finally { rmSync(staging, { recursive: true, force: true }); }
