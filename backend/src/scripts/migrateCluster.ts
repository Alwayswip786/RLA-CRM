import { MongoClient } from 'mongodb';

const SOURCE_URI = 'mongodb+srv://fate_db_user:TB24GjYlwVT9USG0@agencycluster.wdmbaj6.mongodb.net/rla_crm?retryWrites=true&w=majority';
const TARGET_URI = 'mongodb+srv://fate_db_user:PRhJo7omNIKfNj0Y@rlacluster.npro9tu.mongodb.net/rla_crm?retryWrites=true&w=majority';
const DB_NAME = 'rla_crm';

async function migrateData() {
  console.log('=====================================================');
  console.log('🚀 RLA CRM Database Migration: Source -> New Cluster');
  console.log('=====================================================');
  console.log(`Source: agencycluster.wdmbaj6.mongodb.net/${DB_NAME}`);
  console.log(`Target: rlacluster.npro9tu.mongodb.net/${DB_NAME}\n`);

  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    console.log('⏳ Connecting to Source Cluster...');
    await sourceClient.connect();
    console.log('✅ Connected to Source Cluster.');

    console.log('⏳ Connecting to Target Cluster...');
    await targetClient.connect();
    console.log('✅ Connected to Target Cluster.\n');

    const sourceDb = sourceClient.db(DB_NAME);
    const targetDb = targetClient.db(DB_NAME);

    const collections = await sourceDb.listCollections().toArray();
    console.log(`📋 Discovered ${collections.length} collection(s) in source database:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('-----------------------------------------------------');

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const count = await sourceCol.countDocuments();
      console.log(`\n📦 Processing collection: [${colName}] (Source documents: ${count})`);

      if (count > 0) {
        // Fetch all documents exactly as they exist in source
        const docs = await sourceCol.find({}).toArray();

        // Clear existing target collection if any to allow clean idempotency
        const targetCount = await targetCol.countDocuments();
        if (targetCount > 0) {
          console.log(`   ⚠️ Target [${colName}] already has ${targetCount} docs. Clearing target collection...`);
          await targetCol.deleteMany({});
        }

        // Insert into target preserving _id and document structure
        console.log(`   ➡️ Inserting ${docs.length} documents into target [${colName}]...`);
        const insertResult = await targetCol.insertMany(docs, { ordered: true });
        console.log(`   ✅ Inserted ${insertResult.insertedCount} documents successfully.`);
      } else {
        console.log(`   ℹ️ Collection [${colName}] is empty in source. Ensuring collection exists in target...`);
        // Ensure collection exists
        const targetCols = await targetDb.listCollections({ name: colName }).toArray();
        if (targetCols.length === 0) {
          await targetDb.createCollection(colName);
        }
      }

      // Replicate indexes (excluding default _id index)
      try {
        const indexes = await sourceCol.indexes();
        for (const idx of indexes) {
          if (idx.name === '_id_') continue;
          console.log(`   🔑 Copying index [${idx.name}] for key:`, JSON.stringify(idx.key));
          const { key, v, ns, ...indexOptions } = idx;
          await targetCol.createIndex(key, indexOptions);
        }
      } catch (idxErr: any) {
        console.warn(`   ⚠️ Warning copying indexes for [${colName}]:`, idxErr.message);
      }
    }

    console.log('\n=====================================================');
    console.log('📊 MIGRATION VERIFICATION & AUDIT REPORT');
    console.log('=====================================================');

    let allMatch = true;
    for (const colInfo of collections) {
      const colName = colInfo.name;
      const srcCount = await sourceDb.collection(colName).countDocuments();
      const tgtCount = await targetDb.collection(colName).countDocuments();
      const status = srcCount === tgtCount ? '✅ MATCH' : '❌ MISMATCH';
      if (srcCount !== tgtCount) allMatch = false;
      console.log(`${colName.padEnd(25)} | Source: ${srcCount.toString().padEnd(4)} | Target: ${tgtCount.toString().padEnd(4)} | ${status}`);
    }

    console.log('=====================================================');
    if (allMatch) {
      console.log('🎉 ALL COLLECTIONS & RECORDS MIGRATED 100% SUCCESSFULLY!');
    } else {
      console.error('❌ DISCREPANCIES FOUND BETWEEN SOURCE AND TARGET!');
      process.exitCode = 1;
    }

  } catch (error: any) {
    console.error('💥 Fatal Migration Error:', error.message || error);
    process.exitCode = 1;
  } finally {
    await sourceClient.close();
    await targetClient.close();
    console.log('🔒 Closed all database connections.');
  }
}

migrateData();
