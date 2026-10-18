
const now = new Date();
const serverDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

console.log('--- Current State ---');
console.log('Server local time :', now.toString());
console.log('UTC time          :', now.toISOString());
console.log('Stored in DB as   :', serverDate.toISOString().split('T')[0]);

// Simulate server at 6:33 PM PDT June 8 (= UTC June 9 01:33)
console.log('\n--- Simulation: Server 6:33 PM PDT June 8 ---');
const sim1 = new Date('2026-06-09T01:33:00Z');
const sd1 = new Date(Date.UTC(sim1.getFullYear(), sim1.getMonth(), sim1.getDate()));
console.log('Server shows      :', sim1.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
console.log('Stored in DB as   :', sd1.toISOString().split('T')[0]);

// Simulate server at 2 PM PDT June 8 (= UTC June 8 21:00)
console.log('\n--- Simulation: Server 2 PM PDT June 8 ---');
const sim2 = new Date('2026-06-08T21:00:00Z');
const sd2 = new Date(Date.UTC(sim2.getFullYear(), sim2.getMonth(), sim2.getDate()));
console.log('Server shows      :', sim2.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
console.log('Stored in DB as   :', sd2.toISOString().split('T')[0]);
