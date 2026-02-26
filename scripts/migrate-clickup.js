#!/usr/bin/env node
/**
 * ClickUp → Forge Migration Script
 * 
 * Reads CSV exports from inbox/ClickUp/ and transforms them into
 * Forge-compatible JSON data files.
 * 
 * Usage: node scripts/migrate-clickup.js [--dry-run] [--verbose]
 * 
 * CSV files expected at:
 *   ~/Documents/inbox/ClickUp/1. Time Tracking - Income/Time_Tracking_Income.csv
 *   ~/Documents/inbox/ClickUp/2. A2P/A2P_List.csv
 *   ~/Documents/inbox/ClickUp/3. Tasks Dump/Tasks_Dump.csv
 *   ~/Documents/inbox/ClickUp/CC Dues - Subscriptions - Routines/Subscriptions.csv
 *   ~/Documents/inbox/ClickUp/CC Dues - Subscriptions - Routines/CC_Due.csv
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const INBOX_DIR = path.resolve(process.env.HOME, 'Documents/inbox/to-delete/ClickUp');

const CSV_PATHS = {
  income: path.join(INBOX_DIR, '1. Time Tracking - Income', 'Time_Tracking_Income.csv'),
  a2p: path.join(INBOX_DIR, '2. A2P', 'A2P_List.csv'),
  tasks: path.join(INBOX_DIR, '3. Tasks Dump', 'Tasks_Dump.csv'),
  subscriptions: path.join(INBOX_DIR, 'CC Dues - Subscriptions - Routines', 'Subscriptions.csv'),
  creditCards: path.join(INBOX_DIR, 'CC Dues - Subscriptions - Routines', 'CC_Due.csv'),
};

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// ─── CSV Parser (handles quoted fields with commas/newlines) ─────────────────

function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (inQuotes) {
      current += '\n' + line;
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        inQuotes = false;
        rows.push(current);
        current = '';
      }
    } else {
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        inQuotes = true;
        current = line;
      } else {
        rows.push(line);
      }
    }
  }
  if (current) rows.push(current);

  if (rows.length === 0) return [];

  const parseRow = (row) => {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQ) {
        if (ch === '"' && row[i + 1] === '"') {
          field += '"';
          i++;
        } else if (ch === '"') {
          inQ = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQ = true;
        } else if (ch === ',') {
          fields.push(field.trim());
          field = '';
        } else {
          field += ch;
        }
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = parseRow(rows[0]);
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    const fields = parseRow(row);
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = fields[idx] || '';
    });
    records.push(record);
  }
  return records;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { if (VERBOSE) console.log(`  ${msg}`); }

function parseClickUpDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  // ClickUp dates: "Wednesday, July 2nd 2025" or "Sunday, June 1st 2025, 11:02:52 pm -07:00"
  const cleaned = dateStr
    .replace(/(\d+)(st|nd|rd|th)/, '$1')
    .replace(/\s+-\d{2}:\d{2}$/, ''); // strip timezone offset
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseCurrency(val) {
  if (!val || val === '') return 0;
  const num = parseFloat(String(val).replace(/[$,]/g, ''));
  return isNaN(num) ? 0 : num;
}

function parseNumber(val) {
  if (!val || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// Map ClickUp client names → existing client IDs
const CLIENT_NAME_MAP = {
  'school of mentors': 'school-of-mentors',
  'school of mentors - joel': 'school-of-mentors',
  'joel / isaac': 'joel-isaac',
  'joel/isaac': 'joel-isaac',
  'joel kaplan': 'joel-isaac',
  'bluecollarking': 'bluecollarking',
  'blue collar king': 'bluecollarking',
  'caseengine': 'case-engine',
  'case engine': 'case-engine',
  'ghl affiliate': 'ghl-affiliate',
  'mechanic plug': 'mechanic-plug',
  'chris coco': 'mechanic-plug',
  'chris coco (mechanic plug)': 'mechanic-plug',
  'platinum portrait artists': 'platinum-portrait-artists',
  'platinumportraitartists': 'platinum-portrait-artists',
  'cutrate mortgage': 'cutrate-mortgage',
  'anotherzero': 'anotherzero',
  'myskin': 'myskin',
  'partner & scale': 'partner-scale',
  'partner & scale - paul d': 'partner-scale',
  'partner and scale': 'partner-scale',
  'swati': 'swati',
  'swati course ghl': 'swati',
};

function resolveClientId(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return CLIENT_NAME_MAP[key] || null;
}

// Map ClickUp dropdown values like "CaseEngine - Cyle P", "BCK - Matt M"
function resolveClientIdFromDropdown(dropdown) {
  if (!dropdown) return null;
  const key = dropdown.toLowerCase().trim();
  const dropdownMap = {
    'caseengine - cyle p': 'case-engine',
    'mechanic plug - chris c': 'mechanic-plug',
    'bck - matt m': 'bluecollarking',
    'school of mentors - joel': 'school-of-mentors',
    'som - joel': 'school-of-mentors',
    'joel kaplan': 'joel-isaac',
    'joel / isaac': 'joel-isaac',
    'ghl affiliate': 'ghl-affiliate',
    'platinumportraitartists': 'platinum-portrait-artists',
    'platinum portrait artists': 'platinum-portrait-artists',
    'partner & scale - paul d': 'partner-scale',
    'agencyclients': 'ghl-affiliate', // Agency clients → GHL Affiliate
    'ems - mike r': null,  // historical client — create stub
    'agency lab': null,
    'somerled': null,
    'bnb - damon niquet': null,
    'one-off': null,
    'clicktitan - brandon s': null,
    'homexperts usa - joe cho': null,
    'ben hoang': null,
  };
  if (key in dropdownMap) return dropdownMap[key];
  // Try first word match
  return resolveClientId(dropdown.split(' - ')[0]);
}

function resolveClientFromTaskName(taskName) {
  // Task names like "School of Mentors - 2026", "CaseEngine - July 2024", "Matt M - March 2025"
  // Strip trailing year, month+year, or month patterns
  let clientPart = taskName
    .replace(/\s*-\s*\d{4}$/, '')                           // "- 2026"
    .replace(/\s*-\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}$/i, '') // "- July 2024"
    .replace(/\s*-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}$/i, '') // "- Feb 2025"
    .replace(/\s*-\s*(?:1\/2|2\/2)\s+\w+$/i, '')            // "- 1/2 March"
    .replace(/\s*-\s*(?:1\/2|2\/2)\s+\w+\s*\d*$/i, '')      // "- 2/2 Jun"
    .replace(/\s*-\s*(?:Extra\s+\w+|Tech\s+Work).*$/i, '')  // "- Extra Tasks", "- Tech Work - ..."
    .trim();
  
  // Additional name mappings for historical entries
  const extraMap = {
    'matt m': 'bluecollarking',
    'matt murray': 'bluecollarking',
    'somerled': null,  // unknown — will create stub
    'ems': null,
    'agency lab': null,
    'agencyclients': null,
    'damon niquet': null,
    'barbara': null,
    'ben hoang': null,
    'joe cho': null,
    'som coaching call': 'school-of-mentors',
    'al': null,
    'a2p registration and gmb fix': null,
    'styled survey': null,
  };
  
  const key = clientPart.toLowerCase().trim();
  if (key in extraMap) return extraMap[key];
  return resolveClientId(clientPart);
}

// ─── Backup ──────────────────────────────────────────────────────────────────

function backupData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, timestamp);
  fs.mkdirSync(backupPath, { recursive: true });

  const filesToBackup = ['clients.json', 'time-entries.json', 'a2p.json', 'drops.json'];
  let backed = 0;
  for (const file of filesToBackup) {
    const src = path.join(DATA_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(backupPath, file));
      backed++;
    }
  }
  console.log(`📦 Backed up ${backed} files to data/backups/${timestamp}/`);
  return backupPath;
}

// ─── Migration: Time Tracking / Income → billingPeriods in time.json ─────────

function migrateIncome(report) {
  const csvPath = CSV_PATHS.income;
  if (!fs.existsSync(csvPath)) {
    report.warnings.push('Income CSV not found — skipping billing periods migration');
    return null;
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(raw);
  report.counts.incomeRows = records.length;

  const billingPeriods = [];
  const monthMap = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
  };

  for (const row of records) {
    const taskName = row['Task Name'] || '';
    const clientId = resolveClientFromTaskName(taskName);
    const clientDropdown = row['Client (drop down)'] || '';

    // Extract month and year
    const monthField = (row['Month (drop down)'] || '').toLowerCase().trim();
    const yearField = (row['Year (drop down)'] || '').trim();
    const month = monthMap[monthField] || null;
    const year = parseInt(yearField) || null;

    if (!month || !year) {
      log(`Skipping row with no month/year: "${taskName}"`);
      report.warnings.push(`No month/year for: "${taskName}"`);
      continue;
    }

    // Also try the dropdown field (more reliable for older entries)
    const dropdownClientId = resolveClientIdFromDropdown(clientDropdown);
    const finalClientId = clientId || dropdownClientId;
    if (!finalClientId) {
      report.warnings.push(`Unknown client: "${taskName}" (dropdown: "${clientDropdown}")`);
    }

    // Parse income columns
    const incomeTracked = parseCurrency(row['$ (Tracked) (formula)']);
    const incomeRetainer = parseCurrency(row['Retainer (currency)']);
    const incomeProject = parseCurrency(row['Single Project (currency)']);
    const monthlyTotalRaw = parseCurrency(row['Monthly Total (formula)']);
    const monthlyTotal = monthlyTotalRaw || (incomeTracked + incomeRetainer + incomeProject);

    // Payment status mapping
    const statusMap = {
      'pending': 'pending',
      'sent for payment': 'invoiceSent',
      'received': 'received',
      'completed': 'completed',
    };
    const paymentStatusRaw = (row['Payment Status (drop down)'] || '').toLowerCase().trim();
    const paymentStatus = statusMap[paymentStatusRaw] || 'pending';

    // Period status from ClickUp task status
    const taskStatus = (row['Status'] || '').toLowerCase().trim();
    const periodStatusMap = {
      'next month': 'next',
      'current month': 'current',
      'past month': 'past',
      'completed': 'completed',
    };
    const periodStatus = periodStatusMap[taskStatus] || 'past';

    const dueDate = parseClickUpDate(row['Due Date']);

    billingPeriods.push({
      id: randomUUID(),
      clientId: finalClientId || `unknown-${taskName.toLowerCase().replace(/\W+/g, '-')}`,
      clientName: taskName.replace(/\s*-\s*\d{4}$/, '').trim(),
      month,
      year,
      status: periodStatus,
      paymentStatus,
      incomeTracked,
      incomeRetainer,
      incomeProject,
      monthlyTotal,
      invoiceNumber: '',
      invoiceSentDate: null,
      paymentReceivedDate: paymentStatus === 'received' ? new Date().toISOString() : null,
      notes: '',
      dueDate,
      createdAt: parseClickUpDate(row['Date Created']) || new Date().toISOString(),
    });

    log(`  Billing: ${taskName} → ${month}/${year} = $${monthlyTotal} (${paymentStatus})`);
  }

  report.counts.billingPeriods = billingPeriods.length;
  report.totals.totalRevenue = billingPeriods.reduce((s, bp) => s + bp.monthlyTotal, 0);
  report.totals.receivedRevenue = billingPeriods
    .filter(bp => bp.paymentStatus === 'received' || bp.paymentStatus === 'completed')
    .reduce((s, bp) => s + bp.monthlyTotal, 0);

  return billingPeriods;
}

// ─── Migration: Clients merge ────────────────────────────────────────────────

function migrateClients(billingPeriods, report) {
  const clientsPath = path.join(DATA_DIR, 'clients.json');
  const existing = JSON.parse(fs.readFileSync(clientsPath, 'utf-8'));

  // Extract unique client names from billing periods that don't match existing
  const existingIds = new Set(existing.clients.map(c => c.id));
  const newClients = [];

  if (billingPeriods) {
    const seenNames = new Set();
    for (const bp of billingPeriods) {
      if (!existingIds.has(bp.clientId) && !bp.clientId.startsWith('unknown-')) continue;
      if (bp.clientId.startsWith('unknown-') && !seenNames.has(bp.clientName)) {
        seenNames.add(bp.clientName);
        newClients.push({
          id: bp.clientId,
          name: bp.clientName,
          contact: '',
          business: '',
          status: 'active',
          rate: '',
          revenueModel: 'hourly',
          hourlyRate: 100,
          monthlyRetainer: 0,
          projectValue: 0,
          monthlyTotal: 0,
          paymentStatus: 'pending',
          since: new Date().toISOString().slice(0, 10),
          lastActivity: new Date().toISOString().slice(0, 10),
          tags: ['migrated-from-clickup'],
          notes: 'Auto-created during ClickUp migration — needs review',
          link: '',
        });
        report.warnings.push(`Created new client stub: "${bp.clientName}" — needs manual review`);
      }
    }
  }

  report.counts.existingClients = existing.clients.length;
  report.counts.newClients = newClients.length;

  return {
    clients: [...existing.clients, ...newClients],
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Migration: A2P ──────────────────────────────────────────────────────────

function migrateA2P(report) {
  const csvPath = CSV_PATHS.a2p;
  if (!fs.existsSync(csvPath)) {
    report.warnings.push('A2P CSV not found — skipping');
    return null;
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(raw);
  report.counts.a2pRows = records.length;

  const statusMap = {
    'to submit': 'to_submit',
    'submitted': 'submitted',
    'rejected': 'rejected',
    'rejected-resubmitted': 'rejected_resubmitted',
    'brand approved': 'brand_approved',
    'fully approved': 'fully_approved',
  };

  const regTypeMap = {
    'a2p 10dlc': 'a2p',
    'a2p': 'a2p',
    'toll free': 'toll_free',
    'toll-free': 'toll_free',
    'tollfree': 'toll_free',
  };

  const bizTypeMap = {
    'business': 'business',
    'sole proprietor': 'sole_prop',
    'sole prop': 'sole_prop',
  };

  const registrations = [];
  for (const row of records) {
    const taskName = row['Task Name'] || '';
    const statusRaw = (row['Status'] || '').toLowerCase().trim();
    const regTypeRaw = (row['Registration Type (drop down)'] || '').toLowerCase().trim();
    const bizTypeRaw = (row['Business Type (drop down)'] || '').toLowerCase().trim();

    const approvalTimeRaw = row['Approval Time (formula)'] || '';
    const approvalDays = parseNumber(approvalTimeRaw);

    registrations.push({
      id: randomUUID(),
      businessName: taskName.replace(/\s*-\s*(A2P|Toll Free|TF)$/i, '').trim(),
      status: statusMap[statusRaw] || 'to_submit',
      registrationType: regTypeMap[regTypeRaw] || 'a2p',
      businessType: bizTypeMap[bizTypeRaw] || 'business',
      dateCreated: parseClickUpDate(row['Date Created']) || new Date().toISOString(),
      dateSubmitted: '',
      dateBrandApproved: parseClickUpDate(row['Date Approved (date)']) || '', // ClickUp uses "Date Approved" for brand approved
      dateFullyApproved: '',
      approvalDays,
      notes: (row['Task Content'] || '').slice(0, 500),
      clientId: '',
    });

    log(`  A2P: ${taskName} → ${statusMap[statusRaw] || statusRaw}`);
  }

  report.counts.a2pRegistrations = registrations.length;
  return { registrations, lastUpdated: new Date().toISOString() };
}

// ─── Migration: Tasks Dump → Drops ───────────────────────────────────────────

function migrateTasks(report) {
  const csvPath = CSV_PATHS.tasks;
  if (!fs.existsSync(csvPath)) {
    report.warnings.push('Tasks Dump CSV not found — skipping');
    return null;
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(raw);
  report.counts.taskRows = records.length;

  // Load existing drops
  const dropsPath = path.join(DATA_DIR, 'drops.json');
  const existing = fs.existsSync(dropsPath)
    ? JSON.parse(fs.readFileSync(dropsPath, 'utf-8'))
    : { drops: [], lastUpdated: '' };

  const existingTitles = new Set(existing.drops.map(d => d.content.toLowerCase().trim()));
  const newDrops = [];

  const statusMap = {
    'to do': 'new',
    'ai created': 'new',
    'in progress': 'new',
    'hold/waiting': 'new',
    'for later': 'new',
    'complete': 'archived',
  };

  for (const row of records) {
    const title = (row['Task Name'] || '').trim();
    if (!title || existingTitles.has(title.toLowerCase())) continue;

    const clickupStatus = (row['Status'] || '').toLowerCase().trim();
    const isComplete = clickupStatus === 'complete';

    newDrops.push({
      id: randomUUID(),
      shortId: randomUUID().slice(0, 8),
      type: 'task',
      title,
      content: title,
      status: isComplete ? 'archived' : 'new',
      archived: isComplete,
      archivedAt: isComplete ? new Date().toISOString() : undefined,
      seen: isComplete,
      seenAt: isComplete ? new Date().toISOString() : undefined,
      replies: [],
      createdAt: parseClickUpDate(row['Date Created']) || new Date().toISOString(),
      updatedAt: parseClickUpDate(row['Date Updated']) || new Date().toISOString(),
    });
  }

  report.counts.newDrops = newDrops.length;
  report.counts.existingDrops = existing.drops.length;

  return {
    drops: [...existing.drops, ...newDrops],
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('');
  console.log('🔥 ClickUp → Forge Migration');
  console.log('═'.repeat(50));
  if (DRY_RUN) console.log('🏃 DRY RUN — no files will be written\n');

  const report = {
    counts: {},
    totals: {},
    warnings: [],
    written: [],
  };

  // Check which CSVs exist
  console.log('\n📂 CSV Files:');
  for (const [key, csvPath] of Object.entries(CSV_PATHS)) {
    const exists = fs.existsSync(csvPath);
    console.log(`  ${exists ? '✅' : '❌'} ${key}: ${path.basename(csvPath)}`);
  }

  // Backup
  if (!DRY_RUN) {
    console.log('');
    backupData();
  }

  // 1. Income / Billing Periods
  console.log('\n⏱️  Migrating Time Tracking / Income...');
  const billingPeriods = migrateIncome(report);

  if (billingPeriods) {
    // Read existing billing.json
    const billingPath = path.join(DATA_DIR, 'billing.json');
    const existingBilling = fs.existsSync(billingPath)
      ? JSON.parse(fs.readFileSync(billingPath, 'utf-8'))
      : { billingPeriods: [], lastUpdated: '' };

    // Merge: skip duplicates (same clientId + month + year)
    const existingKeys = new Set(
      (existingBilling.billingPeriods || []).map(bp => `${bp.clientId}-${bp.month}-${bp.year}`)
    );
    const newPeriods = billingPeriods.filter(bp => !existingKeys.has(`${bp.clientId}-${bp.month}-${bp.year}`));

    const billingData = {
      billingPeriods: [...(existingBilling.billingPeriods || []), ...newPeriods],
      lastUpdated: new Date().toISOString(),
    };

    if (!DRY_RUN) {
      fs.writeFileSync(billingPath, JSON.stringify(billingData, null, 2));
      report.written.push('billing.json');
    }
    console.log(`  ✅ ${newPeriods.length} new billing periods (${existingBilling.billingPeriods?.length || 0} existing kept)`);
  }

  // 2. Clients merge
  console.log('\n👥 Merging clients...');
  const clientsData = migrateClients(billingPeriods, report);
  if (!DRY_RUN) {
    fs.writeFileSync(path.join(DATA_DIR, 'clients.json'), JSON.stringify(clientsData, null, 2));
    report.written.push('clients.json');
  }
  console.log(`  ✅ ${clientsData.clients.length} total clients (${report.counts.newClients} new)`);

  // 3. A2P
  console.log('\n📡 Migrating A2P registrations...');
  const a2pData = migrateA2P(report);
  if (a2pData) {
    // Merge with existing
    const a2pPath = path.join(DATA_DIR, 'a2p.json');
    const existingA2P = fs.existsSync(a2pPath)
      ? JSON.parse(fs.readFileSync(a2pPath, 'utf-8'))
      : { registrations: [], lastUpdated: '' };

    const existingBizNames = new Set(existingA2P.registrations.map(r => r.businessName.toLowerCase()));
    const newRegs = a2pData.registrations.filter(r => !existingBizNames.has(r.businessName.toLowerCase()));

    const merged = {
      registrations: [...existingA2P.registrations, ...newRegs],
      lastUpdated: new Date().toISOString(),
    };

    if (!DRY_RUN) {
      fs.writeFileSync(a2pPath, JSON.stringify(merged, null, 2));
      report.written.push('a2p.json');
    }
    console.log(`  ✅ ${newRegs.length} new registrations (${existingA2P.registrations.length} existing kept)`);
    report.counts.a2pNew = newRegs.length;
  }

  // 4. Tasks → Drops
  console.log('\n📝 Migrating Tasks Dump → Drops...');
  const dropsData = migrateTasks(report);
  if (dropsData) {
    if (!DRY_RUN) {
      fs.writeFileSync(path.join(DATA_DIR, 'drops.json'), JSON.stringify(dropsData, null, 2));
      report.written.push('drops.json');
    }
    console.log(`  ✅ ${report.counts.newDrops} new drops added`);
  }

  // ─── Validation Report ───────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(50));
  console.log('📊 MIGRATION REPORT');
  console.log('═'.repeat(50));

  console.log('\n📈 Counts:');
  for (const [key, val] of Object.entries(report.counts)) {
    console.log(`  ${key}: ${val}`);
  }

  if (Object.keys(report.totals).length) {
    console.log('\n💰 Totals:');
    for (const [key, val] of Object.entries(report.totals)) {
      console.log(`  ${key}: $${val.toFixed(2)}`);
    }
  }

  if (report.written.length) {
    console.log(`\n📝 Files written: ${report.written.join(', ')}`);
  }

  if (report.warnings.length) {
    console.log(`\n⚠️  Warnings (${report.warnings.length}):`);
    report.warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('\n' + (DRY_RUN ? '🏃 Dry run complete — no files changed' : '✅ Migration complete!'));
  console.log('');
}

main();
