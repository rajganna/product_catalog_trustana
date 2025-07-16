const spawn = require('child_process').spawn;
const fs = require('fs');

/**
 * Run npm script
 * @param command
 */
function npmRun(command) {
    return new Promise((resolve, reject) => {
        const log = fs.createWriteStream(__dirname + '/logs/migration.log', { flags: 'a' });
        const npmProcess = spawn('yarn', ['run', command]);

        npmProcess.stdout.on('data', data => {
            const stringData = data.toString();

            log.write(stringData);
            process.stdout.write(stringData);
        });

        npmProcess.stderr.on('data',data => {
            const stringData = data.toString();

            log.write(stringData);
            process.stderr.write(stringData);
        });

        npmProcess.on('error', e => {
          console.log(e.toString());
          log.end();

          reject();
        });

        npmProcess.on('exit', code => {
            log.write(`Migration exited with code: ${code}`);
            log.end();

            code === 0 ? resolve() : reject();
        });
    });
}

/**
 * Run migrations commands
 */
class MigrationRunner {
    /**
     * Run schema migration
     */
    static async run() {
        await npmRun('db:migrate');
        await npmRun('db:migrate:data');
    }

    /**
     * Run schema migration
     */
    static async rollback() {}
}

module.exports = MigrationRunner;
