const cron = require('node-cron');
const { runReminders } = require('./reminders.service');

let task = null;

function startReminderJob() {
  if (task) return task;
  // Todo dia às 08:00 de Brasília
  task = cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        const r = await runReminders(new Date());
        // eslint-disable-next-line no-console
        console.log(`[reminders] checked=${r.checked} sent=${r.sent} failed=${r.failed}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[reminders] erro', e.message);
      }
    },
    { timezone: 'America/Sao_Paulo' }
  );
  return task;
}

function stopReminderJob() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { startReminderJob, stopReminderJob };
