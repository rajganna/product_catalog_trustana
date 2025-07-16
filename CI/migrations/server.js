const tar = require('tar');
const express = require('express');
const runner = require('./MigrationRunner');
const app = express();
const port = 8000;
let status = 'PROCESSING';

app.post('/update', (req, res) => {
    runner.run()
        .then(() => {
            status = 'SUCCESS';
        })
        .catch(e => {
            console.log('Migration failed');
            console.log(e.toString());
            status = 'FAILED';
        });
  res.sendStatus(200);
});

app.post('/rollback', (req, res) => {
    status = 'PROCESSING';

    runner.rollback()
        .then(() => {
            status = 'SUCCESS';
        })
        .catch(() => {
            status = 'FAILED';
        });
    res.sendStatus(200);
});

app.get('/migration_results', (req, res) => {
    tar.c({
        gzip: true,
        file: __dirname + '/logs/migration.log.tar.gz'
    }, [__dirname + '/logs/migration.log']
    )
        .then(_ => {
            res.sendFile(__dirname + '/logs/migration.log.tar.gz');
        })
        .catch(err => {
            console.log(err.toString());
            res.status(500).send(err.toString());
        });
});

app.get('/status', (req, res) => {
    return res.json({ status });
});

app.listen(port, () => process.stdout.write(`Listening on port ${port}!`));
