const cron = require('node-cron');
const { runRenewals } = require('./renewals.service');

let task = null;

function startRenewalJob() {
  if (task) return task;
  // Todo dia às 09:00 de Brasília, depois dos lembretes.
  task = cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        const r = await runRenewals(new Date());
        // eslint-disable-next-line no-console
        console.log(`[renewals] checked=${r.checked} created=${r.created} notified=${r.notified} failed=${r.failed}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[renewals] erro', e.message);
      }
    },
    { timezone: 'America/Sao_Paulo' }
  );
  return task;
}

function stopRenewalJob() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { startRenewalJob, stopRenewalJob };
