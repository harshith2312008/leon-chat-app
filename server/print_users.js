const db = require('./database');

db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    // close isn't strictly necessary for a quick script but good practice
    // db.close(); 
    // However, the exported db object might not be easily closable if shared, 
    // but here we just want to print and exit.
});
