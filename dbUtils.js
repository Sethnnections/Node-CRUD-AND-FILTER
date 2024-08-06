const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');
});

function executeQuery(query, params, callback) {
    db.query(query, params, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

module.exports = {
    // Retrieve all records from a table
    selectAll: (table, callback) => {
        const query = `SELECT * FROM ??`;
        executeQuery(query, [table], callback);
    },

    // Retrieve a single record by ID from a table
    selectOne: (table, id, callback) => {
        const query = `SELECT * FROM ?? WHERE id = ?`;
        executeQuery(query, [table, id], callback);
    },

    // Insert a single record into a table
    insert: (table, data, callback) => {
        const query = `INSERT INTO ?? SET ?`;
        executeQuery(query, [table, data], callback);
    },

    // Insert multiple records into a table
    insertMany: (table, data, callback) => {
        const query = `INSERT INTO ?? (??) VALUES ?`;
        const fields = Object.keys(data[0]);
        const values = data.map(item => fields.map(field => item[field]));
        executeQuery(query, [table, fields, values], callback);
    },

    // Update a single record by ID in a table
    updateOne: (table, id, data, callback) => {
        const query = `UPDATE ?? SET ? WHERE id = ?`;
        executeQuery(query, [table, data, id], callback);
    },

    // Update multiple records in a table with a condition
    updateMany: (table, data, condition, conditionParams, callback) => {
        const query = `UPDATE ?? SET ? WHERE ${condition}`;
        executeQuery(query, [table, data, ...conditionParams], callback);
    },

    // Delete a single record by ID from a table
    deleteOne: (table, id, callback) => {
        const query = `DELETE FROM ?? WHERE id = ?`;
        executeQuery(query, [table, id], callback);
    },

    // Delete multiple records from a table with a condition
    deleteMany: (table, condition, conditionParams, callback) => {
        const query = `DELETE FROM ?? WHERE ${condition}`;
        executeQuery(query, [table, ...conditionParams], callback);
    },

    // Select items by a list of IDs
    selectByIds: (table, ids, callback) => {
        const query = `SELECT * FROM ?? WHERE id IN (?)`;
        executeQuery(query, [table, ids], callback);
    },

    // Transfer items from one table to another
    transfer: (sourceTable, targetTable, ids, callback) => {
        // Step 1: Select items from the source table
        this.selectByIds(sourceTable, ids, (err, results) => {
            if (err) return callback(err);

            // Step 2: Insert items into the target table
            this.insertMany(targetTable, results, (err) => {
                if (err) return callback(err);

                // Step 3: Delete items from the source table
                const condition = 'id IN (?)';
                this.deleteMany(sourceTable, condition, [ids], callback);
            });
        });
    }
};
